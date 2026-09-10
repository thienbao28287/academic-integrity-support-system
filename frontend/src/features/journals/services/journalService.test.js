import { beforeEach, describe, expect, it, vi } from "vitest";

import { API } from "../../../constants/api";

const apiClient = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock("../../../services/apiClient", () => ({ default: apiClient }));

const { createTrendJob, getJournal, getTrendJob, getTrendResult, searchJournals } = await import("./journalService");

describe("journalService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("searches journals with the supplied query", async () => {
    const payload = { data: [{ issn: "0092-8674" }] };
    apiClient.get.mockResolvedValue({ data: payload });
    await expect(searchJournals("Cell")).resolves.toBe(payload);
    expect(apiClient.get).toHaveBeenCalledWith(API.JOURNALS.SEARCH, { params: { q: "Cell" } });
  });

  it("gets journal details by ISSN", async () => {
    apiClient.get.mockResolvedValue({ data: { data: {} } });
    await getJournal("0092-8674");
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/journals/0092-8674", {});
  });

  it("creates and follows a trend job", async () => {
    apiClient.post.mockResolvedValue({ data: { data: { jobId: "job-1" } } });
    apiClient.get.mockResolvedValue({ data: { data: {} } });
    await createTrendJob("0092-8674");
    await getTrendJob("job-1");
    await getTrendResult("job-1");
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/journals/0092-8674/trends", null, {});
    expect(apiClient.get).toHaveBeenNthCalledWith(1, "/api/v1/journals/trend-jobs/job-1", {});
    expect(apiClient.get).toHaveBeenNthCalledWith(2, "/api/v1/journals/trend-jobs/job-1/result", {});
  });
});
