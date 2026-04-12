import type { Club, ClubRatePeriod } from "../domain/clubs/club-types";
import { db } from "./db";

export const listClubs = () => db.clubs.toArray();

export const listClubRatePeriods = () => db.clubRatePeriods.toArray();

export const saveClub = async (club: Club) => {
  await db.clubs.put(club);
};

export const saveClubRatePeriod = async (ratePeriod: ClubRatePeriod) => {
  await db.clubRatePeriods.put(ratePeriod);
};

export const deleteClub = async (clubId: string) => {
  await db.transaction("rw", db.clubs, db.clubRatePeriods, db.entries, async () => {
    await db.clubs.delete(clubId);
    await db.clubRatePeriods.where("clubId").equals(clubId).delete();
    await db.entries.where("clubId").equals(clubId).modify((entry) => {
      if (entry.kind === "flight") {
        entry.clubId = null;
      }
    });
  });
};

export const deleteClubRatePeriod = async (ratePeriodId: string) => {
  await db.clubRatePeriods.delete(ratePeriodId);
};
