import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type { Plane } from "../../domain/clubs/club-types";
import { flightPurposeLabel } from "../../domain/entries/entry-display";
import { formatDate, monthLabel } from "../../domain/shared/dates";
import type { HistoryRow } from "../../domain/summaries/summary-types";
import { formatCurrency, formatHours } from "../../lib/formatters";

interface HistoryListProps {
  rows: HistoryRow[];
  planes?: Plane[];
  onDeleteEntry?: (entryId: string) => Promise<void>;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  topContent?: ReactNode;
}

export const HistoryList = ({
  rows,
  planes = [],
  onDeleteEntry,
  title = "History",
  subtitle = "Stored entries plus monthly dues.",
  headerActions,
  topContent,
}: HistoryListProps) => {
  const planesById = new Map(planes.map((plane) => [plane.id, plane.name]));

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p className="subtle">{subtitle}</p>
        </div>
        {headerActions}
      </div>
      {topContent}
      {rows.length === 0 ? (
        <p className="subtle">No entries yet.</p>
      ) : (
        <div className="history-list">
          {rows.map((row) => (
            <article key={row.id} className="history-row">
              {row.kind === "syntheticDue" ? (
                <>
                  <div>
                    <p className="history-title">Monthly dues - {row.clubName}</p>
                    <p className="history-meta">
                      {monthLabel(row.monthKey)} • derived from club dues history
                    </p>
                  </div>
                  <div className="history-side">
                    <strong>{formatCurrency(row.monthlyDues)}</strong>
                  </div>
                </>
              ) : row.kind === "expense" ? (
                <>
                  <div>
                    <p className="history-title">{row.description}</p>
                    <p className="history-meta">
                      {formatDate(row.date)}
                      {row.note ? ` • ${row.note}` : ""}
                    </p>
                  </div>
                  <div className="history-side">
                    <strong>{formatCurrency(row.amount)}</strong>
                    <div className="history-actions">
                      <Link to={`/entries/${row.id}/edit`}>Edit</Link>
                      {onDeleteEntry ? (
                        <button
                          type="button"
                          className="link-button danger"
                          onClick={() => {
                            void onDeleteEntry(row.id);
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="history-title">
                      {row.clubId ? "Club flight" : "Non-club flight"} •{" "}
                      {flightPurposeLabel[row.purpose]}
                    </p>
                    <p className="history-meta">
                      {formatDate(row.date)} • {formatHours(row.flightTime)}
                      {row.planeId ? ` • ${planesById.get(row.planeId) ?? "Plane"}` : ""}
                      {` • billed ${row.billedTime} ${row.billingTimeTypeUsed}`}
                      {row.notes ? ` • ${row.notes}` : ""}
                    </p>
                  </div>
                  <div className="history-side">
                    <strong>{formatCurrency(row.aircraftCost + (row.instructorCost ?? 0))}</strong>
                    <div className="history-actions">
                      <Link to={`/entries/${row.id}/edit`}>Edit</Link>
                      {onDeleteEntry ? (
                        <button
                          type="button"
                          className="link-button danger"
                          onClick={() => {
                            void onDeleteEntry(row.id);
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
