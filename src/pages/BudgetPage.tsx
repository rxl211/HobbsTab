import { useEffect, useMemo, useState } from "react";

import { useAppData } from "../app/providers";
import { buildBudgetProjection } from "../domain/summaries/budget-view";
import { formatCurrency, formatHours, formatNumber } from "../lib/formatters";

const clampPercent = (value: number) => Math.max(0, Math.min(value, 100));
const budgetInputToNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const BudgetPage = () => {
  const {
    budgetSetting,
    clubs,
    clubDuesPeriods,
    planes,
    planeRatePeriods,
    entries,
    loading,
    updateAnnualBudget,
  } = useAppData();
  const [budgetInput, setBudgetInput] = useState(budgetSetting?.amount?.toString() ?? "");
  const [error, setError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [isBudgetEditorVisible, setIsBudgetEditorVisible] = useState(
    budgetSetting?.amount === undefined,
  );
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setBudgetInput(budgetSetting?.amount?.toString() ?? "");
  }, [budgetSetting?.amount]);

  useEffect(() => {
    if (budgetSetting?.amount === undefined) {
      setIsBudgetEditorVisible(true);
    }
  }, [budgetSetting?.amount]);

  const projection = useMemo(
    () =>
      buildBudgetProjection({
        annualBudget: budgetSetting?.amount,
        clubs,
        duesPeriods: clubDuesPeriods,
        planes,
        planeRatePeriods,
        entries,
      }),
    [budgetSetting?.amount, clubs, clubDuesPeriods, planes, planeRatePeriods, entries],
  );

  if (loading) {
    return <section className="card">Loading your local data...</section>;
  }

  const annualBudget = projection.annualBudget ?? 0;
  const fixedPercent = annualBudget > 0 ? (projection.fixedCosts / annualBudget) * 100 : 0;
  const flyingPercent = annualBudget > 0 ? (projection.flyingBudget / annualBudget) * 100 : 0;
  const completionPercent = projection.projectedFlightsCompletionPercent ?? 0;
  const budgetAvailable = projection.annualBudget !== undefined;

  return (
    <div className="page-stack">
      <section className="card viz-hero">
        <div className="viz-hero-copy">
          <p className="eyebrow">BUDGET</p>
          <h2>{currentYear} Flying Plan</h2>
          <p className="subtle">
            See how your annual budget translates into projected flight hours, total flights, and
            progress through the year.
          </p>
        </div>
        <div className="viz-hero-value">
          <span className="viz-kicker">Saved budget</span>
          <strong>{budgetAvailable ? formatCurrency(annualBudget) : "Not set"}</strong>
          <button
            type="button"
            className="final-budget-edit-button"
            onClick={() => {
              setIsBudgetEditorVisible((current) => !current);
              setError(undefined);
              setSuccessMessage(undefined);
            }}
          >
            {isBudgetEditorVisible ? "Close" : budgetAvailable ? "Edit budget" : "Set budget"}
          </button>

          {isBudgetEditorVisible ? (
            <form
              className="final-budget-inline-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setError(undefined);
                setSuccessMessage(undefined);

                const nextBudget = budgetInputToNumber(budgetInput);

                if (nextBudget === undefined || nextBudget < 0) {
                  setError("Enter a valid non-negative annual budget.");
                  return;
                }

                await updateAnnualBudget(nextBudget);
                setSuccessMessage(`Saved your ${currentYear} budget.`);
                setIsBudgetEditorVisible(false);
              }}
            >
              <label className="final-budget-inline-label">
                Annual budget
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={budgetInput}
                  onChange={(event) => {
                    setBudgetInput(event.target.value);
                    setError(undefined);
                    setSuccessMessage(undefined);
                  }}
                  placeholder="12000"
                />
              </label>
              <button type="submit" className="primary-button">
                Save
              </button>
            </form>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}
          {successMessage ? <div className="inline-note success-note">{successMessage}</div> : null}
        </div>
      </section>

      <section className="viz-grid">
        <article className="card viz-budget-card">
          <div className="section-heading">
            <div>
              <h3>Budget split</h3>
              <p className="subtle">Fixed dues versus flyable budget for the year.</p>
            </div>
          </div>
          {budgetAvailable ? (
            <div className="viz-budget-layout">
              <div
                className="viz-budget-donut"
                style={{
                  background: `conic-gradient(#d97706 0% ${clampPercent(
                    fixedPercent,
                  )}%, #0f766e ${clampPercent(fixedPercent)}% 100%)`,
                }}
              >
                <div className="viz-budget-center">
                  <strong>{formatCurrency(annualBudget)}</strong>
                  <span>Total budget</span>
                </div>
              </div>
              <div className="viz-legend-stack">
                <div className="viz-legend-card">
                  <span className="viz-dot gold" />
                  <div>
                    <p className="viz-kicker">Fixed dues</p>
                    <strong>{formatCurrency(projection.fixedCosts)}</strong>
                    <p className="subtle">{formatNumber(fixedPercent)}% of annual budget</p>
                  </div>
                </div>
                <div className="viz-legend-card">
                  <span className="viz-dot teal" />
                  <div>
                    <p className="viz-kicker">Left for flying</p>
                    <strong>{formatCurrency(projection.flyingBudget)}</strong>
                    <p className="subtle">{formatNumber(flyingPercent)}% available to fly</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="subtle">Set your annual budget above to unlock the visual planning view.</p>
          )}
        </article>

        <article className="card viz-budget-card">
          <div className="section-heading">
            <div>
              <h3>Cheapest plane snapshot</h3>
              <p className="subtle">Current lowest active rate effective today.</p>
            </div>
          </div>
          {projection.cheapestPlane ? (
            <div className="viz-plane-callout">
              <div>
                <p className="viz-kicker">Best current rate</p>
                <h3>{projection.cheapestPlane.planeName}</h3>
                <p className="subtle">{projection.cheapestPlane.clubName}</p>
              </div>
              <div className="viz-plane-pill">
                {formatCurrency(projection.cheapestPlane.hourlyRate)}/
                {projection.cheapestPlane.billingTimeType} hr
              </div>
            </div>
          ) : (
            <p className="subtle">No active plane/rate is available yet.</p>
          )}

          <div className="final-budget-primary-stat">
            <span className="viz-kicker">Projected flights</span>
            <strong className="final-budget-primary-value">
              {projection.projectedFlights !== undefined
                ? formatNumber(projection.projectedFlights)
                : "Unavailable"}
            </strong>
            <p className="subtle">
              {projection.projectedActualHours !== undefined
                ? `${formatHours(projection.projectedActualHours)} projected flight hours.`
                : projection.projectedFlightsUnavailableReason ?? "Projected flights unavailable."}
            </p>
          </div>

          <details className="final-budget-details">
            <summary>How was projected flights calculated?</summary>
            <div className="final-budget-details-body">
              {projection.projectedFlights !== undefined ? (
                <>
                  <p className="subtle">
                    Started with {formatCurrency(projection.flyingBudget)} left for flying and the
                    cheapest current rate of{" "}
                    {formatCurrency(projection.cheapestPlane?.hourlyRate ?? 0)}/
                    {projection.cheapestPlane?.billingTimeType} hr.
                  </p>
                  <p className="subtle">
                    That produces {formatHours(projection.projectedBillableHours ?? 0)} of billable
                    time.
                  </p>
                  <p className="subtle">
                    {projection.cheapestPlane?.billingTimeType === "hobbs"
                      ? `Because this plane bills by hobbs, billable time stays ${formatHours(
                          projection.projectedActualHours ?? 0,
                        )} of actual flight time.`
                      : `Converted that to ${formatHours(
                          projection.projectedActualHours ?? 0,
                        )} of actual flight time using a median hobbs/tach factor of ${formatNumber(
                          projection.tachToHobbsRatio ?? 0,
                        )}x from ${formatNumber(projection.tachFlightSampleCount)} prior tach-billed flights.`}
                  </p>
                  <p className="subtle">
                    Then divided by your median flight duration of{" "}
                    {formatHours(projection.typicalFlightHours ?? 0)} from{" "}
                    {formatNumber(projection.flightDurationSampleCount)} logged flights to reach{" "}
                    {formatNumber(projection.projectedFlights)} projected flights.
                  </p>
                </>
              ) : (
                <p className="subtle">
                  {projection.projectedFlightsUnavailableReason ??
                    "Projected flights could not be calculated yet."}
                </p>
              )}
            </div>
          </details>
        </article>
      </section>

      <section className="card final-budget-progress-card">
        <div className="section-heading">
          <div>
            <h3>Flight progress</h3>
            <p className="subtle">Progress toward your projected total flights for the year.</p>
          </div>
          <div className="final-budget-progress-side">
            <span className="viz-kicker">Percent complete</span>
            <strong>
              {projection.projectedFlightsCompletionPercent !== undefined
                ? `${formatNumber(projection.projectedFlightsCompletionPercent)}%`
                : "Unavailable"}
            </strong>
          </div>
        </div>

        <div className="final-budget-progress-grid">
          <div className="final-budget-progress-metric">
            <span className="viz-kicker">Projected total</span>
            <strong>
              {projection.projectedFlights !== undefined
                ? formatNumber(projection.projectedFlights)
                : "Unavailable"}
            </strong>
          </div>
          <div className="final-budget-progress-metric">
            <span className="viz-kicker">Completed YTD</span>
            <strong>{formatNumber(projection.flightsCompletedThisYear)}</strong>
          </div>
          <div className="final-budget-progress-metric">
            <span className="viz-kicker">Remaining</span>
            <strong>
              {projection.flightsRemainingThisYear !== undefined
                ? formatNumber(projection.flightsRemainingThisYear)
                : "Unavailable"}
            </strong>
          </div>
        </div>

        <div className="final-budget-progress-track">
          <div
            className="final-budget-progress-fill"
            style={{ width: `${clampPercent(completionPercent)}%` }}
          />
        </div>

        <p className="subtle">
          {projection.projectedFlights !== undefined
            ? `${formatNumber(projection.flightsCompletedThisYear)} of ${formatNumber(
                projection.projectedFlights,
              )} projected flights completed in ${currentYear}.`
            : projection.projectedFlightsUnavailableReason ?? "Projected flights unavailable."}
        </p>
      </section>
    </div>
  );
};
