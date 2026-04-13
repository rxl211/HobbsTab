import { describe, expect, it } from "vitest";

import type { Club, ClubDuesPeriod, Plane, PlaneRatePeriod } from "../clubs/club-types";
import type { EntryRecord } from "../entries/entry-types";
import { buildBudgetProjection } from "./budget-view";

const clubs: Club[] = [
  { id: "club-1", name: "Alpha", active: true },
  { id: "club-2", name: "Bravo", active: true },
  { id: "club-3", name: "Inactive", active: false },
];

const duesPeriods: ClubDuesPeriod[] = [
  { id: "dues-1", clubId: "club-1", effectiveFrom: "2026-01-01", monthlyDues: 100 },
  { id: "dues-2", clubId: "club-2", effectiveFrom: "2026-03-01", monthlyDues: 50 },
  { id: "dues-3", clubId: "club-3", effectiveFrom: "2026-01-01", monthlyDues: 999 },
];

const planes: Plane[] = [
  { id: "plane-1", clubId: "club-1", name: "C172", active: true },
  { id: "plane-2", clubId: "club-2", name: "Cherokee", active: true },
];

const planeRatePeriods: PlaneRatePeriod[] = [
  {
    id: "rate-1",
    planeId: "plane-1",
    effectiveFrom: "2026-01-01",
    billingTimeType: "tach",
    hourlyRate: 160,
  },
  {
    id: "rate-2",
    planeId: "plane-2",
    effectiveFrom: "2026-01-01",
    billingTimeType: "hobbs",
    hourlyRate: 170,
  },
  {
    id: "rate-3",
    planeId: "plane-2",
    effectiveFrom: "2026-04-01",
    billingTimeType: "hobbs",
    hourlyRate: 150,
  },
];

const entries: EntryRecord[] = [
  {
    id: "flight-1",
    kind: "flight",
    date: "2026-01-10",
    clubId: "club-1",
    planeId: "plane-1",
    purpose: "hobby",
    flightTime: 1.2,
    billedTime: 1,
    billingTimeTypeUsed: "tach",
    hourlyRateUsed: 160,
    aircraftCost: 160,
  },
  {
    id: "flight-2",
    kind: "flight",
    date: "2026-02-15",
    clubId: "club-1",
    planeId: "plane-1",
    purpose: "training",
    flightTime: 2.4,
    billedTime: 2,
    billingTimeTypeUsed: "tach",
    hourlyRateUsed: 160,
    aircraftCost: 320,
    instructorCost: 80,
  },
  {
    id: "flight-3",
    kind: "flight",
    date: "2026-03-01",
    clubId: "club-2",
    planeId: "plane-2",
    purpose: "hobby",
    flightTime: 1.8,
    billedTime: 1.8,
    billingTimeTypeUsed: "hobbs",
    hourlyRateUsed: 170,
    aircraftCost: 306,
  },
];

describe("budget view", () => {
  it("builds fixed costs, cheapest plane, projections, and progress", () => {
    const projection = buildBudgetProjection({
      annualBudget: 5000,
      clubs,
      duesPeriods,
      planes,
      planeRatePeriods,
      entries,
      now: new Date("2026-04-13T12:00:00"),
    });

    expect(projection.fixedCosts).toBe(1700);
    expect(projection.flyingBudget).toBe(3300);
    expect(projection.cheapestPlane?.planeId).toBe("plane-2");
    expect(projection.cheapestPlane?.hourlyRate).toBe(150);
    expect(projection.projectedBillableHours).toBe(22);
    expect(projection.projectedActualHours).toBe(22);
    expect(projection.typicalFlightHours).toBe(1.8);
    expect(projection.projectedFlights).toBe(12);
    expect(projection.flightsCompletedThisYear).toBe(3);
    expect(projection.flightsRemainingThisYear).toBe(9);
    expect(projection.tachFlightSampleCount).toBe(2);
    expect(projection.flightDurationSampleCount).toBe(3);
    expect(projection.projectedFlightsCompletionPercent).toBe(25);
  });

  it("uses median tach conversion for tach-billed projections and floors negative flying budget", () => {
    const projection = buildBudgetProjection({
      annualBudget: 1000,
      clubs,
      duesPeriods,
      planes: [{ id: "plane-1", clubId: "club-1", name: "C172", active: true }],
      planeRatePeriods: [planeRatePeriods[0]],
      entries,
      now: new Date("2026-04-13T12:00:00"),
    });

    expect(projection.flyingBudget).toBe(0);
    expect(projection.projectedBillableHours).toBe(0);
    expect(projection.tachToHobbsRatio).toBe(1.2);
    expect(projection.projectedActualHours).toBe(0);
    expect(projection.tachFlightSampleCount).toBe(2);
  });

  it("leaves actual-hour and flight projections unavailable without the needed history", () => {
    const projection = buildBudgetProjection({
      annualBudget: 5000,
      clubs,
      duesPeriods,
      planes: [{ id: "plane-1", clubId: "club-1", name: "C172", active: true }],
      planeRatePeriods: [planeRatePeriods[0]],
      entries: [],
      now: new Date("2026-04-13T12:00:00"),
    });

    expect(projection.projectedBillableHours).toBe(20.63);
    expect(projection.projectedActualHours).toBeUndefined();
    expect(projection.projectedFlights).toBeUndefined();
    expect(projection.flightsRemainingThisYear).toBeUndefined();
    expect(projection.tachFlightSampleCount).toBe(0);
    expect(projection.flightDurationSampleCount).toBe(0);
    expect(projection.projectedFlightsUnavailableReason).toBe(
      "Not enough prior tach-billed flights to convert billable time into actual flight hours.",
    );
  });
});
