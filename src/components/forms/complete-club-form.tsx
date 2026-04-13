import { useState } from "react";

import type { Club, ClubDuesPeriod, Plane, PlaneRatePeriod } from "../../domain/clubs/club-types";
import { PlaneWithRateForm } from "./plane-with-rate-form";

interface CompleteClubFormProps {
  onSubmit: (input: {
    club: Omit<Club, "id">;
    duesPeriod: Omit<ClubDuesPeriod, "id" | "clubId">;
    plane: Omit<Plane, "id" | "clubId">;
    planeRatePeriod: Omit<PlaneRatePeriod, "id" | "planeId">;
  }) => Promise<void>;
  submitLabel?: string;
}

const today = new Date().toISOString().slice(0, 10);

export const CompleteClubForm = ({
  onSubmit,
  submitLabel = "Save club",
}: CompleteClubFormProps) => {
  const [clubName, setClubName] = useState("");
  const [clubActive, setClubActive] = useState(true);
  const [clubNotes, setClubNotes] = useState("");
  const [duesEffectiveFrom, setDuesEffectiveFrom] = useState(today);
  const [monthlyDues, setMonthlyDues] = useState("");

  const handleSubmit = async (input: {
    plane: Omit<Plane, "id" | "clubId">;
    planeRatePeriod: Omit<PlaneRatePeriod, "id" | "planeId">;
  }) => {
    await onSubmit({
      club: {
        name: clubName,
        active: clubActive,
        notes: clubNotes.trim() || undefined,
      },
      duesPeriod: {
        effectiveFrom: duesEffectiveFrom,
        monthlyDues: Number(monthlyDues),
      },
      plane: input.plane,
      planeRatePeriod: input.planeRatePeriod,
    });

    setClubName("");
    setClubActive(true);
    setClubNotes("");
    setDuesEffectiveFrom(today);
    setMonthlyDues("");
  };

  return (
    <PlaneWithRateForm
      hideActiveToggle
      sectionTitle="Initial plane/rate"
      planeLabel="Plane/rate name"
      submitLabel={submitLabel}
      onSubmit={handleSubmit}
    >
      <div className="stack-block">
        <h3>Club details</h3>
        <div className="field-grid">
          <label>
            Club name
            <input
              type="text"
              value={clubName}
              onChange={(event) => setClubName(event.target.value)}
              required
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={clubActive}
              onChange={(event) => setClubActive(event.target.checked)}
            />
            Active club
          </label>
        </div>
        <label>
          Notes
          <textarea rows={3} value={clubNotes} onChange={(event) => setClubNotes(event.target.value)} />
        </label>
      </div>

      <div className="stack-block">
        <h3>Initial dues period</h3>
        <div className="field-grid">
          <label>
            Effective from
            <input
              type="date"
              value={duesEffectiveFrom}
              onChange={(event) => setDuesEffectiveFrom(event.target.value)}
              required
            />
          </label>
          <label>
            Monthly dues
            <input
              type="number"
              min="0"
              step="0.01"
              value={monthlyDues}
              onChange={(event) => setMonthlyDues(event.target.value)}
              required
            />
          </label>
        </div>
      </div>
    </PlaneWithRateForm>
  );
};
