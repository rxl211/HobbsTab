import type { Club, ClubDuesPeriod, Plane, PlaneRatePeriod } from "../clubs/club-types";
import { sortDuesPeriods } from "../clubs/club-rules";
import type { EntryRecord, FlightEntry } from "../entries/entry-types";
import { monthKeysBetween } from "../shared/dates";

const roundCurrency = (value: number) => Number(value.toFixed(2));

const roundHours = (value: number) => Number(value.toFixed(2));

const floorCount = (value: number) => Math.floor(value);

const DEFAULT_TYPICAL_FLIGHT_HOURS = 1.3;

const median = (values: number[]) => {
  if (values.length === 0) {
    return undefined;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
};

const isFlightEntry = (entry: EntryRecord): entry is FlightEntry => entry.kind === "flight";

const currentYearWindow = (now: Date) => {
  const year = now.getFullYear();
  return {
    year,
    startMonth: `${year}-01`,
    endMonth: `${year}-12`,
  };
};

const buildFixedCostTotal = (
  clubs: Club[],
  duesPeriods: ClubDuesPeriod[],
  now: Date,
) => {
  const { startMonth, endMonth } = currentYearWindow(now);
  const activeClubIds = new Set(clubs.filter((club) => club.active).map((club) => club.id));
  const yearMonths = monthKeysBetween(startMonth, endMonth);

  return roundCurrency(
    [...activeClubIds].reduce((clubTotal, clubId) => {
      const periods = sortDuesPeriods(sourceDuesPeriodsForClub(duesPeriods, clubId));

      if (periods.length === 0) {
        return clubTotal;
      }

      const totalForClub = yearMonths.reduce((sum, monthKey) => {
        const applicable = periods
          .filter((period) => period.effectiveFrom.slice(0, 7) <= monthKey)
          .at(-1);

        return sum + (applicable?.monthlyDues ?? 0);
      }, 0);

      return clubTotal + totalForClub;
    }, 0),
  );
};

const sourceDuesPeriodsForClub = (duesPeriods: ClubDuesPeriod[], clubId: string) =>
  duesPeriods.filter((period) => period.clubId === clubId);

const getApplicableRateForToday = (
  planeRatePeriods: PlaneRatePeriod[],
  planeId: string,
  today: string,
) =>
  planeRatePeriods
    .filter((period) => period.planeId === planeId && period.effectiveFrom <= today)
    .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom))
    .at(0);

const buildInstructionYearWindow = (now: Date) =>
  Array.from({ length: 3 }, (_, index) => now.getFullYear() - index - 1).filter(
    (year) => year > 0,
  );

export interface BudgetPlaneOption {
  planeId: string;
  planeName: string;
  clubId: string;
  clubName: string;
  billingTimeType: "hobbs" | "tach";
  hourlyRate: number;
}

export interface InstructionBudgetYearTotal {
  year: number;
  instructorCost: number;
}

export interface BudgetProjection {
  annualBudget?: number;
  instructionBudgetOverride?: number;
  fixedCosts: number;
  plannedInstructionBudget: number;
  plannedFlyingBudget: number;
  instructionBudgetSource: "auto" | "override";
  instructionBudgetYearsUsed: number[];
  instructionYearlyTotals: InstructionBudgetYearTotal[];
  aircraftSpendThisYear: number;
  instructionSpendThisYear: number;
  remainingInstructionBudget: number;
  remainingFlyingBudget: number;
  cheapestPlane?: BudgetPlaneOption;
  projectedBillableHours?: number;
  projectedActualHours?: number;
  tachToHobbsRatio?: number;
  projectedFlights?: number;
  typicalFlightHours?: number;
  isDefaultTypicalFlightHours: boolean;
  flightsCompletedThisYear: number;
  flightsRemainingThisYear?: number;
  tachFlightSampleCount: number;
  flightDurationSampleCount: number;
  projectedFlightsCompletionPercent?: number;
  projectedFlightsUnavailableReason?: string;
}

export const buildBudgetProjection = ({
  annualBudget,
  instructionBudgetOverride,
  clubs,
  duesPeriods,
  planes,
  planeRatePeriods,
  entries,
  now = new Date(),
}: {
  annualBudget?: number;
  instructionBudgetOverride?: number;
  clubs: Club[];
  duesPeriods: ClubDuesPeriod[];
  planes: Plane[];
  planeRatePeriods: PlaneRatePeriod[];
  entries: EntryRecord[];
  now?: Date;
}): BudgetProjection => {
  const fixedCosts = buildFixedCostTotal(clubs, duesPeriods, now);
  const annualBudgetValue = annualBudget === undefined ? undefined : roundCurrency(annualBudget);
  const instructionBudgetOverrideValue =
    instructionBudgetOverride === undefined ? undefined : roundCurrency(instructionBudgetOverride);
  const yearPrefix = `${now.getFullYear()}-`;
  const flightEntries = entries.filter(isFlightEntry);
  const flightsThisYear = flightEntries.filter((entry) => entry.date.startsWith(yearPrefix));
  const aircraftSpendThisYear = roundCurrency(
    flightsThisYear.reduce((total, entry) => total + entry.aircraftCost, 0),
  );
  const instructionSpendThisYear = roundCurrency(
    flightsThisYear.reduce((total, entry) => total + (entry.instructorCost ?? 0), 0),
  );

  const instructionBudgetYearsUsed = buildInstructionYearWindow(now);
  const instructionYearlyTotals = instructionBudgetYearsUsed.map((year) => ({
    year,
    instructorCost: roundCurrency(
      flightEntries
        .filter((entry) => entry.date.startsWith(`${year}-`))
        .reduce((total, entry) => total + (entry.instructorCost ?? 0), 0),
    ),
  }));
  const autoInstructionBudget =
    median(instructionYearlyTotals.map((item) => item.instructorCost)) ?? 0;
  const plannedInstructionBudget = roundCurrency(
    instructionBudgetOverrideValue ?? autoInstructionBudget,
  );
  const instructionBudgetSource = instructionBudgetOverrideValue === undefined ? "auto" : "override";

  const rawPlannedFlyingBudget =
    annualBudgetValue === undefined
      ? 0
      : annualBudgetValue - fixedCosts - plannedInstructionBudget;
  const plannedFlyingBudget = roundCurrency(Math.max(rawPlannedFlyingBudget, 0));

  const rawRemainingFlyingBudget =
    annualBudgetValue === undefined
      ? 0
      : annualBudgetValue - fixedCosts - plannedInstructionBudget - aircraftSpendThisYear;
  const remainingFlyingBudget = roundCurrency(Math.max(rawRemainingFlyingBudget, 0));
  const remainingInstructionBudget = roundCurrency(
    Math.max(plannedInstructionBudget - instructionSpendThisYear, 0),
  );

  const today = now.toISOString().slice(0, 10);
  const clubsById = new Map(clubs.map((club) => [club.id, club]));
  const activePlanes = planes.filter((plane) => plane.active && clubsById.get(plane.clubId)?.active);

  const cheapestPlane = activePlanes
    .map((plane) => {
      const club = clubsById.get(plane.clubId);
      const applicableRate = getApplicableRateForToday(planeRatePeriods, plane.id, today);

      if (!club || !applicableRate) {
        return undefined;
      }

      return {
        planeId: plane.id,
        planeName: plane.name,
        clubId: club.id,
        clubName: club.name,
        billingTimeType: applicableRate.billingTimeType,
        hourlyRate: applicableRate.hourlyRate,
      } satisfies BudgetPlaneOption;
    })
    .filter((value): value is BudgetPlaneOption => value !== undefined)
    .sort(
      (left, right) =>
        left.hourlyRate - right.hourlyRate ||
        left.planeName.localeCompare(right.planeName) ||
        left.clubName.localeCompare(right.clubName),
    )[0];

  const projectedBillableHours =
    cheapestPlane && annualBudgetValue !== undefined
      ? roundHours(plannedFlyingBudget / cheapestPlane.hourlyRate)
      : undefined;

  const tachFlights = flightEntries.filter(
    (entry) => entry.billingTimeTypeUsed === "tach" && entry.billedTime > 0 && entry.flightTime > 0,
  );
  const tachToHobbsRatio = median(tachFlights.map((entry) => entry.flightTime / entry.billedTime));

  const projectedActualHours =
    projectedBillableHours !== undefined
      ? cheapestPlane?.billingTimeType === "hobbs"
        ? projectedBillableHours
        : tachToHobbsRatio !== undefined
          ? roundHours(projectedBillableHours * tachToHobbsRatio)
          : undefined
      : undefined;

  const flightDurations = flightEntries.map((entry) => entry.flightTime).filter((value) => value > 0);
  const medianFlightHours = median(flightDurations);
  const isDefaultTypicalFlightHours = medianFlightHours === undefined;
  const typicalFlightHours = isDefaultTypicalFlightHours
    ? DEFAULT_TYPICAL_FLIGHT_HOURS
    : medianFlightHours;
  const projectedFlights =
    projectedActualHours !== undefined && typicalFlightHours !== undefined
      ? floorCount(projectedActualHours / typicalFlightHours)
      : undefined;

  const flightsCompletedThisYear = flightsThisYear.length;
  const flightsRemainingThisYear =
    projectedFlights !== undefined
      ? Math.max(projectedFlights - flightsCompletedThisYear, 0)
      : undefined;

  const projectedFlightsCompletionPercent =
    projectedFlights !== undefined && projectedFlights > 0
      ? roundHours((flightsCompletedThisYear / projectedFlights) * 100)
      : undefined;

  const projectedFlightsUnavailableReason = !cheapestPlane
    ? "No active plane/rate is available yet."
    : annualBudgetValue === undefined
      ? "Set an annual budget to calculate projected flights."
      : projectedBillableHours === undefined
        ? "Projected billable hours are unavailable."
        : projectedActualHours === undefined
          ? cheapestPlane.billingTimeType === "tach"
            ? "Not enough prior tach-billed flights to convert billable time into actual flight hours."
            : "Projected actual hours are unavailable."
          : undefined;

  return {
    annualBudget: annualBudgetValue,
    instructionBudgetOverride: instructionBudgetOverrideValue,
    fixedCosts,
    plannedInstructionBudget,
    plannedFlyingBudget,
    instructionBudgetSource,
    instructionBudgetYearsUsed,
    instructionYearlyTotals,
    aircraftSpendThisYear,
    instructionSpendThisYear,
    remainingInstructionBudget,
    remainingFlyingBudget,
    cheapestPlane,
    projectedBillableHours,
    projectedActualHours,
    tachToHobbsRatio: tachToHobbsRatio === undefined ? undefined : roundHours(tachToHobbsRatio),
    projectedFlights,
    typicalFlightHours: roundHours(typicalFlightHours),
    isDefaultTypicalFlightHours,
    flightsCompletedThisYear,
    flightsRemainingThisYear,
    tachFlightSampleCount: tachFlights.length,
    flightDurationSampleCount: flightDurations.length,
    projectedFlightsCompletionPercent,
    projectedFlightsUnavailableReason,
  };
};
