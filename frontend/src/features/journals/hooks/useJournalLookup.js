import { useEffect, useRef, useState } from "react";

import { getJournal, searchJournals } from "../services/journalService";
import { getJournalError, isIssn, normalizeIssn } from "../utils/journal";

export default function useJournalLookup() {
  const detailControllerRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQueryValue] = useState("");
  const [selectedIssn, setSelectedIssn] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchStatus, setSearchStatus] = useState("idle");
  const [journal, setJournal] = useState(null);
  const [detailStatus, setDetailStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => () => detailControllerRef.current?.abort(), []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2 || (selectedIssn && normalizeIssn(value) === selectedIssn)) {
      setSuggestions([]);
      setSearchStatus("idle");
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchStatus("loading");
      try {
        const response = await searchJournals(value, { signal: controller.signal });
        setSuggestions(Array.isArray(response?.data) ? response.data.slice(0, 10) : []);
        setSearchStatus("success");
      } catch (error) {
        if (error?.name !== "CanceledError" && error?.code !== "ERR_CANCELED") {
          setSuggestions([]);
          setSearchStatus("error");
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, selectedIssn]);

  const setQuery = (value) => {
    setQueryValue(value);
    setSelectedIssn("");
    setMessage("");
  };

  const loadJournal = async (rawIssn) => {
    const issn = normalizeIssn(rawIssn);
    if (!isIssn(issn)) {
      setMessage("ISSN cần có định dạng 1234-567X. Bạn cũng có thể chọn một tạp chí trong danh sách gợi ý.");
      return false;
    }

    detailControllerRef.current?.abort();
    const controller = new AbortController();
    detailControllerRef.current = controller;
    setQueryValue(issn);
    setSelectedIssn(issn);
    setSuggestions([]);
    setDetailStatus("loading");
    setMessage("");

    try {
      const response = await getJournal(issn, { signal: controller.signal });
      if (!response?.data) throw new Error("Phản hồi tạp chí không hợp lệ.");
      setJournal(response.data);
      setDetailStatus("success");
      return true;
    } catch (error) {
      if (error?.name !== "CanceledError" && error?.code !== "ERR_CANCELED") {
        setJournal(null);
        setDetailStatus("error");
        setMessage(getJournalError(error, "Không thể tìm thấy thông tin tạp chí."));
      }
      return false;
    }
  };

  const submit = (suggestion) => {
    if (isIssn(query)) return loadJournal(query);
    if (suggestion) return loadJournal(suggestion.issn);
    setMessage("Hãy nhập một ISSN hợp lệ hoặc chọn tạp chí từ danh sách gợi ý.");
    return Promise.resolve(false);
  };

  const reset = () => {
    detailControllerRef.current?.abort();
    setJournal(null);
    setSelectedIssn("");
    setSuggestions([]);
    setDetailStatus("idle");
    setMessage("");
    setQueryValue("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return {
    query,
    setQuery,
    selectedIssn,
    suggestions,
    searchStatus,
    journal,
    detailStatus,
    message,
    inputRef,
    loadJournal,
    submit,
    reset,
  };
}
