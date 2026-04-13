import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BudgetPage } from "./BudgetPage";

const mockUseAppData = vi.fn();

vi.mock("../app/providers", () => ({
  useAppData: () => mockUseAppData(),
}));

describe("BudgetPage", () => {
  it("renders instruction and flight budget sections, saves budgets, and expands details", async () => {
    const updateAnnualBudget = vi.fn().mockResolvedValue(undefined);
    const updateInstructionBudgetOverride = vi.fn().mockResolvedValue(undefined);
    const clearInstructionBudgetOverride = vi.fn().mockResolvedValue(undefined);

    mockUseAppData.mockReturnValue({
      budgetSetting: { key: "annualBudget", amount: 5000 },
      instructionBudgetOverrideSetting: undefined,
      clubs: [{ id: "club-1", name: "Alpha", active: true }],
      clubDuesPeriods: [
        { id: "dues-1", clubId: "club-1", effectiveFrom: "2026-01-01", monthlyDues: 100 },
      ],
      planes: [{ id: "plane-1", clubId: "club-1", name: "C172", active: true }],
      planeRatePeriods: [
        {
          id: "rate-1",
          planeId: "plane-1",
          effectiveFrom: "2026-01-01",
          billingTimeType: "tach",
          hourlyRate: 160,
        },
      ],
      entries: [
        {
          id: "flight-1",
          kind: "flight",
          date: "2025-02-10",
          clubId: "club-1",
          planeId: "plane-1",
          purpose: "training",
          flightTime: 1.5,
          billedTime: 1.3,
          billingTimeTypeUsed: "tach",
          hourlyRateUsed: 160,
          aircraftCost: 208,
          instructorCost: 300,
        },
        {
          id: "flight-2",
          kind: "flight",
          date: "2026-02-10",
          clubId: "club-1",
          planeId: "plane-1",
          purpose: "training",
          flightTime: 1.5,
          billedTime: 1.3,
          billingTimeTypeUsed: "tach",
          hourlyRateUsed: 160,
          aircraftCost: 208,
          instructorCost: 75,
        },
      ],
      loading: false,
      updateAnnualBudget,
      updateInstructionBudgetOverride,
      clearInstructionBudgetOverride,
    });

    render(<BudgetPage />);

    expect(screen.getByRole("heading", { name: /Flying Plan/i })).toBeInTheDocument();
    expect(screen.getByText("Budget split")).toBeInTheDocument();
    expect(screen.getByText("Instruction budget progress")).toBeInTheDocument();
    expect(screen.getByText("Flying budget progress")).toBeInTheDocument();
    expect(screen.getByText("Projected flights")).toBeInTheDocument();
    expect(screen.getByText("Flight progress")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit budget" }));
    fireEvent.change(screen.getByLabelText("Annual budget"), {
      target: { value: "6200" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(updateAnnualBudget).toHaveBeenCalledWith(6200);

    fireEvent.click(screen.getByRole("button", { name: "Customize CFI" }));
    fireEvent.change(screen.getByLabelText("Annual instruction budget"), {
      target: { value: "450" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Save" })[1]!);

    expect(updateInstructionBudgetOverride).toHaveBeenCalledWith(450);

    fireEvent.click(screen.getByText("How was projected flights calculated?"));
    expect(screen.getByText(/reserved for instruction/i)).toBeInTheDocument();
  });

  it("keeps the annual budget editor closed after loading saved data on refresh", async () => {
    const updateAnnualBudget = vi.fn().mockResolvedValue(undefined);
    const updateInstructionBudgetOverride = vi.fn().mockResolvedValue(undefined);
    const clearInstructionBudgetOverride = vi.fn().mockResolvedValue(undefined);
    let currentAppData: ReturnType<typeof mockUseAppData> = {
      budgetSetting: undefined,
      instructionBudgetOverrideSetting: undefined,
      clubs: [],
      clubDuesPeriods: [],
      planes: [],
      planeRatePeriods: [],
      entries: [],
      loading: true,
      updateAnnualBudget,
      updateInstructionBudgetOverride,
      clearInstructionBudgetOverride,
    };

    mockUseAppData.mockImplementation(() => currentAppData);

    const { rerender } = render(<BudgetPage />);
    currentAppData = {
      budgetSetting: { key: "annualBudget", amount: 5000 },
      instructionBudgetOverrideSetting: undefined,
      clubs: [{ id: "club-1", name: "Alpha", active: true }],
      clubDuesPeriods: [
        { id: "dues-1", clubId: "club-1", effectiveFrom: "2026-01-01", monthlyDues: 100 },
      ],
      planes: [{ id: "plane-1", clubId: "club-1", name: "C172", active: true }],
      planeRatePeriods: [
        {
          id: "rate-1",
          planeId: "plane-1",
          effectiveFrom: "2026-01-01",
          billingTimeType: "tach",
          hourlyRate: 160,
        },
      ],
      entries: [],
      loading: false,
      updateAnnualBudget,
      updateInstructionBudgetOverride,
      clearInstructionBudgetOverride,
    };
    rerender(<BudgetPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit budget" })).toBeInTheDocument();
    });

    expect(screen.queryByLabelText("Annual budget")).not.toBeInTheDocument();
  });
});
