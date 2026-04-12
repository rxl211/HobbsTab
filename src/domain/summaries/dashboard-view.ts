import { currentMonthKey } from "../shared/dates";
import type { MonthlySummary } from "./summary-types";

export type DashboardScope = "year" | "month";

export interface DashboardTotals {
  label: string;
  totalSpend: number;
  fixedSpend: number;
  variableSpend: number;
  hobbySpend: number;
  trainingSpend: number;
  hoursFlown: number;
  costPerHour: number;
}

const emptyTotals = (label: string): DashboardTotals => ({
  label,
  totalSpend: 0,
  fixedSpend: 0,
  variableSpend: 0,
  hobbySpend: 0,
  trainingSpend: 0,
  hoursFlown: 0,
  costPerHour: 0,
});

export const buildDashboardTotals = (
  monthlySummaries: MonthlySummary[],
  scope: DashboardScope,
): DashboardTotals => {
  if (scope === "month") {
    const currentMonth = monthlySummaries.find(
      (summary) => summary.monthKey === currentMonthKey(),
    );

    return currentMonth
      ? {
          label: "this month",
          totalSpend: currentMonth.totalSpend,
          fixedSpend: currentMonth.fixedSpend,
          variableSpend: currentMonth.variableSpend,
          hobbySpend: currentMonth.hobbySpend,
          trainingSpend: currentMonth.trainingSpend,
          hoursFlown: currentMonth.hoursFlown,
          costPerHour: currentMonth.costPerHour,
        }
      : emptyTotals("this month");
  }

  const currentYear = new Date().getFullYear().toString();
  const yearlySummaries = monthlySummaries.filter((summary) =>
    summary.monthKey.startsWith(currentYear),
  );

  if (yearlySummaries.length === 0) {
    return emptyTotals("this year");
  }

  const combined = yearlySummaries.reduce(
    (totals, summary) => ({
      totalSpend: totals.totalSpend + summary.totalSpend,
      fixedSpend: totals.fixedSpend + summary.fixedSpend,
      variableSpend: totals.variableSpend + summary.variableSpend,
      hobbySpend: totals.hobbySpend + summary.hobbySpend,
      trainingSpend: totals.trainingSpend + summary.trainingSpend,
      hoursFlown: totals.hoursFlown + summary.hoursFlown,
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

  return {
    label: "this year",
    totalSpend: Number(combined.totalSpend.toFixed(2)),
    fixedSpend: Number(combined.fixedSpend.toFixed(2)),
    variableSpend: Number(combined.variableSpend.toFixed(2)),
    hobbySpend: Number(combined.hobbySpend.toFixed(2)),
    trainingSpend: Number(combined.trainingSpend.toFixed(2)),
    hoursFlown: Number(combined.hoursFlown.toFixed(2)),
    costPerHour:
      combined.hoursFlown > 0
        ? Number((combined.totalSpend / combined.hoursFlown).toFixed(2))
        : 0,
  };
};
