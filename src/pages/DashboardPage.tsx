import { useMemo, useState } from "react";

import { useAppData } from "../app/providers";
import { BackupCard } from "../components/common/backup-card";
import { DonutChart } from "../components/common/donut-chart";
import { HistoryList } from "../components/common/history-list";
import { MetricCard } from "../components/common/metric-card";
import { MonthTrend } from "../components/common/month-trend";
import {
  buildScopedMonthlySummaries,
  buildSummaryTotals,
  summaryScopeLabels,
  type SummaryScope,
} from "../domain/summaries/summary-view";
import { formatCurrency, formatHours } from "../lib/formatters";

export const DashboardPage = () => {
  const { historyRows, loading, monthlySummaries } = useAppData();
  const [scope, setScope] = useState<SummaryScope>("thisYear");

  const scopedMonthly = useMemo(
    () => buildScopedMonthlySummaries(monthlySummaries, scope),
    [monthlySummaries, scope],
  );
  const totals = useMemo(() => buildSummaryTotals(scopedMonthly), [scopedMonthly]);

  if (loading) {
    return <section className="card">Loading your local data...</section>;
  }

  return (
    <div className="page-stack">
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Dashboard</h2>
            <p className="subtle">Visual breakdowns of your flying costs over time.</p>
          </div>
          <div className="segmented-control">
            {Object.entries(summaryScopeLabels).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={scope === value ? "segmented-button active" : "segmented-button"}
                onClick={() => setScope(value as SummaryScope)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="page-stack">
          <section className="metric-grid">
            <MetricCard
              label="Total spend"
              value={formatCurrency(totals.totalSpend)}
            />
            <MetricCard
              label="Hours flown"
              value={formatHours(totals.hoursFlown)}
            />
            <MetricCard
              label="Months included"
              value={String(scopedMonthly.length)}
            />
          </section>

          <section className="page-grid">
            <DonutChart
              title="Fixed vs Variable"
              totalLabel={summaryScopeLabels[scope]}
              segments={[
                { label: "Fixed", value: totals.fixedSpend, color: "#2563eb" },
                { label: "Variable", value: totals.variableSpend, color: "#f59e0b" },
              ]}
            />
            <DonutChart
              title="Hobby vs Training / Check"
              totalLabel={summaryScopeLabels[scope]}
              segments={[
                { label: "Hobby", value: totals.hobbySpend, color: "#0f766e" },
                { label: "Training / Check", value: totals.trainingSpend, color: "#d97706" },
              ]}
            />
          </section>
        </div>
      </section>

      <MonthTrend summaries={monthlySummaries} />

      <HistoryList
        rows={historyRows.slice(0, 8)}
        title="Recent history"
        subtitle="Recent entries and club dues activity."
      />

      <BackupCard />
    </div>
  );
};
