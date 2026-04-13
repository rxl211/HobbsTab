import { afterEach, describe, expect, it, vi } from "vitest";

import type { EntryRecord } from "../entries/entry-types";
import type { SyntheticDueRow } from "./summary-types";
import { buildScopedSummaryTotals } from "./summary-view";

const entries: EntryRecord[] = [
  {
    id: "flight-apr-03",
    kind: "flight",
    date: "2025-04-03",
    clubId: "club-1",
    purpose: "hobby",
    hobbsTime: 1.2,
    billingTimeTypeUsed: "hobbs",
    hourlyRateUsed: 155,
    aircraftCost: 186,
  },
  {
    id: "flight-apr-16",
    kind: "flight",
    date: "2025-04-16",
    clubId: "club-1",
    purpose: "hobby",
    hobbsTime: 2.4,
    billingTimeTypeUsed: "hobbs",
    hourlyRateUsed: 155,
    aircraftCost: 372,
  },
  {
    id: "flight-apr-04-2026",
    kind: "flight",
    date: "2026-04-04",
    clubId: "club-1",
    purpose: "training",
    hobbsTime: 1.4,
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
    ratePeriodId: "rate-1",
  },
  {
    id: "due-apr-2026",
    kind: "syntheticDue",
    clubId: "club-1",
    clubName: "Evergreen Flying Club",
    monthKey: "2026-04",
    date: "2026-04-01",
    monthlyDues: 115,
    ratePeriodId: "rate-2",
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
    expect(totals.variableSpend).toBe(596);
    expect(totals.fixedSpend).toBe(115);
    expect(totals.totalSpend).toBe(711);
    expect(totals.flightCount).toBe(2);
  });
});
