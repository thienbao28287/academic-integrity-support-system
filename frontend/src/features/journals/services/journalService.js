import { API } from "../../../constants/api";
import apiClient from "../../../services/apiClient";

export async function searchJournals(query, config = {}) {
  const response = await apiClient.get(API.JOURNALS.SEARCH, {
    ...config,
    params: { q: query },
  });

  return response.data;
}

export async function getJournal(issn, config = {}) {
  const response = await apiClient.get(API.JOURNALS.DETAIL(issn), config);

  return response.data;
}

export async function createTrendJob(issn, config = {}) {
  const response = await apiClient.post(API.JOURNALS.TRENDS(issn), null, config);

  return response.data;
}

export async function getTrendJob(jobId, config = {}) {
  const response = await apiClient.get(API.JOURNALS.TREND_JOB(jobId), config);

  return response.data;
}

export async function getTrendResult(jobId, config = {}) {
  const response = await apiClient.get(API.JOURNALS.TREND_RESULT(jobId), config);

  return response.data;
}
