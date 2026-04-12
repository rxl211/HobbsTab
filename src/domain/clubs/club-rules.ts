import type { ClubRatePeriod } from "./club-types";

export const getApplicableClubRate = (
  ratePeriods: ClubRatePeriod[],
  clubId: string,
  date: string,
) =>
  ratePeriods
    .filter((period) => period.clubId === clubId && period.effectiveFrom <= date)
    .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom))[0];

export const sortRatePeriods = (ratePeriods: ClubRatePeriod[]) =>
  [...ratePeriods].sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom));
