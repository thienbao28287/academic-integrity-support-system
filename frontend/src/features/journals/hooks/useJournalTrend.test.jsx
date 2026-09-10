// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const services = vi.hoisted(() => ({ createTrendJob: vi.fn(), getTrendJob: vi.fn(), getTrendResult: vi.fn() }));
vi.mock("../services/journalService", () => services);

import useJournalTrend from "./useJournalTrend";

describe("useJournalTrend", () => {
  let container;
  let root;
  let current;

  function Probe() {
    current = useJournalTrend("0092-8674");
    return null;
  }

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<Probe />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it("polls a running job and loads its completed result", async () => {
    services.createTrendJob.mockResolvedValue({ data: { jobId: "job-1", status: "PROCESSING", percent: 10 } });
    services.getTrendJob.mockResolvedValue({ data: { jobId: "job-1", status: "COMPLETED", percent: 100 } });
    services.getTrendResult.mockResolvedValue({ data: { fromYear: 2001, toYear: 2026 } });
    await act(async () => current.start());
    expect(current.analysis.status).toBe("polling");
    await act(async () => vi.advanceTimersByTime(2000));
    expect(services.getTrendJob).toHaveBeenCalledWith("job-1", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(current.analysis.status).toBe("complete");
    expect(current.analysis.result.toYear).toBe(2026);
  });

  it("loads an immediately completed cached job without polling", async () => {
    services.createTrendJob.mockResolvedValue({ data: { jobId: "job-cache", status: "COMPLETED", fromCache: true } });
    services.getTrendResult.mockResolvedValue({ data: { fromYear: 2001, toYear: 2026 } });
    await act(async () => current.start());
    expect(services.getTrendJob).not.toHaveBeenCalled();
    expect(services.getTrendResult).toHaveBeenCalledWith("job-cache", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(current.analysis.status).toBe("complete");
  });

  it("exposes a failed job error for retry", async () => {
    services.createTrendJob.mockResolvedValue({ data: { jobId: "job-2", status: "PROCESSING" } });
    services.getTrendJob.mockResolvedValue({ data: { jobId: "job-2", status: "FAILED", error: "OpenAlex unavailable" } });
    await act(async () => current.start());
    await act(async () => vi.advanceTimersByTime(2000));
    expect(current.analysis.status).toBe("error");
    expect(current.analysis.error).toBe("OpenAlex unavailable");
  });
});
