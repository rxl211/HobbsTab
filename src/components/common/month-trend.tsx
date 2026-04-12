import { useState } from "react";

import { monthLabel } from "../../domain/shared/dates";
import type { MonthlySummary } from "../../domain/summaries/summary-types";
import { formatCurrency } from "../../lib/formatters";

interface MonthTrendProps {
  summaries: MonthlySummary[];
}

export const MonthTrend = ({ summaries }: MonthTrendProps) => {
  const [visibleCount, setVisibleCount] = useState(4);
  const visibleSummaries = summaries.slice(-visibleCount);
  const max = summaries.reduce((largest, summary) => Math.max(largest, summary.totalSpend), 0);

  if (summaries.length === 0) {
    return (
      <section className="card">
        <h2>Monthly trend</h2>
        <p className="subtle">Log a flight or expense to start seeing monthly totals.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="section-heading">
        <h2>Monthly trend</h2>
        <p className="subtle">Recent totals including club dues.</p>
      </div>
      <div className="trend-list">
        {visibleSummaries.map((summary) => {
          const width = max > 0 ? (summary.totalSpend / max) * 100 : 0;
          return (
            <div key={summary.monthKey} className="trend-row">
              <div className="trend-labels">
                <span>{monthLabel(summary.monthKey)}</span>
                <strong>{formatCurrency(summary.totalSpend)}</strong>
              </div>
              <div className="trend-bar-track">
                <div className="trend-bar-fill" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {visibleCount < summaries.length ? (
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setVisibleCount((current) => current + 12);
          }}
        >
          View more
        </button>
      ) : null}
    </section>
  );
};
