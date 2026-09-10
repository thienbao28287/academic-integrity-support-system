import { formatNumber } from "../utils/journal";
import { LineChart, TopicDistribution } from "./JournalCharts";

function JournalBadge({ active, children }) {
  if (!active) return null;
  return <span className="journal-badge">{children}</span>;
}

export default function JournalOverview({ journal, onChange, onAnalyze, isAnalyzing }) {
  const years = (journal.yearlyStats || []).map((item) => item.year);
  const worksSeries = [{
    key: "works",
    name: "Tác phẩm",
    values: (journal.yearlyStats || []).map((item) => ({ year: item.year, value: item.worksCount })),
  }];
  const issnText = (journal.issns || []).filter(Boolean).join(" · ") || journal.issnL || "Chưa có dữ liệu";
  const yearText = journal.firstPublicationYear || journal.lastPublicationYear
    ? `${journal.firstPublicationYear || "?"} – ${journal.lastPublicationYear || "?"}`
    : "Chưa có dữ liệu";

  return (
    <>
      <article className="selected-journal-card">
        <div>
          <strong>{journal.displayName || "Tạp chí chưa có tên"}</strong>
          <p>{formatNumber(journal.worksCount)} tác phẩm <span>•</span> {journal.issnL || issnText} <span>•</span> {journal.publisher || "Chưa rõ nhà xuất bản"}</p>
        </div>
        <div className="selected-journal-actions">
          <button type="button" className="secondary-action" onClick={onChange}>Thay đổi</button>
          <button type="button" className="primary-action" onClick={onAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? "Đang phân tích..." : "Tìm nạp và phân tích"}
          </button>
        </div>
      </article>

      <section className="journal-overview" aria-labelledby="journal-name">
        <div className="journal-overview-heading">
          <div>
            <div className="journal-title-line">
              <span className="openalex-label">OPENALEX</span>
              <h2 id="journal-name">{journal.displayName || "Tạp chí chưa có tên"}</h2>
              {journal.type && <span className="journal-type">{journal.type}</span>}
            </div>
            <p><strong>{journal.publisher || "Chưa rõ nhà xuất bản"}</strong><span>ISSN {issnText}</span></p>
          </div>
          <div className="journal-links">
            {journal.countryCode && <span>{journal.countryCode}</span>}
            <JournalBadge active={journal.isOa}>OA</JournalBadge>
            <JournalBadge active={journal.isInDoaj}>DOAJ</JournalBadge>
            <JournalBadge active={journal.isCore}>CORE</JournalBadge>
            <JournalBadge active={journal.isOjs}>OJS</JournalBadge>
            {journal.homepageUrl && <a href={journal.homepageUrl} target="_blank" rel="noreferrer">Tạp chí ↗</a>}
          </div>
        </div>

        <dl className="journal-stats">
          <div><dd>{formatNumber(journal.worksCount)}</dd><dt>Tác phẩm</dt></div>
          <div><dd>{yearText}</dd><dt>Năm xuất bản</dt></div>
          <div><dd>{journal.apcUsd == null ? "Chưa có dữ liệu" : `${formatNumber(journal.apcUsd)} USD`}</dd><dt>APC</dt></div>
        </dl>

        <LineChart title="Số lượng tác phẩm mỗi năm" years={years} series={worksSeries} area />
        <TopicDistribution topics={journal.topics || []} />
      </section>
    </>
  );
}
