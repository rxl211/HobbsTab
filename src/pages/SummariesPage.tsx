import { useAppData } from "../app/providers";
import { monthLabel } from "../domain/shared/dates";
import { formatCurrency, formatHours } from "../lib/formatters";

export const SummariesPage = () => {
  const { monthlySummaries } = useAppData();

  return (
    <div className="page-stack">
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Monthly rollup</h2>
            <p className="subtle">Derived month-by-month totals for your flying costs.</p>
          </div>
        </div>
        {monthlySummaries.length === 0 ? (
          <p className="subtle">No monthly data yet.</p>
        ) : (
          <div className="summary-table">
            {monthlySummaries.map((summary) => (
              <article key={summary.monthKey} className="summary-row">
                <div>
                  <h3>{monthLabel(summary.monthKey)}</h3>
                  <p className="summary-meta">
                    {summary.flightCount} flights • {summary.expenseCount} expense entries •{" "}
                    {formatHours(summary.hoursFlown)}
                  </p>
                </div>
                <div className="summary-values">
                  <span>Total {formatCurrency(summary.totalSpend)}</span>
                  <span>Fixed {formatCurrency(summary.fixedSpend)}</span>
                  <span>Variable {formatCurrency(summary.variableSpend)}</span>
                  <span>Training {formatCurrency(summary.trainingSpend)}</span>
                  <span>Hobby {formatCurrency(summary.hobbySpend)}</span>
                  <span>Cost/hr {formatCurrency(summary.costPerHour)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
