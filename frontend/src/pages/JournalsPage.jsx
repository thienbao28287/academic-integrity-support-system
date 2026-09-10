import JournalAnalysis from "../features/journals/components/JournalAnalysis";
import JournalOverview from "../features/journals/components/JournalOverview";
import JournalSearch from "../features/journals/components/JournalSearch";
import useJournalLookup from "../features/journals/hooks/useJournalLookup";
import useJournalTrend from "../features/journals/hooks/useJournalTrend";

import "../features/journals/styles/JournalsPage.css";

function JournalsPage() {
  const lookup = useJournalLookup();
  const journalIssn = lookup.journal?.issnL || lookup.selectedIssn;
  const trend = useJournalTrend(journalIssn);
  const isAnalyzing = ["starting", "polling", "loading-result"].includes(trend.analysis.status);

  return (
    <section className="journals-page" aria-labelledby="journals-title">
      <JournalSearch lookup={lookup} />
      {lookup.detailStatus === "loading" && (
        <div className="journal-loading" aria-live="polite">
          <span className="auth-loading-spinner" aria-hidden="true" />
          <p>Đang tải thông tin tạp chí...</p>
        </div>
      )}
      {lookup.journal && (
        <div className="journal-results">
          <JournalOverview
            journal={lookup.journal}
            onChange={lookup.reset}
            onAnalyze={trend.start}
            isAnalyzing={isAnalyzing}
          />
          <JournalAnalysis analysis={trend.analysis} onRetry={trend.start} />
        </div>
      )}
    </section>
  );
}

export default JournalsPage;
