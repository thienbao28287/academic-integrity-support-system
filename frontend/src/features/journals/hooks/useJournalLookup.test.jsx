// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const services = vi.hoisted(() => ({ searchJournals: vi.fn(), getJournal: vi.fn() }));
vi.mock("../services/journalService", () => services);

import useJournalLookup from "./useJournalLookup";

describe("useJournalLookup", () => {
  let container;
  let root;
  let current;

  function Probe() {
    current = useJournalLookup();
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

  it("debounces suggestions and ignores queries shorter than two characters", async () => {
    services.searchJournals.mockResolvedValue({ data: [{ issn: "0092-8674", displayName: "Cell" }] });
    act(() => current.setQuery("C"));
    await act(async () => vi.advanceTimersByTime(350));
    expect(services.searchJournals).not.toHaveBeenCalled();

    act(() => current.setQuery("Cell"));
    await act(async () => vi.advanceTimersByTime(300));
    expect(services.searchJournals).toHaveBeenCalledWith("Cell", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(current.suggestions[0].displayName).toBe("Cell");
  });

  it("normalizes an ISSN and loads journal details", async () => {
    services.getJournal.mockResolvedValue({ data: { issnL: "0092-8674", displayName: "Cell" } });
    act(() => current.setQuery("00928674"));
    await act(async () => current.submit());
    expect(services.getJournal).toHaveBeenCalledWith("0092-8674", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(current.journal.displayName).toBe("Cell");
    expect(current.detailStatus).toBe("success");
  });

  it("surfaces an API error without keeping stale journal data", async () => {
    services.getJournal.mockRejectedValue({ response: { data: { message: "Không tìm thấy tạp chí" } } });
    await act(async () => current.loadJournal("0092-8674"));
    expect(current.journal).toBeNull();
    expect(current.detailStatus).toBe("error");
    expect(current.message).toBe("Không tìm thấy tạp chí");
  });
});
