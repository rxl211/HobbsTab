import Dexie, { type EntityTable } from "dexie";

import type {
  Club,
  ClubDuesPeriod,
  Plane,
  PlaneRatePeriod,
} from "../domain/clubs/club-types";
import type { EntryRecord } from "../domain/entries/entry-types";
import type { LegacyClubRatePeriod, LegacyEntryRecord } from "./migrations";
import { migrateLegacyModel } from "./migrations";

export class HobbsTabDatabase extends Dexie {
  clubs!: EntityTable<Club, "id">;
  planes!: EntityTable<Plane, "id">;
  clubDuesPeriods!: EntityTable<ClubDuesPeriod, "id">;
  planeRatePeriods!: EntityTable<PlaneRatePeriod, "id">;
  entries!: EntityTable<EntryRecord, "id">;

  constructor() {
    super("hobbstab");

    this.version(1).stores({
      clubs: "&id, name, active",
      clubRatePeriods: "&id, clubId, effectiveFrom",
      entries: "&id, kind, date, clubId",
    });

    this.version(2)
      .stores({
        clubs: "&id, name, active",
        planes: "&id, clubId, name, active",
        clubDuesPeriods: "&id, clubId, effectiveFrom",
        planeRatePeriods: "&id, planeId, effectiveFrom",
        entries: "&id, kind, date, clubId, planeId",
      })
      .upgrade(async (tx) => {
        const clubs = (await tx.table("clubs").toArray()) as Club[];
        const legacyRatePeriods = (await tx.table("clubRatePeriods").toArray()) as LegacyClubRatePeriod[];
        const legacyEntries = (await tx.table("entries").toArray()) as LegacyEntryRecord[];

        const migrated = migrateLegacyModel(clubs, legacyRatePeriods, legacyEntries);

        await tx.table("planes").bulkPut(migrated.planes);
        await tx.table("clubDuesPeriods").bulkPut(migrated.clubDuesPeriods);
        await tx.table("planeRatePeriods").bulkPut(migrated.planeRatePeriods);
        await tx.table("entries").clear();
        await tx.table("entries").bulkPut(migrated.entries);
      });
  }
}

export const db = new HobbsTabDatabase();
