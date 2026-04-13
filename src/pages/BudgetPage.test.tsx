import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BudgetPage } from "./BudgetPage";

const mockUseAppData = vi.fn();

vi.mock("../app/providers", () => ({
  useAppData: () => mockUseAppData(),
}));

describe("BudgetPage", () => {
  it("renders the final budget page, saves a budget, and expands details", async () => {
    const updateAnnualBudget = vi.fn().mockResolvedValue(undefined);

    mockUseAppData.mockReturnValue({
      budgetSetting: { key: "annualBudget", amount: 5000 },
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
          date: "2026-02-10",
          clubId: "club-1",
          planeId: "plane-1",
          purpose: "hobby",
          flightTime: 1.5,
          billedTime: 1.3,
          billingTimeTypeUsed: "tach",
          hourlyRateUsed: 160,
          aircraftCost: 208,
        },
      ],
      loading: false,
      updateAnnualBudget,
    });

    render(<BudgetPage />);

    expect(screen.getByRole("heading", { name: /Flying Plan/i })).toBeInTheDocument();
    expect(screen.getByText("Cheapest plane snapshot")).toBeInTheDocument();
    expect(screen.getByText("Projected flights")).toBeInTheDocument();
    expect(screen.getByText("Flight progress")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit budget" }));
    fireEvent.change(screen.getByLabelText("Annual budget"), {
      target: { value: "6200" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(updateAnnualBudget).toHaveBeenCalledWith(6200);

    fireEvent.click(screen.getByText("How was projected flights calculated?"));
    expect(screen.getByText(/Started with/)).toBeInTheDocument();
  });
});
