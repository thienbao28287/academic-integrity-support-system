import { describe, expect, it } from "vitest";

import { formatNumber, formatPercent, getJournalError, isIssn, normalizeIssn, topSeries } from "./journal";

describe("journal utilities", () => {
  it("normalizes and validates ISSNs", () => {
    expect(normalizeIssn(" 2002441x ")).toBe("2002-441X");
    expect(isIssn("2002-441x")).toBe(true);
    expect(isIssn("invalid")).toBe(false);
  });

  it("formats values and handles unavailable data", () => {
    expect(formatNumber(null)).toBe("Chưa có dữ liệu");
    expect(formatNumber(undefined)).toBe("Chưa có dữ liệu");
    expect(formatPercent(0.125)).toBe("12,5%");
  });

  it("uses API errors and sorts trend series", () => {
    expect(getJournalError({ response: { data: { message: "Không tìm thấy" } } }, "Lỗi")).toBe("Không tìm thấy");
    const sorted = topSeries([
      { name: "B", total: 2, byYear: [] },
      { name: "A", total: 10, byYear: [] },
    ], 1);
    expect(sorted[0].name).toBe("A");
  });
});
