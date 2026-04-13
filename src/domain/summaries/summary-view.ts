import type { Club, ClubRatePeriod } from "../clubs/club-types";
import { entryTotal } from "../entries/entry-rules";
import type { EntryRecord } from "../entries/entry-types";
import { isFlightEntry, type SyntheticDueRow } from "./summary-types";
import type { MonthlySummary } from "./summary-types";
import { monthLabel } from "../shared/dates";

export type SummaryScope = "thisMonth" | "thisYear" | "oneYear" | "allTime";

export const summaryScopeLabels: Record<SummaryScope, string> = {
  thisMonth: "This Month",
  thisYear: "This Year",
  oneYear: "1 Yr",
  allTime: "All Time",
};

export interface SummaryViewTotals {
  totalSpend: number;
  fixedSpend: number;
  variableSpend: number;
  hobbySpend: number;
  trainingSpend: number;
  hoursFlown: number;
  flightCount: number;
}

export interface SummaryTrendPoint {
  id: string;
  label: string;
  sublabel: string;
  valueLabel: string;
  value: number;
}

export const buildScopedMonthlySummaries = (
  monthlySummaries: MonthlySummary[],
  scope: SummaryScope,
) => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = now.getFullYear().toString();
  const trailingYearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    .toISOString()
    .slice(0, 7);

  return monthlySummaries.filter((summary) => {
    if (scope === "thisMonth") {
      return summary.monthKey === currentMonth;
    }

    if (scope === "thisYear") {
      return summary.monthKey.startsWith(currentYear);
    }

    if (scope === "oneYear") {
      return summary.monthKey >= trailingYearStart;
    }

    return true;
  });
};

const dateValue = (isoDate: string) => new Date(`${isoDate}T12:00:00`);

const isWithinScope = (isoDate: string, scope: SummaryScope, now: Date) => {
  const rowDate = dateValue(isoDate);
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = now.getFullYear().toString();

  if (scope === "thisMonth") {
    return isoDate.slice(0, 7) === currentMonth;
  }

  if (scope === "thisYear") {
    return isoDate.startsWith(currentYear);
  }

  if (scope === "oneYear") {
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    cutoff.setDate(cutoff.getDate() - 365);
    return rowDate >= cutoff;
  }

  return true;
};

export const buildScopedSummaryTotals = (
  entries: EntryRecord[],
  syntheticDues: SyntheticDueRow[],
  scope: SummaryScope,
  now = new Date(),
): SummaryViewTotals => {
  const includedEntries = entries.filter((entry) => isWithinScope(entry.date, scope, now));
  const includedDues = syntheticDues.filter((due) => isWithinScope(due.date, scope, now));

  const totals = {
    totalSpend: 0,
    fixedSpend: 0,
    variableSpend: 0,
    hobbySpend: 0,
    trainingSpend: 0,
    hoursFlown: 0,
    flightCount: 0,
  };

  includedEntries.forEach((entry) => {
    const total = entryTotal(entry);
    totals.totalSpend += total;
    totals.variableSpend += total;

    if (!isFlightEntry(entry)) {
      return;
    }

    totals.flightCount += 1;
    totals.hoursFlown += entry.hobbsTime;

    if (entry.purpose === "hobby") {
      totals.hobbySpend += total;
      return;
    }

    totals.trainingSpend += total;
  });

  includedDues.forEach((due) => {
    totals.totalSpend += due.monthlyDues;
    totals.fixedSpend += due.monthlyDues;
  });

  return {
    ...totals,
    totalSpend: Number(totals.totalSpend.toFixed(2)),
    fixedSpend: Number(totals.fixedSpend.toFixed(2)),
    variableSpend: Number(totals.variableSpend.toFixed(2)),
    hobbySpend: Number(totals.hobbySpend.toFixed(2)),
    trainingSpend: Number(totals.trainingSpend.toFixed(2)),
    hoursFlown: Number(totals.hoursFlown.toFixed(2)),
    flightCount: totals.flightCount,
  };
};

export const buildSummaryTotals = (
  scopedMonthly: MonthlySummary[],
): SummaryViewTotals =>
  scopedMonthly.reduce(
    (accumulator, summary) => ({
      totalSpend: accumulator.totalSpend + summary.totalSpend,
      fixedSpend: accumulator.fixedSpend + summary.fixedSpend,
      variableSpend: accumulator.variableSpend + summary.variableSpend,
      hobbySpend: accumulator.hobbySpend + summary.hobbySpend,
      trainingSpend: accumulator.trainingSpend + summary.trainingSpend,
      hoursFlown: accumulator.hoursFlown + summary.hoursFlown,
      flightCount: accumulator.flightCount + summary.flightCount,
    }),
    {
      totalSpend: 0,
      fixedSpend: 0,
      variableSpend: 0,
      hobbySpend: 0,
      trainingSpend: 0,
      hoursFlown: 0,
      flightCount: 0,
    },
  );

export const buildDuesTrend = (
  clubRatePeriods: ClubRatePeriod[],
  clubs: Club[],
  formatCurrency: (value: number) => string,
): SummaryTrendPoint[] => {
  const clubsById = new Map(clubs.map((club) => [club.id, club.name]));

  return [...clubRatePeriods]
    .sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom))
    .map((period) => ({
      id: `dues:${period.id}`,
      label: monthLabel(period.effectiveFrom.slice(0, 7)),
      sublabel: clubsById.get(period.clubId) ?? "Club",
      valueLabel: formatCurrency(period.monthlyDues),
      value: period.monthlyDues,
    }))
    .filter((point, index, array) => index === 0 || point.value !== array[index - 1].value);
};

export const buildRateTrend = (
  clubRatePeriods: ClubRatePeriod[],
  clubs: Club[],
  formatCurrency: (value: number) => string,
): SummaryTrendPoint[] => {
  const clubsById = new Map(clubs.map((club) => [club.id, club.name]));

  return [...clubRatePeriods]
    .sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom))
    .map((period) => ({
      id: period.id,
      label: monthLabel(period.effectiveFrom.slice(0, 7)),
      sublabel: `${clubsById.get(period.clubId) ?? "Club"} • ${period.billingTimeType} billed`,
      valueLabel: `${formatCurrency(period.hourlyRate)}/hr`,
      value: period.hourlyRate,
    }))
    .filter((point, index, array) => index === 0 || point.value !== array[index - 1].value);
};
