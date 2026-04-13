import type {
  Club,
  ClubDuesPeriod,
  Plane,
  PlaneRatePeriod,
} from "../domain/clubs/club-types";
import { db } from "./db";

export const listClubs = () => db.clubs.toArray();

export const listPlanes = () => db.planes.toArray();

export const listClubDuesPeriods = () => db.clubDuesPeriods.toArray();

export const listPlaneRatePeriods = () => db.planeRatePeriods.toArray();

export const saveClub = async (club: Club) => {
  await db.clubs.put(club);
};

export const savePlane = async (plane: Plane) => {
  await db.planes.put(plane);
};

export const saveClubDuesPeriod = async (period: ClubDuesPeriod) => {
  await db.clubDuesPeriods.put(period);
};

export const savePlaneRatePeriod = async (period: PlaneRatePeriod) => {
  await db.planeRatePeriods.put(period);
};

export const deleteClub = async (clubId: string) => {
  await db.transaction(
    "rw",
    [db.clubs, db.planes, db.clubDuesPeriods, db.planeRatePeriods, db.entries],
    async () => {
      const clubPlaneIds = await db.planes.where("clubId").equals(clubId).primaryKeys();
      await db.clubs.delete(clubId);
      await db.planes.where("clubId").equals(clubId).delete();
      await db.clubDuesPeriods.where("clubId").equals(clubId).delete();

      for (const planeId of clubPlaneIds) {
        await db.planeRatePeriods.where("planeId").equals(String(planeId)).delete();
      }

      await db.entries.where("clubId").equals(clubId).modify((entry) => {
        if (entry.kind === "flight") {
          entry.clubId = null;
          entry.planeId = null;
        }
      });
    },
  );
};

export const deletePlane = async (planeId: string) => {
  await db.transaction("rw", db.planes, db.planeRatePeriods, db.entries, async () => {
    await db.planes.delete(planeId);
    await db.planeRatePeriods.where("planeId").equals(planeId).delete();
    await db.entries.where("planeId").equals(planeId).modify((entry) => {
      if (entry.kind === "flight") {
        entry.planeId = null;
      }
    });
  });
};

export const deleteClubDuesPeriod = async (periodId: string) => {
  await db.clubDuesPeriods.delete(periodId);
};

export const deletePlaneRatePeriod = async (periodId: string) => {
  await db.planeRatePeriods.delete(periodId);
};
