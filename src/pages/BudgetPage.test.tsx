import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
      instructionBudgetOverrideSetting: { key: "instructionBudget", amount: 100 },
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
          instructorCost: 187.5,
        },
        {
          id: "expense-1",
          kind: "expense",
          date: "2026-03-05",
          description: "Supplies",
          amount: 50,
        },
      ],
      loading: false,
      updateAnnualBudget,
      updateInstructionBudgetOverride,
      clearInstructionBudgetOverride,
    });

    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /Flying Plan/i })).toBeInTheDocument();
    expect(screen.getByText("Budget split")).toBeInTheDocument();
    expect(screen.getByText("Instruction budget progress")).toBeInTheDocument();
    expect(screen.getByText("Flying budget progress")).toBeInTheDocument();
    expect(screen.getByText("Used so far")).toBeInTheDocument();
    expect(screen.getByText("$345.50")).toBeInTheDocument();
    expect(screen.getByText("$3,354.50")).toBeInTheDocument();
    expect(screen.getByText("Projected flights")).toBeInTheDocument();
    expect(screen.getByText("Flight progress")).toBeInTheDocument();
    expect(screen.getByText(/Your budget supports about/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Use the breakdown below to see how dues, instruction, current aircraft rates, and your past flights shape that forecast\./i,
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit budget" }));
    fireEvent.change(screen.getByLabelText("Annual budget"), {
      target: { value: "6200" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(updateAnnualBudget).toHaveBeenCalledWith(6200);

    fireEvent.click(screen.getByRole("button", { name: "Edit CFI" }));
    fireEvent.change(screen.getByLabelText("Annual instruction budget"), {
      target: { value: "450" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Save" })[1]!);

    expect(updateInstructionBudgetOverride).toHaveBeenCalledWith(450);

    fireEvent.click(screen.getByText("How was projected flights calculated?"));
    expect(screen.getByText(/reserved for instruction/i)).toBeInTheDocument();
    expect(screen.getByText(/That leaves \$3,700\.00 in annual flying budget/i)).toBeInTheDocument();
    expect(screen.queryByText(/already spent on airplane time this year/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /including flights, other expenses, and CFI payments beyond what was budgeted for CFI/i,
      ),
    ).toBeInTheDocument();
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
      expect(screen.getAllByRole("button", { name: "Edit budget" })[0]).toBeInTheDocument();
    });

    expect(screen.queryByLabelText("Annual budget")).not.toBeInTheDocument();
  });

  it("shows a hero fallback when projected flights are waiting on a plane rate", () => {
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
      planeRatePeriods: [],
      entries: [],
      loading: false,
      updateAnnualBudget,
      updateInstructionBudgetOverride,
      clearInstructionBudgetOverride,
    });

    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Flight projections unlock once you add a club and plane rate."),
    ).toBeInTheDocument();
    expect(screen.getByText(/available for airplane time once a current rate is in place/i)).toBeInTheDocument();
    const heroMission = screen.getByText(
      "Flight projections unlock once you add a club and plane rate.",
    ).closest(".budget-hero-mission");

    expect(heroMission).not.toBeNull();
    expect(within(heroMission as HTMLElement).getByRole("link", { name: "Create Club" })).toHaveAttribute(
      "href",
      "/clubs",
    );
  });

  it("uses simpler flying budget copy when there is no instruction overspend", () => {
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
        {
          id: "expense-1",
          kind: "expense",
          date: "2026-03-05",
          description: "Supplies",
          amount: 50,
        },
      ],
      loading: false,
      updateAnnualBudget,
      updateInstructionBudgetOverride,
      clearInstructionBudgetOverride,
    });

    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/including flights and other expenses\./i).length).toBeGreaterThan(0);
  });
});
