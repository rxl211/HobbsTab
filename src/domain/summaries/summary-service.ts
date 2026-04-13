import type { Club, ClubDuesPeriod } from "../clubs/club-types";
import { sortDuesPeriods } from "../clubs/club-rules";
import { entryTotal } from "../entries/entry-rules";
import type { EntryRecord } from "../entries/entry-types";
import { currentMonthKey, monthKeysBetween, startOfMonth } from "../shared/dates";
import type {
  DashboardSummary,
  HistoryRow,
  MonthlySummary,
  SyntheticDueRow,
} from "./summary-types";

export const buildSyntheticDues = (
  clubs: Club[],
  duesPeriods: ClubDuesPeriod[],
  entries: EntryRecord[],
): SyntheticDueRow[] => {
  const latestEntryMonth = entries
    .map((entry) => entry.date.slice(0, 7))
    .sort()
    .at(-1);
  const lastMonth =
    latestEntryMonth && latestEntryMonth > currentMonthKey()
      ? latestEntryMonth
      : currentMonthKey();

  return clubs.flatMap((club) => {
    const periods = sortDuesPeriods(duesPeriods.filter((period) => period.clubId === club.id));
    if (periods.length === 0) {
      return [];
    }

    return monthKeysBetween(periods[0].effectiveFrom.slice(0, 7), lastMonth).flatMap(
      (monthKey) => {
        const applicable = periods
          .filter((period) => period.effectiveFrom.slice(0, 7) <= monthKey)
          .at(-1);

        if (!applicable || applicable.monthlyDues <= 0) {
          return [];
        }

        return {
          id: `due:${club.id}:${monthKey}`,
          kind: "syntheticDue" as const,
          clubId: club.id,
          clubName: club.name,
          monthKey,
          date: startOfMonth(`${monthKey}-01`),
          monthlyDues: applicable.monthlyDues,
          duesPeriodId: applicable.id,
        };
      },
    );
  });
};

const createEmptyMonthlySummary = (monthKey: string): MonthlySummary => ({
  monthKey,
  totalSpend: 0,
  fixedSpend: 0,
  variableSpend: 0,
  hobbySpend: 0,
  trainingSpend: 0,
  checkFlightSpend: 0,
  hoursFlown: 0,
  costPerHour: 0,
  flightCount: 0,
  expenseCount: 0,
});

export const buildMonthlySummaries = (
  entries: EntryRecord[],
  syntheticDues: SyntheticDueRow[],
): MonthlySummary[] => {
  const monthlyMap = new Map<string, MonthlySummary>();

  const getOrCreate = (monthKey: string) => {
    const existing = monthlyMap.get(monthKey);
    if (existing) {
      return existing;
    }

    const created = createEmptyMonthlySummary(monthKey);
    monthlyMap.set(monthKey, created);
    return created;
  };

  entries.forEach((entry) => {
    const summary = getOrCreate(entry.date.slice(0, 7));
    const total = entryTotal(entry);
    summary.totalSpend += total;

    if (entry.kind === "expense") {
      summary.variableSpend += entry.amount;
      summary.expenseCount += 1;
      return;
    }

    summary.variableSpend += total;
    summary.hoursFlown += entry.flightTime;
    summary.flightCount += 1;

    if (entry.purpose === "hobby") {
      summary.hobbySpend += total;
    } else if (entry.purpose === "training") {
      summary.trainingSpend += total;
    } else {
      summary.checkFlightSpend += total;
      summary.trainingSpend += total;
    }
  });

  syntheticDues.forEach((due) => {
    const summary = getOrCreate(due.monthKey);
    summary.totalSpend += due.monthlyDues;
    summary.fixedSpend += due.monthlyDues;
  });

  return [...monthlyMap.values()]
    .map((summary) => ({
      ...summary,
      totalSpend: Number(summary.totalSpend.toFixed(2)),
      fixedSpend: Number(summary.fixedSpend.toFixed(2)),
      variableSpend: Number(summary.variableSpend.toFixed(2)),
      hobbySpend: Number(summary.hobbySpend.toFixed(2)),
      trainingSpend: Number(summary.trainingSpend.toFixed(2)),
      checkFlightSpend: Number(summary.checkFlightSpend.toFixed(2)),
      hoursFlown: Number(summary.hoursFlown.toFixed(2)),
      costPerHour:
        summary.hoursFlown > 0
          ? Number((summary.totalSpend / summary.hoursFlown).toFixed(2))
          : 0,
    }))
    .sort((left, right) => right.monthKey.localeCompare(left.monthKey));
};

export const buildHistoryRows = (
  entries: EntryRecord[],
  syntheticDues: SyntheticDueRow[],
): HistoryRow[] =>
  [...entries, ...syntheticDues].sort((left, right) => {
    const dateComparison = right.date.localeCompare(left.date);
    if (dateComparison !== 0) {
      return dateComparison;
    }

    return right.id.localeCompare(left.id);
  });

export const buildDashboardSummary = (
  monthly: MonthlySummary[],
  history: HistoryRow[],
): DashboardSummary => ({
  currentMonth: monthly[0] ?? createEmptyMonthlySummary(currentMonthKey()),
  recentMonths: monthly.slice(0, 6).reverse(),
  recentHistory: history.slice(0, 8),
});
