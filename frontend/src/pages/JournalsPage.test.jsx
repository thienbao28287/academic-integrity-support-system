// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const services = vi.hoisted(() => ({
  searchJournals: vi.fn(),
  getJournal: vi.fn(),
  createTrendJob: vi.fn(),
  getTrendJob: vi.fn(),
  getTrendResult: vi.fn(),
}));

vi.mock("../features/journals/services/journalService", () => services);
vi.mock("../features/journals/components/JournalCharts", () => ({
  LineChart: ({ title }) => <div>{title}</div>,
  TopicDistribution: () => <div>Tổng hợp chủ đề</div>,
  TrendDashboard: ({ result }) => <div>Xu hướng {result.fromYear}–{result.toYear}</div>,
}));

import JournalsPage from "./JournalsPage";

const journal = {
  issnL: "0092-8674",
  issns: ["0092-8674"],
  displayName: "Cell",
  publisher: null,
  worksCount: 100,
  firstPublicationYear: 1974,
  lastPublicationYear: 2026,
  apcUsd: null,
  yearlyStats: [],
  topics: [],
};

describe("JournalsPage", () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<JournalsPage />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  function enterQuery(value) {
    const input = container.querySelector('input[role="combobox"]');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setter.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    return input;
  }

  it("debounces suggestions and ignores a one-character query", async () => {
    services.searchJournals.mockResolvedValue({ data: [{ issn: "0092-8674", displayName: "Cell", worksCount: 100 }] });
    enterQuery("C");
    await act(async () => vi.advanceTimersByTime(350));
    expect(services.searchJournals).not.toHaveBeenCalled();

    enterQuery("Cell");
    await act(async () => vi.advanceTimersByTime(300));
    expect(services.searchJournals).toHaveBeenCalledWith("Cell", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(container.textContent).toContain("Cell");
  });

  it("loads a journal from a directly entered ISSN and handles null fields", async () => {
    services.getJournal.mockResolvedValue({ data: journal });
    enterQuery("00928674");
    await act(async () => container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));

    expect(services.getJournal).toHaveBeenCalledWith("0092-8674", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(container.textContent).toContain("Cell");
    expect(container.textContent).toContain("Chưa rõ nhà xuất bản");
    expect(container.textContent).toContain("Chưa có dữ liệu");
  });

  it("polls a trend job until completion and renders its result", async () => {
    services.getJournal.mockResolvedValue({ data: journal });
    services.createTrendJob.mockResolvedValue({ data: { jobId: "job-1", status: "PROCESSING", percent: 10 } });
    services.getTrendJob.mockResolvedValue({ data: { jobId: "job-1", status: "COMPLETED", percent: 100 } });
    services.getTrendResult.mockResolvedValue({ data: { fromYear: 2001, toYear: 2026 } });

    enterQuery("0092-8674");
    await act(async () => container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    await act(async () => container.querySelector(".primary-action").click());
    expect(container.textContent).toContain("10%");

    await act(async () => vi.advanceTimersByTime(2000));
    expect(services.getTrendJob).toHaveBeenCalledWith("job-1", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(services.getTrendResult).toHaveBeenCalled();
    expect(container.textContent).toContain("Xu hướng 2001–2026");
  });
});
