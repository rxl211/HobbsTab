import { describe, expect, it } from "vitest";

import type { Club } from "../domain/clubs/club-types";
import type { EntryRecord } from "../domain/entries/entry-types";
import { defaultPlaneIdForClub } from "../domain/clubs/club-rules";
import { migrateLegacyModel, type LegacyClubRatePeriod } from "./migrations";

describe("migrateLegacyModel", () => {
  it("creates default planes and preserves historical flight pricing snapshots", () => {
    const clubs: Club[] = [
      { id: "club-1", name: "Evergreen Flying Club", active: true },
    ];
    const ratePeriods: LegacyClubRatePeriod[] = [
      {
        id: "rate-1",
        clubId: "club-1",
        effectiveFrom: "2026-01-01",
        billingTimeType: "tach",
        hourlyRate: 160,
        monthlyDues: 115,
      },
    ];
    const entries = [
      {
        id: "flight-1",
        kind: "flight" as const,
        date: "2026-02-10",
        clubId: "club-1",
        purpose: "checkFlight" as const,
        hobbsTime: 1,
        tachTime: 0.84,
        billingTimeTypeUsed: "tach" as const,
        hourlyRateUsed: 160,
        aircraftCost: 134.4,
        instructorCost: 187.5,
      },
    ] satisfies EntryRecord[] | unknown;

    const migrated = migrateLegacyModel(clubs, ratePeriods, entries as Parameters<typeof migrateLegacyModel>[2]);

    expect(migrated.planes).toEqual([
      {
        id: defaultPlaneIdForClub("club-1"),
        clubId: "club-1",
        name: "Default plane",
        active: true,
      },
    ]);
    expect(migrated.clubDuesPeriods[0]?.monthlyDues).toBe(115);
    expect(migrated.planeRatePeriods[0]?.hourlyRate).toBe(160);
    expect(migrated.entries[0]).toMatchObject({
      clubId: "club-1",
      planeId: defaultPlaneIdForClub("club-1"),
      flightTime: 1,
      billedTime: 0.84,
      aircraftCost: 134.4,
      instructorCost: 187.5,
    });
  });
});
