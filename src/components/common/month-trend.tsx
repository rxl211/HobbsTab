import { useState } from "react";

import { monthKeysBetween, monthLabel } from "../../domain/shared/dates";
import type { MonthlySummary } from "../../domain/summaries/summary-types";
import { formatCurrency } from "../../lib/formatters";

interface MonthTrendProps {
  summaries: MonthlySummary[];
}

export const MonthTrend = ({ summaries }: MonthTrendProps) => {
  const [visibleCount, setVisibleCount] = useState(4);
  const summaryByMonth = new Map(summaries.map((summary) => [summary.monthKey, summary]));
  const sortedMonths = [...summaryByMonth.keys()].sort((left, right) => left.localeCompare(right));
  const orderedSummaries =
    sortedMonths.length === 0
      ? []
      : monthKeysBetween(sortedMonths[0], sortedMonths.at(-1) ?? sortedMonths[0]).map(
          (monthKey) =>
            summaryByMonth.get(monthKey) ?? {
              monthKey,
              totalSpend: 0,
              fixedSpend: 0,
              variableSpend: 0,
              hobbySpend: 0,
              trainingSpend: 0,
              checkFlightSpend: 0,
              hoursFlown: 0,
              costPerHour: 0,
              flightCount: 0,
              expenseCount: 0,
            },
        );
  const visibleSummaries = orderedSummaries.slice(-visibleCount);
  const max = orderedSummaries.reduce((largest, summary) => Math.max(largest, summary.totalSpend), 0);

  if (orderedSummaries.length === 0) {
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
      {visibleCount < orderedSummaries.length ? (
        <div className="trend-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setVisibleCount((current) => current + 12);
            }}
          >
            View more
          </button>
        </div>
      ) : null}
    </section>
  );
};
