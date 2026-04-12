import type { BillingTimeType } from "../clubs/club-types";

export type FlightPurpose = "hobby" | "training" | "checkFlight";

export interface FlightEntry {
  id: string;
  kind: "flight";
  date: string;
  clubId: string | null;
  purpose: FlightPurpose;
  hobbsTime: number;
  tachTime?: number;
  billingTimeTypeUsed: BillingTimeType;
  hourlyRateUsed: number;
  aircraftCost: number;
  instructorCost?: number;
  notes?: string;
}

export interface ExpenseEntry {
  id: string;
  kind: "expense";
  date: string;
  description: string;
  amount: number;
  note?: string;
}

export type EntryRecord = FlightEntry | ExpenseEntry;

export interface FlightEntryInput {
  date: string;
  clubId: string | null;
  purpose: FlightPurpose;
  hobbsTime: number;
  tachTime?: number;
  nonClubHourlyRate?: number;
  instructorCost?: number;
  notes?: string;
}

export interface ExpenseEntryInput {
  date: string;
  description: string;
  amount: number;
  note?: string;
}
