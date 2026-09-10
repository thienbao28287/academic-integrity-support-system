import { formatNumber } from "../utils/journal";
import { TrendDashboard } from "./JournalCharts";

export default function JournalAnalysis({ analysis, onRetry }) {
  const isAnalyzing = ["starting", "polling", "loading-result"].includes(analysis.status);

  if (isAnalyzing) {
    const percent = Math.min(100, Math.max(0, Number(analysis.job?.percent) || 0));
    return (
      <section className="analysis-progress" aria-live="polite" aria-busy="true">
        <div><strong>Đang phân tích dữ liệu OpenAlex</strong><span>{Math.round(percent)}%</span></div>
        <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
        <p>{formatNumber(analysis.job?.processedWorks ?? 0)} / {analysis.job?.totalWorks ? formatNumber(analysis.job.totalWorks) : "—"} tác phẩm đã xử lý</p>
      </section>
    );
  }

  if (analysis.status === "error") {
    return (
      <section className="journal-message error-message" role="alert">
        <div><strong>Không thể hoàn tất phân tích</strong><p>{analysis.error}</p></div>
        <button type="button" className="secondary-action" onClick={onRetry}>Thử lại</button>
      </section>
    );
  }

  if (analysis.status === "complete" && analysis.result) {
    return <TrendDashboard result={analysis.result} />;
  }

  return null;
}
