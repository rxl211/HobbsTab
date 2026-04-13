import { useEffect, useMemo, useState } from "react";

import type { MonthlySummary } from "../../domain/summaries/summary-types";
import {
  buildSpendTrendBuckets,
  trendGranularityLabels,
  type TrendGranularity,
} from "../../domain/summaries/summary-view";
import { formatCurrency } from "../../lib/formatters";

interface MonthTrendProps {
  summaries: MonthlySummary[];
}

export const MonthTrend = ({ summaries }: MonthTrendProps) => {
  const [granularity, setGranularity] = useState<TrendGranularity>("month");
  const [visibleCount, setVisibleCount] = useState(4);
  const title = granularity === "year" ? "Yearly trend" : "Monthly trend";
  const orderedBuckets = useMemo(
    () => buildSpendTrendBuckets(summaries, granularity),
    [summaries, granularity],
  );
  const visibleBuckets = orderedBuckets.slice(-visibleCount);
  const max = orderedBuckets.reduce((largest, bucket) => Math.max(largest, bucket.totalSpend), 0);

  useEffect(() => {
    setVisibleCount(4);
  }, [granularity]);

  if (orderedBuckets.length === 0) {
    return (
      <section className="card">
        <h2>{title}</h2>
        <p className="subtle">Log a flight or expense to start seeing monthly totals.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p className="subtle">Recent totals including club dues.</p>
        </div>
        <div className="segmented-control" aria-label="Trend granularity">
          {Object.entries(trendGranularityLabels).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={granularity === value ? "segmented-button active" : "segmented-button"}
              onClick={() => setGranularity(value as TrendGranularity)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="trend-list">
        {visibleBuckets.map((bucket) => {
          const width = max > 0 ? (bucket.totalSpend / max) * 100 : 0;
          return (
            <div key={bucket.id} className="trend-row">
              <div className="trend-labels">
                <span>{bucket.label}</span>
                <strong>{formatCurrency(bucket.totalSpend)}</strong>
              </div>
              <div className="trend-bar-track">
                <div className="trend-bar-fill" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {visibleCount < orderedBuckets.length ? (
        <div className="trend-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setVisibleCount((current) => current + (granularity === "month" ? 12 : 5));
            }}
          >
            View more
          </button>
        </div>
      ) : null}
    </section>
  );
};
