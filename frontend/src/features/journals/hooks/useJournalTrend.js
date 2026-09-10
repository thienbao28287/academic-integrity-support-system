import { useEffect, useRef, useState } from "react";

import { createTrendJob, getTrendJob, getTrendResult } from "../services/journalService";
import { getJournalError } from "../utils/journal";

const TERMINAL_FAILURES = new Set(["FAILED", "ERROR", "CANCELLED"]);
const INITIAL_STATE = { status: "idle", job: null, result: null, error: "" };

export default function useJournalTrend(issn) {
  const controllerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const [analysis, setAnalysis] = useState(INITIAL_STATE);

  const cancel = () => {
    controllerRef.current?.abort();
    if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current);
    controllerRef.current = null;
    pollTimerRef.current = null;
  };

  useEffect(() => {
    cancel();
    setAnalysis(INITIAL_STATE);
    return cancel;
  }, [issn]);

  const loadResult = async (jobId, controller) => {
    setAnalysis((current) => ({ ...current, status: "loading-result" }));
    const response = await getTrendResult(jobId, { signal: controller.signal });
    if (!response?.data) throw new Error("Phản hồi phân tích không hợp lệ.");
    setAnalysis((current) => ({ ...current, status: "complete", result: response.data, error: "" }));
  };

  const poll = (jobId, controller) => {
    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const response = await getTrendJob(jobId, { signal: controller.signal });
        const job = response?.data;
        const status = String(job?.status || "").toUpperCase();
        if (!job) throw new Error("Không nhận được tiến độ phân tích.");
        if (TERMINAL_FAILURES.has(status)) throw new Error(job.error || "Job phân tích đã thất bại.");
        setAnalysis((current) => ({ ...current, status: status === "COMPLETED" ? "loading-result" : "polling", job }));
        if (status === "COMPLETED") await loadResult(jobId, controller);
        else poll(jobId, controller);
      } catch (error) {
        if (error?.name !== "CanceledError" && error?.code !== "ERR_CANCELED") {
          setAnalysis((current) => ({ ...current, status: "error", error: getJournalError(error, "Không thể cập nhật tiến độ phân tích.") }));
        }
      }
    }, 2000);
  };

  const start = async () => {
    if (!issn) return;
    cancel();
    const controller = new AbortController();
    controllerRef.current = controller;
    setAnalysis({ ...INITIAL_STATE, status: "starting" });

    try {
      const response = await createTrendJob(issn, { signal: controller.signal });
      const job = response?.data;
      if (!job?.jobId) throw new Error("Không nhận được mã job phân tích.");
      const status = String(job.status || "").toUpperCase();
      if (TERMINAL_FAILURES.has(status)) throw new Error(job.error || "Job phân tích đã thất bại.");
      setAnalysis({ status: status === "COMPLETED" ? "loading-result" : "polling", job, result: null, error: "" });
      if (status === "COMPLETED") await loadResult(job.jobId, controller);
      else poll(job.jobId, controller);
    } catch (error) {
      if (error?.name !== "CanceledError" && error?.code !== "ERR_CANCELED") {
        setAnalysis((current) => ({ ...current, status: "error", error: getJournalError(error, "Không thể bắt đầu phân tích.") }));
      }
    }
  };

  return { analysis, start, cancel };
}
