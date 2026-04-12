import { Link } from "react-router-dom";

import { useAppData } from "../app/providers";
import { LineChart } from "../components/common/line-chart";
import { ClubForm } from "../components/forms/club-form";
import { RatePeriodForm } from "../components/forms/rate-period-form";
import { monthLabel } from "../domain/shared/dates";
import { buildDuesTrend, buildRateTrend } from "../domain/summaries/summary-view";
import { formatCurrency } from "../lib/formatters";

export const ClubsPage = () => {
  const {
    clubs,
    clubRatePeriods,
    createClub,
    createRatePeriod,
    removeClub,
    removeRatePeriod,
  } = useAppData();

  return (
    <div className="page-stack">
      <section className="card">
        <div className="section-heading">
          <h2>Add club</h2>
          <p className="subtle">
            Clubs are simple in v1, but rate periods are historical so derived dues can update retroactively.
          </p>
        </div>
        <ClubForm onSubmit={createClub} />
      </section>

      <section className="page-stack">
        {clubs.length === 0 ? (
          <article className="card empty-state">
            <h2>No clubs yet</h2>
            <p>Add your club first, then add one or more rate periods.</p>
          </article>
        ) : (
          clubs.map((club) => {
            const periods = clubRatePeriods.filter((period) => period.clubId === club.id);
            const duesTrend = buildDuesTrend(periods, [club], formatCurrency);
            const rateTrend = buildRateTrend(periods, [club], formatCurrency);

            return (
              <article key={club.id} className="card club-card">
                <div className="section-heading">
                  <div>
                    <h2>{club.name}</h2>
                    <p className="subtle">
                      {club.active ? "Active" : "Inactive"}
                      {club.notes ? ` • ${club.notes}` : ""}
                    </p>
                  </div>
                  <div className="history-actions">
                    <Link to={`/clubs/${club.id}/edit`}>Edit</Link>
                    <button
                      type="button"
                      className="link-button danger"
                      onClick={() => {
                        void removeClub(club.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="stack-block">
                  <h3>Rate periods</h3>
                  {periods.length === 0 ? (
                    <p className="subtle">No rate periods yet.</p>
                  ) : (
                    <div className="history-list">
                      {periods.map((period) => (
                        <div key={period.id} className="history-row compact">
                          <div>
                            <p className="history-title">
                              {monthLabel(period.effectiveFrom.slice(0, 7))}
                            </p>
                            <p className="history-meta">
                              {period.billingTimeType} billed • {formatCurrency(period.hourlyRate)}/hr • dues{" "}
                              {formatCurrency(period.monthlyDues)}
                            </p>
                          </div>
                          <div className="history-actions">
                            <button
                              type="button"
                              className="link-button danger"
                              onClick={() => {
                                void removeRatePeriod(period.id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="stack-block">
                  <h3>Add rate period</h3>
                  <RatePeriodForm clubId={club.id} onSubmit={createRatePeriod} />
                </div>

                <section className="page-grid club-chart-section">
                  <LineChart
                    title="Club dues over time"
                    subtitle="Actual club dues changes from rate history."
                    points={duesTrend}
                    emptyMessage="No club dues yet."
                  />
                  <LineChart
                    title="Club rate changes over time"
                    subtitle="Actual hourly rate changes from rate history."
                    points={rateTrend}
                    emptyMessage="No club rate changes yet."
                  />
                </section>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};
