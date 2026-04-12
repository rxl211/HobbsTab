import type { Club, ClubRatePeriod } from "../domain/clubs/club-types";
import type { EntryRecord } from "../domain/entries/entry-types";
import { db } from "./db";

export interface HobbsTabBackup {
  version: 1;
  exportedAt: string;
  clubs: Club[];
  clubRatePeriods: ClubRatePeriod[];
  entries: EntryRecord[];
}

const isBackupData = (value: unknown): value is HobbsTabBackup => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HobbsTabBackup>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.clubs) &&
    Array.isArray(candidate.clubRatePeriods) &&
    Array.isArray(candidate.entries)
  );
};

export const exportBackup = async (): Promise<HobbsTabBackup> => {
  const [clubs, clubRatePeriods, entries] = await Promise.all([
    db.clubs.toArray(),
    db.clubRatePeriods.toArray(),
    db.entries.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    clubs,
    clubRatePeriods,
    entries,
  };
};

export const importBackup = async (payload: unknown) => {
  if (!isBackupData(payload)) {
    throw new Error("That file does not look like a HobbsTab backup.");
  }

  await db.transaction("rw", db.clubs, db.clubRatePeriods, db.entries, async () => {
    await db.clubs.clear();
    await db.clubRatePeriods.clear();
    await db.entries.clear();

    if (payload.clubs.length > 0) {
      await db.clubs.bulkPut(payload.clubs);
    }
    if (payload.clubRatePeriods.length > 0) {
      await db.clubRatePeriods.bulkPut(payload.clubRatePeriods);
    }
    if (payload.entries.length > 0) {
      await db.entries.bulkPut(payload.entries);
    }
  });
};
