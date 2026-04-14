import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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
    instructionBudgetOverrideSetting,
    clubs,
    clubDuesPeriods,
    planes,
    planeRatePeriods,
    entries,
    loading,
    updateAnnualBudget,
    updateInstructionBudgetOverride,
    clearInstructionBudgetOverride,
  } = useAppData();
  const [budgetInput, setBudgetInput] = useState(budgetSetting?.amount?.toString() ?? "");
  const [instructionInput, setInstructionInput] = useState(
    instructionBudgetOverrideSetting?.amount?.toString() ?? "",
  );
  const [error, setError] = useState<string>();
  const [instructionError, setInstructionError] = useState<string>();
  const [isBudgetEditorVisible, setIsBudgetEditorVisible] = useState(false);
  const [isInstructionEditorVisible, setIsInstructionEditorVisible] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setBudgetInput(budgetSetting?.amount?.toString() ?? "");
  }, [budgetSetting?.amount]);

  useEffect(() => {
    setInstructionInput(instructionBudgetOverrideSetting?.amount?.toString() ?? "");
  }, [instructionBudgetOverrideSetting?.amount]);

  useEffect(() => {
    if (!loading) {
      setIsBudgetEditorVisible(budgetSetting?.amount === undefined);
    }
  }, [loading, budgetSetting?.amount]);

  const projection = useMemo(
    () =>
      buildBudgetProjection({
        annualBudget: budgetSetting?.amount,
        instructionBudgetOverride: instructionBudgetOverrideSetting?.amount,
        clubs,
        duesPeriods: clubDuesPeriods,
        planes,
        planeRatePeriods,
        entries,
      }),
    [
      budgetSetting?.amount,
      instructionBudgetOverrideSetting?.amount,
      clubs,
      clubDuesPeriods,
      planes,
      planeRatePeriods,
      entries,
    ],
  );

  if (loading) {
    return <section className="card">Loading your local data...</section>;
  }

  const annualBudget = projection.annualBudget ?? 0;
  const fixedPercent = annualBudget > 0 ? (projection.fixedCosts / annualBudget) * 100 : 0;
  const instructionPercent =
    annualBudget > 0 ? (projection.plannedInstructionBudget / annualBudget) * 100 : 0;
  const flyingPercent =
    annualBudget > 0 ? (projection.plannedFlyingBudget / annualBudget) * 100 : 0;
  const instructionSpendPercent =
    projection.plannedInstructionBudget > 0
      ? (projection.instructionSpendThisYear / projection.plannedInstructionBudget) * 100
      : 0;
  const flyingSpendPercent =
    projection.plannedFlyingBudget > 0
      ? ((projection.aircraftSpendThisYear +
          projection.otherExpenseSpendThisYear +
          projection.instructionOverspendThisYear) /
          projection.plannedFlyingBudget) *
        100
      : 0;
  const completionPercent = projection.projectedFlightsCompletionPercent ?? 0;
  const budgetAvailable = projection.annualBudget !== undefined;
  const fixedStop = clampPercent(fixedPercent);
  const instructionStop = clampPercent(fixedPercent + instructionPercent);
  const instructionYearsLabel = projection.instructionBudgetYearsUsed.join(", ");
  const isWaitingOnPlaneRate =
    projection.projectedFlightsUnavailableReason === "No active plane/rate is available yet.";
  const heroMissionSummary = !budgetAvailable
    ? undefined
    : projection.projectedFlights !== undefined && projection.projectedActualHours !== undefined
      ? {
          title: `Your budget supports about ${formatNumber(projection.projectedFlights)} flights this year`,
          detail:
            "Use the breakdown below to see how dues, instruction, current aircraft rates, and your past flights shape that forecast.",
        }
      : isWaitingOnPlaneRate
        ? {
            title: "Flight projections unlock once you add a club and plane rate.",
            detail: `Your budget still leaves ${formatCurrency(
              projection.remainingFlyingBudget,
            )} available for airplane time once a current rate is in place.`,
          }
        : {
            title: "Your budget is ready for flight planning.",
            detail: `Once the remaining projection inputs are available, we'll translate ${formatCurrency(
              projection.remainingFlyingBudget,
            )} into projected hours and flights.`,
          };

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
          {heroMissionSummary ? (
            <div className="budget-hero-mission">
              <strong>{heroMissionSummary.title}</strong>
              <p className="subtle">{heroMissionSummary.detail}</p>
              {isWaitingOnPlaneRate ? (
                <Link to="/clubs" className="budget-hero-link">
                  Create Club
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="viz-hero-value">
          <span className="viz-kicker">Budget target</span>
          <strong>{budgetAvailable ? formatCurrency(annualBudget) : "Not set"}</strong>
          <button
            type="button"
            className="final-budget-edit-button"
            onClick={() => {
              setIsBudgetEditorVisible((current) => !current);
              setError(undefined);
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

                const nextBudget = budgetInputToNumber(budgetInput);

                if (nextBudget === undefined || nextBudget < 1) {
                  setError("Enter a valid annual budget of at least 1.");
                  return;
                }

                await updateAnnualBudget(nextBudget);
                setIsBudgetEditorVisible(false);
              }}
            >
              <label className="final-budget-inline-label">
                Annual budget
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={budgetInput}
                  onChange={(event) => {
                    setBudgetInput(event.target.value);
                    setError(undefined);
                  }}
                  placeholder="12000"
                />
              </label>
              <button type="submit" className="primary-button">
                Save
              </button>
            </form>
          ) : null}

          <div className="budget-hero-secondary">
            <div>
              <div className="budget-hero-label-with-help">
                <span className="viz-kicker">CFI budget</span>
                <span className="info-tooltip">
                  <button
                    type="button"
                    className="info-pill"
                    aria-label="More information about CFI budget"
                  >
                    i
                  </button>
                  <span className="info-tooltip-bubble" role="tooltip">
                    The amount of your budget target that will be allocated to paying CFI for
                    training.
                  </span>
                </span>
              </div>
              <strong>{formatCurrency(projection.plannedInstructionBudget)}</strong>
              <p className="subtle">
                {projection.instructionBudgetSource === "override"
                  ? "Using your custom instruction budget."
                  : `Auto-calculated from median instructor spend across ${instructionYearsLabel}.`}
              </p>
            </div>
            <button
              type="button"
            className="final-budget-edit-button"
            onClick={() => {
              setIsInstructionEditorVisible((current) => !current);
              setInstructionError(undefined);
            }}
          >
              {isInstructionEditorVisible
                ? "Close"
                : instructionBudgetOverrideSetting
                  ? "Edit CFI"
                  : "Customize CFI"}
            </button>
          </div>

          {isInstructionEditorVisible ? (
            <form
              className="final-budget-inline-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setInstructionError(undefined);

                const nextInstructionBudget = budgetInputToNumber(instructionInput);

                if (nextInstructionBudget === undefined || nextInstructionBudget < 0) {
                  setInstructionError("Enter a valid instruction budget of at least 0.");
                  return;
                }

                await updateInstructionBudgetOverride(nextInstructionBudget);
                setIsInstructionEditorVisible(false);
              }}
            >
              <label className="final-budget-inline-label">
                Annual instruction budget
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={instructionInput}
                  onChange={(event) => {
                    setInstructionInput(event.target.value);
                    setInstructionError(undefined);
                  }}
                  placeholder="0"
                />
              </label>
              <div className="budget-inline-actions">
                <button type="submit" className="primary-button">
                  Save
                </button>
                {instructionBudgetOverrideSetting ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={async () => {
                      setInstructionError(undefined);
                      await clearInstructionBudgetOverride();
                      setInstructionInput("");
                      setIsInstructionEditorVisible(false);
                    }}
                  >
                    Use automatic
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}
          {instructionError ? <p className="form-error">{instructionError}</p> : null}
        </div>
      </section>

      {!budgetAvailable ? null : (
        <>
          <section className="viz-grid">
            <article className="card viz-budget-card">
              <div className="section-heading">
                <div>
                  <h3>Budget split</h3>
                  <p className="subtle">Fixed dues, CFI, and airplane budget for the year.</p>
                </div>
              </div>
              <>
                <div className="viz-budget-layout">
                  <div
                    className="viz-budget-donut"
                    style={{
                      background: `conic-gradient(#d97706 0% ${fixedStop}%, #2563eb ${fixedStop}% ${instructionStop}%, #0f766e ${instructionStop}% 100%)`,
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
                      <span className="viz-dot blue" />
                      <div>
                        <p className="viz-kicker">CFI</p>
                        <strong>{formatCurrency(projection.plannedInstructionBudget)}</strong>
                        <p className="subtle">{formatNumber(instructionPercent)}% of annual budget</p>
                      </div>
                    </div>
                    <div className="viz-legend-card">
                      <span className="viz-dot teal" />
                      <div>
                        <p className="viz-kicker">Left for flying</p>
                        <strong>{formatCurrency(projection.plannedFlyingBudget)}</strong>
                        <p className="subtle">{formatNumber(flyingPercent)}% of annual budget</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="budget-progress-stack">
                  <div className="final-budget-progress-card">
                    <div className="section-heading">
                      <div>
                        <h3>Instruction budget progress</h3>
                        <p className="subtle">
                          How much of your planned instruction budget has already been used.
                        </p>
                      </div>
                    </div>

                    <div className="final-budget-progress-grid">
                      <div className="final-budget-progress-metric">
                        <span className="viz-kicker">Instruction</span>
                        <strong>{formatCurrency(projection.plannedInstructionBudget)}</strong>
                      </div>
                      <div className="final-budget-progress-metric">
                        <span className="viz-kicker">Spent on instruction YTD</span>
                        <strong>{formatCurrency(projection.instructionSpendThisYear)}</strong>
                      </div>
                      <div className="final-budget-progress-metric">
                        <span className="viz-kicker">Still available</span>
                        <strong>{formatCurrency(projection.remainingInstructionBudget)}</strong>
                      </div>
                    </div>

                    <div className="final-budget-progress-track">
                      <div
                        className="final-budget-progress-fill"
                        style={{ width: `${clampPercent(instructionSpendPercent)}%` }}
                      />
                    </div>

                    <p className="subtle">
                      {projection.plannedInstructionBudget > 0
                        ? `${formatNumber(clampPercent(instructionSpendPercent))}% of the instruction budget used so far in ${currentYear}.`
                        : "No instruction budget is planned yet."}
                    </p>
                  </div>

                  <div className="final-budget-progress-card">
                    <div className="section-heading">
                      <div>
                        <h3>Flying budget progress</h3>
                        <p className="subtle">
                          How much of your left-for-flying budget has already been used.
                        </p>
                      </div>
                    </div>

                    <div className="final-budget-progress-grid">
                      <div className="final-budget-progress-metric">
                        <span className="viz-kicker">Left for flying</span>
                        <strong>{formatCurrency(projection.plannedFlyingBudget)}</strong>
                      </div>
                      <div className="final-budget-progress-metric">
                        <span className="viz-kicker">Used so far</span>
                        <strong>
                          {formatCurrency(
                            projection.aircraftSpendThisYear +
                              projection.otherExpenseSpendThisYear +
                              projection.instructionOverspendThisYear,
                          )}
                        </strong>
                      </div>
                      <div className="final-budget-progress-metric">
                        <span className="viz-kicker">Still available</span>
                        <strong>{formatCurrency(projection.remainingFlyingBudget)}</strong>
                      </div>
                    </div>

                    <div className="final-budget-progress-track">
                      <div
                        className="final-budget-progress-fill"
                        style={{ width: `${clampPercent(flyingSpendPercent)}%` }}
                      />
                    </div>

                    <p className="subtle">
                      {projection.plannedFlyingBudget > 0
                        ? projection.instructionOverspendThisYear > 0
                          ? `${formatNumber(clampPercent(flyingSpendPercent))}% of the left-for-flying budget used so far in ${currentYear}, including flights, other expenses, and CFI payments beyond what was budgeted for CFI.`
                          : `${formatNumber(clampPercent(flyingSpendPercent))}% of the left-for-flying budget used so far in ${currentYear}, including flights and other expenses.`
                        : "No flyable budget remains after fixed dues and instruction."}
                    </p>
                  </div>
                </div>
              </>
            </article>

            <article className="card viz-budget-card">
              <div className="section-heading">
                <div>
                  <h3>{currentYear} Projection Snapshot</h3>
                  <p className="subtle">
                    Based on current lowest active rate effective today, your annual budget and
                    more.
                  </p>
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
                {projection.projectedActualHours !== undefined ? (
                  <p className="subtle">
                    {formatNumber(projection.projectedActualHours)} projected flight hours.
                  </p>
                ) : projection.projectedFlightsUnavailableReason ===
                  "No active plane/rate is available yet." ? (
                  <p className="subtle">
                    No active plane/rate is available yet. <Link to="/clubs">Create Club</Link>
                  </p>
                ) : (
                  <p className="subtle">
                    {projection.projectedFlightsUnavailableReason ?? "Projected flights unavailable."}
                  </p>
                )}
              </div>

              <details className="final-budget-details">
                <summary>How was projected flights calculated?</summary>
                <div className="final-budget-details-body">
                  {projection.projectedFlights !== undefined ? (
                    <>
                      <p className="subtle">
                        Started with an annual budget of{" "}
                        {formatCurrency(projection.annualBudget ?? 0)}, then subtracted{" "}
                        {formatCurrency(projection.fixedCosts)} in fixed dues and{" "}
                        {formatCurrency(projection.plannedInstructionBudget)} reserved for
                        instruction.
                      </p>
                      <p className="subtle">
                        {projection.instructionBudgetSource === "override"
                          ? "That instruction amount comes from your custom annual CFI budget."
                          : `That instruction amount uses the median instructor spend from ${instructionYearsLabel}, including zero-spend years in that window.`}
                      </p>
                      <p className="subtle">
                        That leaves {formatCurrency(projection.plannedFlyingBudget)} in annual
                        flying budget at the cheapest current rate of{" "}
                        {formatCurrency(projection.cheapestPlane?.hourlyRate ?? 0)}/
                        {projection.cheapestPlane?.billingTimeType} hr.
                      </p>
                      <p className="subtle">
                        That produces {formatHours(projection.projectedBillableHours ?? 0)} of
                        billable time.
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
                        {formatHours(projection.typicalFlightHours ?? 0)}
                        {projection.isDefaultTypicalFlightHours
                          ? " (a placeholder because there are no previously recorded flights)."
                          : ` from ${formatNumber(projection.flightDurationSampleCount)} logged flights.`}{" "}
                        That reaches {formatNumber(projection.projectedFlights)} projected flights.
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

              <section className="final-budget-progress-card">
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
            </article>
          </section>
        </>
      )}
    </div>
  );
};
