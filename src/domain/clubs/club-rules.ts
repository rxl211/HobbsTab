import type { ClubDuesPeriod, PlaneRatePeriod } from "./club-types";

export const defaultPlaneIdForClub = (clubId: string) => `default-plane:${clubId}`;

export const getApplicablePlaneRate = (
  ratePeriods: PlaneRatePeriod[],
  planeId: string,
  date: string,
) =>
  ratePeriods
    .filter((period) => period.planeId === planeId && period.effectiveFrom <= date)
    .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom))[0];

export const getApplicableClubDues = (
  duesPeriods: ClubDuesPeriod[],
  clubId: string,
  date: string,
) =>
  duesPeriods
    .filter((period) => period.clubId === clubId && period.effectiveFrom <= date)
    .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom))[0];

export const sortDuesPeriods = (duesPeriods: ClubDuesPeriod[]) =>
  [...duesPeriods].sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom));

export const sortPlaneRatePeriods = (ratePeriods: PlaneRatePeriod[]) =>
  [...ratePeriods].sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom));
