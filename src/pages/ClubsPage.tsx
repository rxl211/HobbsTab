import { useState } from "react";
import { Link } from "react-router-dom";

import { useAppData } from "../app/providers";
import { LineChart } from "../components/common/line-chart";
import { ClubDuesPeriodForm } from "../components/forms/club-dues-period-form";
import { ClubForm } from "../components/forms/club-form";
import { PlaneForm } from "../components/forms/plane-form";
import { PlaneRatePeriodForm } from "../components/forms/plane-rate-period-form";
import type { Club, Plane } from "../domain/clubs/club-types";
import { monthLabel } from "../domain/shared/dates";
import { buildDuesTrend, buildRateTrend } from "../domain/summaries/summary-view";
import { formatCurrency } from "../lib/formatters";

type ClubTab = "dues" | "planes";

const PlaneCard = ({ clubId, plane }: { clubId: string; plane: Plane }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRatesTableVisible, setIsRatesTableVisible] = useState(false);
  const {
    planeRatePeriods,
    updatePlane,
    createPlaneRatePeriod,
    removePlane,
    removePlaneRatePeriod,
  } = useAppData();

  const rates = planeRatePeriods.filter((period) => period.planeId === plane.id);
  const displayedRates = [...rates].sort((left, right) =>
    right.effectiveFrom.localeCompare(left.effectiveFrom),
  );
  const rateTrend = buildRateTrend(rates, [plane], formatCurrency);

  return (
    <article className="nested-card">
      <div className="section-heading">
        <div>
          <h3>{plane.name}</h3>
          <p className="subtle">{plane.active ? "Active plane" : "Inactive plane"}</p>
        </div>
        <div className="history-actions">
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setIsEditing((current) => !current);
            }}
          >
            {isEditing ? "Close" : "Rename"}
          </button>
          <button
            type="button"
            className="link-button danger"
            onClick={() => {
              void removePlane(plane.id);
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {isEditing ? (
        <PlaneForm
          clubId={clubId}
          initialValue={plane}
          submitLabel="Update plane"
          onSubmit={async (value) => {
            await updatePlane(value as typeof plane);
            setIsEditing(false);
          }}
        />
      ) : null}

      <section className="club-chart-section">
        <LineChart
          title="Plane rate over time"
          subtitle=""
          points={rateTrend}
          emptyMessage="No plane rate changes yet."
        />
      </section>

      <div className="stack-block">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setIsRatesTableVisible((current) => !current)}
        >
          {isRatesTableVisible ? "Hide table" : "View as table"}
        </button>
      </div>

      <div className="stack-block">
        <h3>Add plane rate</h3>
        <PlaneRatePeriodForm planeId={plane.id} onSubmit={createPlaneRatePeriod} />
      </div>

      {isRatesTableVisible ? (
        <div className="stack-block">
          <h3>Rate periods</h3>
          {rates.length === 0 ? (
            <p className="subtle">No rate periods yet.</p>
          ) : (
            <div className="history-list">
              {displayedRates.map((period) => (
                <div key={period.id} className="history-row compact">
                  <div>
                    <p className="history-title">{monthLabel(period.effectiveFrom.slice(0, 7))}</p>
                    <p className="history-meta">
                      {period.billingTimeType} billed - {formatCurrency(period.hourlyRate)}/hr
                    </p>
                  </div>
                  <div className="history-actions">
                    <button
                      type="button"
                      className="link-button danger"
                      onClick={() => {
                        void removePlaneRatePeriod(period.id);
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
      ) : null}
    </article>
  );
};

const ClubCard = ({ club }: { club: Club }) => {
  const [activeTab, setActiveTab] = useState<ClubTab>("dues");
  const [isDuesTableVisible, setIsDuesTableVisible] = useState(false);
  const {
    planes,
    clubDuesPeriods,
    createPlane,
    createClubDuesPeriod,
    removeClub,
    removeClubDuesPeriod,
  } = useAppData();

  const duesPeriods = clubDuesPeriods.filter((period) => period.clubId === club.id);
  const displayedDuesPeriods = [...duesPeriods].sort((left, right) =>
    right.effectiveFrom.localeCompare(left.effectiveFrom),
  );
  const clubPlanes = planes.filter((plane) => plane.clubId === club.id);
  const duesTrend = buildDuesTrend(duesPeriods, [club], formatCurrency);

  return (
    <article className="card club-card">
      <div className="section-heading">
        <div>
          <h2>{club.name}</h2>
          <p className="subtle">
            {club.active ? "Active" : "Inactive"}
            {club.notes ? ` - ${club.notes}` : ""}
          </p>
        </div>
        <div className="history-actions">
          <Link to={`/clubs/${club.id}/edit`} className="link-button">
            Rename
          </Link>
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

      <div className="club-tabbar" role="tablist" aria-label={`${club.name} sections`}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "dues"}
          className={activeTab === "dues" ? "club-tab active" : "club-tab"}
          onClick={() => setActiveTab("dues")}
        >
          Dues
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "planes"}
          className={activeTab === "planes" ? "club-tab active" : "club-tab"}
          onClick={() => setActiveTab("planes")}
        >
          Airplanes / Rates
        </button>
      </div>

      {activeTab === "dues" ? (
        <div className="page-stack">
          <section className="club-chart-section">
            <LineChart
              title="Club dues over time"
              subtitle=""
              points={duesTrend}
              emptyMessage="No club dues yet."
            />
          </section>

          <div className="stack-block">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsDuesTableVisible((current) => !current)}
            >
              {isDuesTableVisible ? "Hide table" : "View as table"}
            </button>
          </div>

          <div className="stack-block">
            <h3>Add dues period</h3>
            <ClubDuesPeriodForm clubId={club.id} onSubmit={createClubDuesPeriod} />
          </div>

          {isDuesTableVisible ? (
            <div className="stack-block">
              <h3>Club dues</h3>
              {duesPeriods.length === 0 ? (
                <p className="subtle">No dues periods yet.</p>
              ) : (
                <div className="history-list">
                  {displayedDuesPeriods.map((period) => (
                    <div key={period.id} className="history-row compact">
                      <div>
                        <p className="history-title">{monthLabel(period.effectiveFrom.slice(0, 7))}</p>
                        <p className="history-meta">dues {formatCurrency(period.monthlyDues)}</p>
                      </div>
                      <div className="history-actions">
                        <button
                          type="button"
                          className="link-button danger"
                          onClick={() => {
                            void removeClubDuesPeriod(period.id);
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
          ) : null}
        </div>
      ) : (
        <div className="page-stack">
          <div className="stack-block">
            <h3>Add plane</h3>
            <PlaneForm clubId={club.id} onSubmit={createPlane} />
          </div>

          <div className="stack-block">
            <h3>Planes</h3>
            {clubPlanes.length === 0 ? (
              <p className="subtle">No planes yet.</p>
            ) : (
              <div className="page-stack">
                {clubPlanes.map((plane) => (
                  <PlaneCard key={plane.id} clubId={club.id} plane={plane} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export const ClubsPage = () => {
  const { clubs, createClub } = useAppData();

  return (
    <div className="page-stack">
      <section className="card">
        <div className="section-heading">
          <h2>Add club</h2>
          <p className="subtle">
            Clubs hold monthly dues, while each plane carries its own billing mode and hourly rate history.
          </p>
        </div>
        <ClubForm onSubmit={createClub} />
      </section>

      <section className="page-stack">
        {clubs.length === 0 ? (
          <article className="card empty-state">
            <h2>No clubs yet</h2>
            <p>Add your club first, then add planes and dues history.</p>
          </article>
        ) : (
          clubs.map((club) => <ClubCard key={club.id} club={club} />)
        )}
      </section>
    </div>
  );
};
