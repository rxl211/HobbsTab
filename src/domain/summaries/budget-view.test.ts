import { describe, expect, it } from "vitest";

import type { Club, ClubDuesPeriod, Plane, PlaneRatePeriod } from "../clubs/club-types";
import type { EntryRecord } from "../entries/entry-types";
import { buildBudgetProjection } from "./budget-view";

const clubs: Club[] = [
  { id: "club-1", name: "Alpha", active: true },
  { id: "club-2", name: "Bravo", active: true },
];

const duesPeriods: ClubDuesPeriod[] = [
  { id: "dues-1", clubId: "club-1", effectiveFrom: "2026-01-01", monthlyDues: 100 },
  { id: "dues-2", clubId: "club-2", effectiveFrom: "2026-03-01", monthlyDues: 50 },
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
    effectiveFrom: "2026-04-01",
    billingTimeType: "hobbs",
    hourlyRate: 150,
  },
];

const entries: EntryRecord[] = [
  {
    id: "flight-1",
    kind: "flight",
    date: "2023-06-10",
    clubId: "club-1",
    planeId: "plane-1",
    purpose: "training",
    flightTime: 1.4,
    billedTime: 1.2,
    billingTimeTypeUsed: "tach",
    hourlyRateUsed: 140,
    aircraftCost: 168,
    instructorCost: 300,
  },
  {
    id: "flight-2",
    kind: "flight",
    date: "2025-05-10",
    clubId: "club-1",
    planeId: "plane-1",
    purpose: "training",
    flightTime: 1.6,
    billedTime: 1.3,
    billingTimeTypeUsed: "tach",
    hourlyRateUsed: 160,
    aircraftCost: 208,
    instructorCost: 600,
  },
  {
    id: "flight-3",
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
    id: "flight-4",
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
    id: "flight-5",
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
  {
    id: "expense-1",
    kind: "expense",
    date: "2026-03-20",
    description: "Headset battery",
    amount: 45,
  },
];

describe("budget view", () => {
  it("builds fixed costs, instruction buckets, cheapest plane, projections, and progress", () => {
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
    expect(projection.instructionBudgetSource).toBe("auto");
    expect(projection.instructionBudgetYearsUsed).toEqual([2025, 2024, 2023]);
    expect(projection.instructionYearlyTotals).toEqual([
      { year: 2025, instructorCost: 600 },
      { year: 2024, instructorCost: 0 },
      { year: 2023, instructorCost: 300 },
    ]);
    expect(projection.plannedInstructionBudget).toBe(300);
    expect(projection.plannedFlyingBudget).toBe(3000);
    expect(projection.instructionSpendThisYear).toBe(80);
    expect(projection.instructionOverspendThisYear).toBe(0);
    expect(projection.aircraftSpendThisYear).toBe(786);
    expect(projection.otherExpenseSpendThisYear).toBe(45);
    expect(projection.remainingInstructionBudget).toBe(220);
    expect(projection.remainingFlyingBudget).toBe(2169);
    expect(projection.cheapestPlane?.planeId).toBe("plane-2");
    expect(projection.cheapestPlane?.hourlyRate).toBe(150);
    expect(projection.projectedBillableHours).toBe(20);
    expect(projection.projectedActualHours).toBe(20);
    expect(projection.typicalFlightHours).toBe(1.6);
    expect(projection.projectedFlights).toBe(12);
    expect(projection.flightsCompletedThisYear).toBe(3);
    expect(projection.flightsRemainingThisYear).toBe(9);
    expect(projection.projectedFlightsCompletionPercent).toBe(25);
  });

  it("uses an override instruction budget and floors negative remaining flying budget", () => {
    const projection = buildBudgetProjection({
      annualBudget: 2200,
      instructionBudgetOverride: 900,
      clubs,
      duesPeriods,
      planes: [{ id: "plane-1", clubId: "club-1", name: "C172", active: true }],
      planeRatePeriods: [planeRatePeriods[0]],
      entries,
      now: new Date("2026-04-13T12:00:00"),
    });

    expect(projection.instructionBudgetSource).toBe("override");
    expect(projection.plannedInstructionBudget).toBe(900);
    expect(projection.plannedFlyingBudget).toBe(0);
    expect(projection.instructionOverspendThisYear).toBe(0);
    expect(projection.remainingFlyingBudget).toBe(0);
    expect(projection.aircraftSpendThisYear).toBe(786);
    expect(projection.otherExpenseSpendThisYear).toBe(45);
    expect(projection.projectedBillableHours).toBe(0);
    expect(projection.tachToHobbsRatio).toBe(1.2);
    expect(projection.projectedActualHours).toBe(0);
  });

  it("uses a default 1.3 hour flight duration when there are no logged flights", () => {
    const projection = buildBudgetProjection({
      annualBudget: 5000,
      clubs,
      duesPeriods,
      planes: [{ id: "plane-2", clubId: "club-2", name: "Cherokee", active: true }],
      planeRatePeriods: [planeRatePeriods[1]],
      entries: [],
      now: new Date("2026-04-13T12:00:00"),
    });

    expect(projection.plannedInstructionBudget).toBe(0);
    expect(projection.projectedActualHours).toBe(22);
    expect(projection.typicalFlightHours).toBe(1.3);
    expect(projection.isDefaultTypicalFlightHours).toBe(true);
    expect(projection.aircraftSpendThisYear).toBe(0);
    expect(projection.otherExpenseSpendThisYear).toBe(0);
    expect(projection.instructionSpendThisYear).toBe(0);
    expect(projection.instructionOverspendThisYear).toBe(0);
    expect(projection.projectedFlights).toBe(16);
    expect(projection.flightsRemainingThisYear).toBe(16);
  });

  it("lets instruction overspend reduce still-available flying budget", () => {
    const projection = buildBudgetProjection({
      annualBudget: 5000,
      instructionBudgetOverride: 100,
      clubs,
      duesPeriods,
      planes,
      planeRatePeriods,
      entries: [
        ...entries,
        {
          id: "flight-6",
          kind: "flight",
          date: "2026-04-10",
          clubId: "club-1",
          planeId: "plane-1",
          purpose: "training",
          flightTime: 1.1,
          billedTime: 1,
          billingTimeTypeUsed: "tach",
          hourlyRateUsed: 160,
          aircraftCost: 160,
          instructorCost: 107.5,
        },
      ],
      now: new Date("2026-04-13T12:00:00"),
    });

    expect(projection.plannedInstructionBudget).toBe(100);
    expect(projection.instructionSpendThisYear).toBe(187.5);
    expect(projection.instructionOverspendThisYear).toBe(87.5);
    expect(projection.remainingInstructionBudget).toBe(0);
    expect(projection.plannedFlyingBudget).toBe(3200);
    expect(projection.remainingFlyingBudget).toBe(2121.5);
  });
});
