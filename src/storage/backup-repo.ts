import type {
  Club,
  ClubDuesPeriod,
  Plane,
  PlaneRatePeriod,
} from "../domain/clubs/club-types";
import type { EntryRecord } from "../domain/entries/entry-types";
import type { LegacyClubRatePeriod, LegacyEntryRecord } from "./migrations";
import { migrateLegacyModel } from "./migrations";
import { db } from "./db";

export interface HobbsTabBackupV2 {
  version: 2;
  exportedAt: string;
  clubs: Club[];
  planes: Plane[];
  clubDuesPeriods: ClubDuesPeriod[];
  planeRatePeriods: PlaneRatePeriod[];
  entries: EntryRecord[];
}

interface HobbsTabBackupV1 {
  version: 1;
  exportedAt: string;
  clubs: Club[];
  clubRatePeriods: LegacyClubRatePeriod[];
  entries: LegacyEntryRecord[];
}

export type HobbsTabBackup = HobbsTabBackupV2;

const isBackupV2 = (value: unknown): value is HobbsTabBackupV2 => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HobbsTabBackupV2>;
  return (
    candidate.version === 2 &&
    Array.isArray(candidate.clubs) &&
    Array.isArray(candidate.planes) &&
    Array.isArray(candidate.clubDuesPeriods) &&
    Array.isArray(candidate.planeRatePeriods) &&
    Array.isArray(candidate.entries)
  );
};

const isBackupV1 = (value: unknown): value is HobbsTabBackupV1 => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HobbsTabBackupV1>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.clubs) &&
    Array.isArray(candidate.clubRatePeriods) &&
    Array.isArray(candidate.entries)
  );
};

export const exportBackup = async (): Promise<HobbsTabBackup> => {
  const [clubs, planes, clubDuesPeriods, planeRatePeriods, entries] = await Promise.all([
    db.clubs.toArray(),
    db.planes.toArray(),
    db.clubDuesPeriods.toArray(),
    db.planeRatePeriods.toArray(),
    db.entries.toArray(),
  ]);

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    clubs,
    planes,
    clubDuesPeriods,
    planeRatePeriods,
    entries,
  };
};

export const importBackup = async (payload: unknown) => {
  const normalized = isBackupV2(payload)
    ? payload
    : isBackupV1(payload)
      ? {
          version: 2 as const,
          exportedAt: payload.exportedAt,
          ...migrateLegacyModel(payload.clubs, payload.clubRatePeriods, payload.entries),
        }
      : null;

  if (!normalized) {
    throw new Error("That file does not look like a HobbsTab backup.");
  }

  await db.transaction(
    "rw",
    [db.clubs, db.planes, db.clubDuesPeriods, db.planeRatePeriods, db.entries],
    async () => {
      await db.clubs.clear();
      await db.planes.clear();
      await db.clubDuesPeriods.clear();
      await db.planeRatePeriods.clear();
      await db.entries.clear();

      if (normalized.clubs.length > 0) {
        await db.clubs.bulkPut(normalized.clubs);
      }
      if (normalized.planes.length > 0) {
        await db.planes.bulkPut(normalized.planes);
      }
      if (normalized.clubDuesPeriods.length > 0) {
        await db.clubDuesPeriods.bulkPut(normalized.clubDuesPeriods);
      }
      if (normalized.planeRatePeriods.length > 0) {
        await db.planeRatePeriods.bulkPut(normalized.planeRatePeriods);
      }
      if (normalized.entries.length > 0) {
        await db.entries.bulkPut(normalized.entries);
      }
    },
  );
};
