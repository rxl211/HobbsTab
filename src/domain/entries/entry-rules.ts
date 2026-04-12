import type { ClubRatePeriod } from "../clubs/club-types";
import { getApplicableClubRate } from "../clubs/club-rules";
import type {
  ExpenseEntry,
  ExpenseEntryInput,
  FlightEntry,
  FlightEntryInput,
} from "./entry-types";

export const buildFlightEntry = (
  id: string,
  input: FlightEntryInput,
  ratePeriods: ClubRatePeriod[],
): FlightEntry => {
  if (input.clubId) {
    const ratePeriod = getApplicableClubRate(ratePeriods, input.clubId, input.date);

    if (!ratePeriod) {
      throw new Error("No club rate period covers that flight date.");
    }

    const billedHours =
      ratePeriod.billingTimeType === "tach" ? input.tachTime ?? 0 : input.hobbsTime;

    if (ratePeriod.billingTimeType === "tach" && !input.tachTime) {
      throw new Error("Tach time is required for tach-billed club flights.");
    }

    return {
      id,
      kind: "flight",
      date: input.date,
      clubId: input.clubId,
      purpose: input.purpose,
      hobbsTime: input.hobbsTime,
      tachTime: input.tachTime,
      billingTimeTypeUsed: ratePeriod.billingTimeType,
      hourlyRateUsed: ratePeriod.hourlyRate,
      aircraftCost: Number((billedHours * ratePeriod.hourlyRate).toFixed(2)),
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
    purpose: input.purpose,
    hobbsTime: input.hobbsTime,
    billingTimeTypeUsed: "hobbs",
    hourlyRateUsed: input.nonClubHourlyRate,
    aircraftCost: Number((input.hobbsTime * input.nonClubHourlyRate).toFixed(2)),
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
