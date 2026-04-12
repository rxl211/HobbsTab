import Dexie, { type EntityTable } from "dexie";

import type { Club, ClubRatePeriod } from "../domain/clubs/club-types";
import type { EntryRecord } from "../domain/entries/entry-types";

export class HobbsTabDatabase extends Dexie {
  clubs!: EntityTable<Club, "id">;
  clubRatePeriods!: EntityTable<ClubRatePeriod, "id">;
  entries!: EntityTable<EntryRecord, "id">;

  constructor() {
    super("hobbstab");

    this.version(1).stores({
      clubs: "&id, name, active",
      clubRatePeriods: "&id, clubId, effectiveFrom",
      entries: "&id, kind, date, clubId",
    });
  }
}

export const db = new HobbsTabDatabase();
