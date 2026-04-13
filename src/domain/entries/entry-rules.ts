import type { PlaneRatePeriod } from "../clubs/club-types";
import { getApplicablePlaneRate } from "../clubs/club-rules";
import type {
  ExpenseEntry,
  ExpenseEntryInput,
  FlightEntry,
  FlightEntryInput,
} from "./entry-types";

export const buildFlightEntry = (
  id: string,
  input: FlightEntryInput,
  ratePeriods: PlaneRatePeriod[],
): FlightEntry => {
  if (input.clubId) {
    if (!input.planeId) {
      throw new Error("Plane is required for club-billed flights.");
    }

    const ratePeriod = getApplicablePlaneRate(ratePeriods, input.planeId, input.date);

    if (!ratePeriod) {
      throw new Error("No plane rate period covers that flight date.");
    }

    return {
      id,
      kind: "flight",
      date: input.date,
      clubId: input.clubId,
      planeId: input.planeId,
      purpose: input.purpose,
      flightTime: input.flightTime,
      billedTime: input.billedTime,
      billingTimeTypeUsed: ratePeriod.billingTimeType,
      hourlyRateUsed: ratePeriod.hourlyRate,
      aircraftCost: Number((input.billedTime * ratePeriod.hourlyRate).toFixed(2)),
      instructorCost: input.instructorCost,
      notes: input.notes?.trim() || undefined,
    };
  }

  if (input.nonClubHourlyRate === undefined) {
    throw new Error("Hourly rate is required for non-club flights.");
  }

  return {
    id,
    kind: "flight",
    date: input.date,
    clubId: null,
    planeId: null,
    purpose: input.purpose,
    flightTime: input.flightTime,
    billedTime: input.billedTime,
    billingTimeTypeUsed: "hobbs",
    hourlyRateUsed: input.nonClubHourlyRate,
    aircraftCost: Number((input.billedTime * input.nonClubHourlyRate).toFixed(2)),
    instructorCost: input.instructorCost,
    notes: input.notes?.trim() || undefined,
  };
};

export const buildExpenseEntry = (id: string, input: ExpenseEntryInput): ExpenseEntry => ({
  id,
  kind: "expense",
  date: input.date,
  description: input.description.trim(),
  amount: Number(input.amount.toFixed(2)),
  note: input.note?.trim() || undefined,
});

export const entryTotal = (entry: FlightEntry | ExpenseEntry) =>
  entry.kind === "flight"
    ? entry.aircraftCost + (entry.instructorCost ?? 0)
    : entry.amount;
