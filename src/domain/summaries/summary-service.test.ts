import { describe, expect, it } from "vitest";

import type { Club, ClubDuesPeriod } from "../clubs/club-types";
import type { EntryRecord } from "../entries/entry-types";
import { buildMonthlySummaries, buildSyntheticDues } from "./summary-service";

const club: Club = {
  id: "club-1",
  name: "Foothill Flying Club",
  active: true,
};

const duesPeriods: ClubDuesPeriod[] = [
  {
    id: "dues-1",
    clubId: club.id,
    effectiveFrom: "2026-01-01",
    monthlyDues: 90,
  },
  {
    id: "dues-2",
    clubId: club.id,
    effectiveFrom: "2026-03-01",
    monthlyDues: 110,
  },
];

const entries: EntryRecord[] = [
  {
    id: "flight-1",
    kind: "flight",
    date: "2026-03-10",
    clubId: club.id,
    planeId: "plane-1",
    purpose: "training",
    flightTime: 1.5,
    billedTime: 1.5,
    billingTimeTypeUsed: "hobbs",
    hourlyRateUsed: 130,
    aircraftCost: 195,
    instructorCost: 60,
  },
  {
    id: "expense-1",
    kind: "expense",
    date: "2026-03-12",
    description: "Headset repair",
    amount: 40,
  },
];

describe("summary service", () => {
  it("uses the correct monthly dues after a retroactive rate change", () => {
    const dues = buildSyntheticDues([club], duesPeriods, entries);

    expect(dues.find((due) => due.monthKey === "2026-02")?.monthlyDues).toBe(90);
    expect(dues.find((due) => due.monthKey === "2026-03")?.monthlyDues).toBe(110);
  });

  it("calculates fixed, variable, and training totals together", () => {
    const dues = buildSyntheticDues([club], duesPeriods, entries);
    const monthly = buildMonthlySummaries(entries, dues);
    const march = monthly.find((summary) => summary.monthKey === "2026-03");

    expect(march).toBeDefined();
    expect(march?.fixedSpend).toBe(110);
    expect(march?.variableSpend).toBe(295);
    expect(march?.trainingSpend).toBe(255);
    expect(march?.totalSpend).toBe(405);
    expect(march?.hoursFlown).toBe(1.5);
  });
});
