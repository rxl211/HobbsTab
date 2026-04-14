import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Club, Plane, PlaneRatePeriod } from "../../domain/clubs/club-types";
import { FlightEntryForm } from "./flight-entry-form";

const clubs: Club[] = [{ id: "club-1", name: "Alpha", active: true }];

const planes: Plane[] = [{ id: "plane-1", clubId: "club-1", name: "C172", active: true }];

const planeRatePeriods: PlaneRatePeriod[] = [
  {
    id: "rate-1",
    planeId: "plane-1",
    effectiveFrom: "2026-01-01",
    billingTimeType: "hobbs",
    hourlyRate: 160,
  },
];

describe("FlightEntryForm", () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("shows a zero-dollar spend summary before any flight values are entered", async () => {
    render(
      <FlightEntryForm
        clubs={clubs}
        planes={planes}
        planeRatePeriods={planeRatePeriods}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const preview = await screen.findByRole("region", { name: "Spend preview" });

    expect(preview).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getAllByText("$0.00").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", {
        name: "Save flight",
      }),
    ).toBeInTheDocument();
  });

  it("shows airplane, instructor, and total spend preview for training flights", async () => {
    render(
      <FlightEntryForm
        clubs={clubs}
        planes={planes}
        planeRatePeriods={planeRatePeriods}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Alpha")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Purpose"), {
      target: { value: "training" },
    });
    fireEvent.change(screen.getByLabelText("Flight Time"), {
      target: { value: "1.5" },
    });
    fireEvent.change(screen.getAllByRole("spinbutton")[1]!, {
      target: { value: "75" },
    });

    expect(screen.getByRole("region", { name: "Spend preview" })).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("$315.00")).toBeInTheDocument();
    expect(screen.getByText("Airplane")).toBeInTheDocument();
    expect(screen.getByText("Instructor")).toBeInTheDocument();
    expect(screen.getByText("$240.00")).toBeInTheDocument();
    expect(screen.getByText("$75.00")).toBeInTheDocument();
  });

  it("shows a simpler spend preview for non-club hobby flights", () => {
    render(
      <FlightEntryForm
        clubs={[]}
        planes={[]}
        planeRatePeriods={[]}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    fireEvent.change(screen.getByLabelText("Flight Time"), {
      target: { value: "1.2" },
    });
    fireEvent.change(screen.getByLabelText("Billed Hobbs Time"), {
      target: { value: "1.2" },
    });
    fireEvent.change(screen.getByLabelText("Hourly rate"), {
      target: { value: "150" },
    });

    expect(screen.getByRole("region", { name: "Spend preview" })).toBeInTheDocument();
    expect(screen.getAllByText("$180.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Airplane")).toBeInTheDocument();
    expect(screen.queryByText("Instructor")).not.toBeInTheDocument();
  });
});
