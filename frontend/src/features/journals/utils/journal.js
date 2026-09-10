const ISSN_PATTERN = /^\d{4}-\d{3}[\dX]$/;

export function normalizeIssn(value = "") {
  const compact = value.trim().toUpperCase().replace(/\s+/g, "");
  if (/^\d{7}[\dX]$/.test(compact)) {
    return `${compact.slice(0, 4)}-${compact.slice(4)}`;
  }
  return compact;
}

export function isIssn(value) {
  return ISSN_PATTERN.test(normalizeIssn(value));
}

export function formatNumber(value) {
  if (value == null || value === "") return "Chưa có dữ liệu";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? new Intl.NumberFormat("vi-VN").format(parsed) : "Chưa có dữ liệu";
}

export function formatPercent(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "Chưa có dữ liệu";
  const percent = parsed > 0 && parsed <= 1 ? parsed * 100 : parsed;
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(percent)}%`;
}

export function getJournalError(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export function topSeries(items = [], limit = 5) {
  return [...items]
    .filter((item) => item && Array.isArray(item.byYear))
    .sort((a, b) => Number(b.total || 0) - Number(a.total || 0))
    .slice(0, limit);
}
