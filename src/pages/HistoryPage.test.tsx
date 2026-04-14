import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HistoryPage } from "./HistoryPage";

const mockUseAppData = vi.fn();

vi.mock("../app/providers", () => ({
  useAppData: () => mockUseAppData(),
}));

describe("HistoryPage", () => {
  beforeEach(() => {
    cleanup();
    mockUseAppData.mockReset();
  });

  const buildMockAppData = () => ({
    historyRows: [
      {
        id: "flight-1",
        kind: "flight" as const,
        date: "2026-04-10",
        clubId: "club-1",
        planeId: "plane-1",
        purpose: "training" as const,
        flightTime: 1.2,
        billedTime: 1.2,
        billingTimeTypeUsed: "hobbs" as const,
        hourlyRateUsed: 150,
        aircraftCost: 180,
        instructorCost: 40,
        notes: "Pattern work",
      },
      {
        id: "flight-2",
        kind: "flight" as const,
        date: "2026-04-09",
        clubId: null,
        planeId: null,
        purpose: "hobby" as const,
        flightTime: 1.5,
        billedTime: 1.5,
        billingTimeTypeUsed: "hobbs" as const,
        hourlyRateUsed: 160,
        aircraftCost: 240,
        notes: "Sunset hop",
      },
      {
        id: "expense-1",
        kind: "expense" as const,
        date: "2026-04-08",
        description: "Headset bag",
        amount: 45,
        note: "Accessories",
      },
      {
        id: "due-1",
        kind: "syntheticDue" as const,
        clubId: "club-1",
        clubName: "Alpha",
        monthKey: "2026-04",
        date: "2026-04-01",
        monthlyDues: 220,
        duesPeriodId: "dues-1",
      },
    ],
    loading: false,
    planes: [{ id: "plane-1", clubId: "club-1", name: "C172", active: true }],
    removeEntry: vi.fn().mockResolvedValue(undefined),
  });

  it("keeps filters tucked away until the header button is pressed", () => {
    mockUseAppData.mockReturnValue(buildMockAppData());

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "History" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "History filters" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));

    expect(screen.getByRole("dialog", { name: "History filters" })).toBeInTheDocument();
    expect(screen.getByLabelText("Entry type")).toBeInTheDocument();
    expect(screen.getByLabelText("Cost")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Flight - Fun / hobby" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Flight - Flight training" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Flight - Check flight" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Club dues" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Other expenses" })).toBeInTheDocument();
    expect(screen.getByText(/Club flight/)).toBeInTheDocument();
    expect(screen.getByText(/Non-club flight/)).toBeInTheDocument();
    expect(screen.getByText("Headset bag")).toBeInTheDocument();
    expect(screen.getByText("Monthly dues - Alpha")).toBeInTheDocument();
  });

  it("filters the list by entry type for flights", () => {
    mockUseAppData.mockReturnValue(buildMockAppData());

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.change(screen.getByLabelText("Entry type"), {
      target: { value: "flight:training" },
    });

    expect(screen.getByText(/Club flight/)).toBeInTheDocument();
    expect(screen.queryByText(/Non-club flight/)).not.toBeInTheDocument();
    expect(screen.queryByText("Headset bag")).not.toBeInTheDocument();
    expect(screen.queryByText("Monthly dues - Alpha")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter, 1 active" })).toBeInTheDocument();
  });

  it("filters the list by entry type for dues and other expenses", () => {
    mockUseAppData.mockReturnValue(buildMockAppData());

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.change(screen.getByLabelText("Entry type"), {
      target: { value: "syntheticDue" },
    });

    expect(screen.getByText("Monthly dues - Alpha")).toBeInTheDocument();
    expect(screen.queryByText(/Club flight/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Non-club flight/)).not.toBeInTheDocument();
    expect(screen.queryByText("Headset bag")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Entry type"), {
      target: { value: "expense" },
    });

    expect(screen.getByText("Headset bag")).toBeInTheDocument();
    expect(screen.queryByText("Monthly dues - Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText(/Club flight/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Non-club flight/)).not.toBeInTheDocument();
  });

  it("filters the list by cost threshold in both directions", () => {
    mockUseAppData.mockReturnValue(buildMockAppData());

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "225" },
    });

    expect(screen.getByText(/Non-club flight/)).toBeInTheDocument();
    expect(screen.queryByText(/Club flight/)).not.toBeInTheDocument();
    expect(screen.queryByText("Headset bag")).not.toBeInTheDocument();
    expect(screen.queryByText("Monthly dues - Alpha")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Cost"), {
      target: { value: "lessThan" },
    });

    expect(screen.getByText(/Club flight/)).toBeInTheDocument();
    expect(screen.getByText("Headset bag")).toBeInTheDocument();
    expect(screen.queryByText(/Non-club flight/)).not.toBeInTheDocument();
    expect(screen.getByText("Monthly dues - Alpha")).toBeInTheDocument();
  });

  it("keeps the filter button marked when filters stay active after closing the panel", () => {
    mockUseAppData.mockReturnValue(buildMockAppData());

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "225" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filter, 1 active" }));

    expect(screen.queryByRole("dialog", { name: "History filters" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter, 1 active" })).toBeInTheDocument();
    expect(screen.getByText(/Non-club flight/)).toBeInTheDocument();
    expect(screen.queryByText(/Club flight/)).not.toBeInTheDocument();
  });

  it("resets filters from the popup action", () => {
    mockUseAppData.mockReturnValue(buildMockAppData());

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.change(screen.getByLabelText("Entry type"), {
      target: { value: "expense" },
    });
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "100" },
    });

    expect(screen.queryByText("Monthly dues - Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText(/Club flight/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Non-club flight/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(screen.getByLabelText("Entry type")).toHaveValue("");
    expect(screen.getByLabelText("Cost")).toHaveValue("greaterThan");
    expect(screen.getByLabelText("Amount")).toHaveValue(null);
    expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();
    expect(screen.getByText("Monthly dues - Alpha")).toBeInTheDocument();
    expect(screen.getByText(/Club flight/)).toBeInTheDocument();
    expect(screen.getByText(/Non-club flight/)).toBeInTheDocument();
    expect(screen.getByText("Headset bag")).toBeInTheDocument();
  });
});
