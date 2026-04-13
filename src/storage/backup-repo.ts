import type {
  Club,
  ClubDuesPeriod,
  Plane,
  PlaneRatePeriod,
} from "../domain/clubs/club-types";
import type { EntryRecord } from "../domain/entries/entry-types";
import type { BudgetSetting } from "../domain/settings/settings-types";
import type { LegacyClubRatePeriod, LegacyEntryRecord } from "./migrations";
import { migrateLegacyModel } from "./migrations";
import { db } from "./db";

export interface HobbsTabBackupV3 {
  version: 3;
  exportedAt: string;
  clubs: Club[];
  planes: Plane[];
  clubDuesPeriods: ClubDuesPeriod[];
  planeRatePeriods: PlaneRatePeriod[];
  entries: EntryRecord[];
  settings: BudgetSetting[];
}

interface HobbsTabBackupV2 {
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

export type HobbsTabBackup = HobbsTabBackupV3;

const isBackupV3 = (value: unknown): value is HobbsTabBackupV3 => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HobbsTabBackupV3>;
  return (
    candidate.version === 3 &&
    Array.isArray(candidate.clubs) &&
    Array.isArray(candidate.planes) &&
    Array.isArray(candidate.clubDuesPeriods) &&
    Array.isArray(candidate.planeRatePeriods) &&
    Array.isArray(candidate.entries) &&
    Array.isArray(candidate.settings)
  );
};

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
  const [clubs, planes, clubDuesPeriods, planeRatePeriods, entries, settings] = await Promise.all([
    db.clubs.toArray(),
    db.planes.toArray(),
    db.clubDuesPeriods.toArray(),
    db.planeRatePeriods.toArray(),
    db.entries.toArray(),
    db.settings.toArray(),
  ]);

  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    clubs,
    planes,
    clubDuesPeriods,
    planeRatePeriods,
    entries,
    settings,
  };
};

export const importBackup = async (payload: unknown) => {
  const normalized = isBackupV3(payload)
    ? payload
    : isBackupV2(payload)
      ? {
          ...payload,
          version: 3 as const,
          settings: [],
        }
    : isBackupV1(payload)
      ? {
          version: 3 as const,
          exportedAt: payload.exportedAt,
          ...migrateLegacyModel(payload.clubs, payload.clubRatePeriods, payload.entries),
          settings: [],
        }
      : null;

  if (!normalized) {
    throw new Error("That file does not look like a HobbsTab backup.");
  }

  await db.transaction(
    "rw",
    [db.clubs, db.planes, db.clubDuesPeriods, db.planeRatePeriods, db.entries, db.settings],
    async () => {
      await db.clubs.clear();
      await db.planes.clear();
      await db.clubDuesPeriods.clear();
      await db.planeRatePeriods.clear();
      await db.entries.clear();
      await db.settings.clear();

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
      if (normalized.settings.length > 0) {
        await db.settings.bulkPut(normalized.settings);
      }
    },
  );
};
