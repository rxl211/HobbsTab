import { afterEach, describe, expect, it, vi } from "vitest";

import type { EntryRecord } from "../entries/entry-types";
import type { SyntheticDueRow } from "./summary-types";
import { buildScopedSummaryTotals, buildSpendTrendBuckets } from "./summary-view";

const entries: EntryRecord[] = [
  {
    id: "flight-apr-03",
    kind: "flight",
    date: "2025-04-03",
    clubId: "club-1",
    planeId: "plane-1",
    purpose: "hobby",
    flightTime: 1.2,
    billedTime: 1.2,
    billingTimeTypeUsed: "hobbs",
    hourlyRateUsed: 155,
    aircraftCost: 186,
  },
  {
    id: "flight-apr-16",
    kind: "flight",
    date: "2025-04-16",
    clubId: "club-1",
    planeId: "plane-1",
    purpose: "hobby",
    flightTime: 2.4,
    billedTime: 2.4,
    billingTimeTypeUsed: "hobbs",
    hourlyRateUsed: 155,
    aircraftCost: 372,
  },
  {
    id: "flight-apr-04-2026",
    kind: "flight",
    date: "2026-04-04",
    clubId: "club-1",
    planeId: "plane-1",
    purpose: "training",
    flightTime: 1.4,
    billedTime: 1.4,
    billingTimeTypeUsed: "hobbs",
    hourlyRateUsed: 160,
    aircraftCost: 224,
  },
];

const syntheticDues: SyntheticDueRow[] = [
  {
    id: "due-apr-2025",
    kind: "syntheticDue",
    clubId: "club-1",
    clubName: "Evergreen Flying Club",
    monthKey: "2025-04",
    date: "2025-04-01",
    monthlyDues: 115,
    duesPeriodId: "dues-1",
  },
  {
    id: "due-apr-2026",
    kind: "syntheticDue",
    clubId: "club-1",
    clubName: "Evergreen Flying Club",
    monthKey: "2026-04",
    date: "2026-04-01",
    monthlyDues: 115,
    duesPeriodId: "dues-2",
  },
];

describe("summary view", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses an exact rolling 365-day window for the 1 year scope", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T12:00:00"));

    const totals = buildScopedSummaryTotals(entries, syntheticDues, "oneYear");

    expect(totals.hoursFlown).toBe(3.8);
    expect(totals.flightSpend).toBe(596);
    expect(totals.otherExpenseSpend).toBe(0);
    expect(totals.duesSpend).toBe(115);
    expect(totals.totalSpend).toBe(711);
    expect(totals.flightCount).toBe(2);
  });

  it("aggregates monthly summaries into yearly trend buckets", () => {
    const buckets = buildSpendTrendBuckets(
      [
        {
          monthKey: "2024-12",
          totalSpend: 200,
          fixedSpend: 50,
          variableSpend: 150,
          hobbySpend: 120,
          trainingSpend: 30,
          checkFlightSpend: 0,
          hoursFlown: 1.5,
          costPerHour: 133.33,
          flightCount: 1,
          expenseCount: 0,
        },
        {
          monthKey: "2026-01",
          totalSpend: 75,
          fixedSpend: 25,
          variableSpend: 50,
          hobbySpend: 0,
          trainingSpend: 50,
          checkFlightSpend: 0,
          hoursFlown: 0.5,
          costPerHour: 150,
          flightCount: 1,
          expenseCount: 0,
        },
        {
          monthKey: "2026-03",
          totalSpend: 125,
          fixedSpend: 25,
          variableSpend: 100,
          hobbySpend: 100,
          trainingSpend: 0,
          checkFlightSpend: 0,
          hoursFlown: 0.9,
          costPerHour: 138.89,
          flightCount: 1,
          expenseCount: 0,
        },
      ],
      "year",
    );

    expect(buckets).toEqual([
      { id: "2024", label: "2024", totalSpend: 200 },
      { id: "2025", label: "2025", totalSpend: 0 },
      { id: "2026", label: "2026", totalSpend: 200 },
    ]);
  });
});
