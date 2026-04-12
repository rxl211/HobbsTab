import type { Club, ClubRatePeriod } from "../clubs/club-types";
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
    }),
    {
      totalSpend: 0,
      fixedSpend: 0,
      variableSpend: 0,
      hobbySpend: 0,
      trainingSpend: 0,
      hoursFlown: 0,
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
