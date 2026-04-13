import type { Club, ClubDuesPeriod, Plane, PlaneRatePeriod } from "../domain/clubs/club-types";
import { defaultPlaneIdForClub } from "../domain/clubs/club-rules";
import type { EntryRecord, ExpenseEntry, FlightEntry } from "../domain/entries/entry-types";

export interface LegacyClubRatePeriod {
  id: string;
  clubId: string;
  effectiveFrom: string;
  billingTimeType: "hobbs" | "tach";
  hourlyRate: number;
  monthlyDues: number;
}

interface LegacyFlightEntry {
  id: string;
  kind: "flight";
  date: string;
  clubId: string | null;
  purpose: "hobby" | "training" | "checkFlight";
  hobbsTime: number;
  tachTime?: number;
  billingTimeTypeUsed: "hobbs" | "tach";
  hourlyRateUsed: number;
  aircraftCost: number;
  instructorCost?: number;
  notes?: string;
}

type LegacyEntryRecord = LegacyFlightEntry | ExpenseEntry;
export type { LegacyEntryRecord };

export interface MigratedModel {
  clubs: Club[];
  planes: Plane[];
  clubDuesPeriods: ClubDuesPeriod[];
  planeRatePeriods: PlaneRatePeriod[];
  entries: EntryRecord[];
}

export const migrateLegacyModel = (
  clubs: Club[],
  legacyRatePeriods: LegacyClubRatePeriod[],
  legacyEntries: LegacyEntryRecord[],
): MigratedModel => {
  const planes = clubs.map((club) => ({
    id: defaultPlaneIdForClub(club.id),
    clubId: club.id,
    name: "Default plane",
    active: true,
  }));

  const clubDuesPeriods = legacyRatePeriods.map((period) => ({
    id: `dues:${period.id}`,
    clubId: period.clubId,
    effectiveFrom: period.effectiveFrom,
    monthlyDues: period.monthlyDues,
  }));

  const planeRatePeriods = legacyRatePeriods.map((period) => ({
    id: `plane-rate:${period.id}`,
    planeId: defaultPlaneIdForClub(period.clubId),
    effectiveFrom: period.effectiveFrom,
    billingTimeType: period.billingTimeType,
    hourlyRate: period.hourlyRate,
  }));

  const entries = legacyEntries.map<EntryRecord>((entry) => {
    if (entry.kind === "expense") {
      return entry;
    }

    return {
      id: entry.id,
      kind: "flight",
      date: entry.date,
      clubId: entry.clubId,
      planeId: entry.clubId ? defaultPlaneIdForClub(entry.clubId) : null,
      purpose: entry.purpose,
      flightTime: entry.hobbsTime,
      billedTime:
        entry.billingTimeTypeUsed === "tach"
          ? entry.tachTime ?? entry.hobbsTime
          : entry.hobbsTime,
      billingTimeTypeUsed: entry.billingTimeTypeUsed,
      hourlyRateUsed: entry.hourlyRateUsed,
      aircraftCost: entry.aircraftCost,
      instructorCost: entry.instructorCost,
      notes: entry.notes,
    } satisfies FlightEntry;
  });

  return {
    clubs,
    planes,
    clubDuesPeriods,
    planeRatePeriods,
    entries,
  };
};
