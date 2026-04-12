import type { EntryRecord, FlightEntry } from "../entries/entry-types";

export interface SyntheticDueRow {
  id: string;
  kind: "syntheticDue";
  clubId: string;
  clubName: string;
  monthKey: string;
  date: string;
  monthlyDues: number;
  ratePeriodId: string;
}

export type HistoryRow = EntryRecord | SyntheticDueRow;

export interface MonthlySummary {
  monthKey: string;
  totalSpend: number;
  fixedSpend: number;
  variableSpend: number;
  hobbySpend: number;
  trainingSpend: number;
  checkFlightSpend: number;
  hoursFlown: number;
  costPerHour: number;
  flightCount: number;
  expenseCount: number;
}

export interface DashboardSummary {
  currentMonth: MonthlySummary;
  recentMonths: MonthlySummary[];
  recentHistory: HistoryRow[];
}

export const isFlightEntry = (row: HistoryRow): row is FlightEntry =>
  row.kind === "flight";
