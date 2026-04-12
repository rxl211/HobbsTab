import { useMemo, useState } from "react";

import type { Club, ClubRatePeriod } from "../../domain/clubs/club-types";
import { getApplicableClubRate } from "../../domain/clubs/club-rules";
import { flightPurposeLabel } from "../../domain/entries/entry-display";
import type {
  FlightEntry,
  FlightEntryInput,
  FlightPurpose,
} from "../../domain/entries/entry-types";

interface FlightEntryFormProps {
  clubs: Club[];
  ratePeriods: ClubRatePeriod[];
  onSubmit: (input: FlightEntryInput) => Promise<void>;
  initialValue?: FlightEntry;
  submitLabel?: string;
}

const purposeOptions: { value: FlightPurpose; label: string }[] = (
  Object.entries(flightPurposeLabel) as [FlightPurpose, string][]
).map(([value, label]) => ({ value, label }));

const today = new Date().toISOString().slice(0, 10);

export const FlightEntryForm = ({
  clubs,
  ratePeriods,
  onSubmit,
  initialValue,
  submitLabel = "Save flight",
}: FlightEntryFormProps) => {
  const [date, setDate] = useState(initialValue?.date ?? today);
  const [clubId, setClubId] = useState(initialValue?.clubId ?? "");
  const [purpose, setPurpose] = useState<FlightPurpose>(initialValue?.purpose ?? "hobby");
  const [hobbsTime, setHobbsTime] = useState(initialValue?.hobbsTime?.toString() ?? "");
  const [tachTime, setTachTime] = useState(initialValue?.tachTime?.toString() ?? "");
  const [nonClubHourlyRate, setNonClubHourlyRate] = useState(
    initialValue && !initialValue.clubId ? initialValue.hourlyRateUsed.toString() : "",
  );
  const [instructorCost, setInstructorCost] = useState(
    initialValue?.instructorCost?.toString() ?? "",
  );
  const [notes, setNotes] = useState(initialValue?.notes ?? "");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const applicableRate = useMemo(
    () => (clubId ? getApplicableClubRate(ratePeriods, clubId, date) : undefined),
    [clubId, date, ratePeriods],
  );

  const requiresTach = applicableRate?.billingTimeType === "tach";
  const requiresInstructor = purpose === "training" || purpose === "checkFlight";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);

    try {
      setSaving(true);
      await onSubmit({
        date,
        clubId: clubId || null,
        purpose,
        hobbsTime: Number(hobbsTime),
        tachTime: requiresTach ? Number(tachTime) : undefined,
        nonClubHourlyRate: clubId ? undefined : Number(nonClubHourlyRate),
        instructorCost: requiresInstructor && instructorCost ? Number(instructorCost) : undefined,
        notes,
      });

      if (!initialValue) {
        setPurpose("hobby");
        setHobbsTime("");
        setTachTime("");
        setNonClubHourlyRate("");
        setInstructorCost("");
        setNotes("");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to save flight entry.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      <div className="field-grid">
        <label>
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </label>
        <label>
          Club
          <select value={clubId} onChange={(event) => setClubId(event.target.value)}>
            <option value="">None / not club billed</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Purpose
          <select value={purpose} onChange={(event) => setPurpose(event.target.value as FlightPurpose)}>
            {purposeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hobbs time
          <input
            type="number"
            min="0"
            step="0.01"
            value={hobbsTime}
            onChange={(event) => setHobbsTime(event.target.value)}
            required
          />
        </label>
        {requiresTach ? (
          <label>
            Tach time
            <input
              type="number"
              min="0"
              step="0.01"
              value={tachTime}
              onChange={(event) => setTachTime(event.target.value)}
              required
            />
          </label>
        ) : null}
        {!clubId ? (
          <label>
            Hourly rate
            <input
              type="number"
              min="0"
              step="0.01"
              value={nonClubHourlyRate}
              onChange={(event) => setNonClubHourlyRate(event.target.value)}
              required
            />
          </label>
        ) : null}
        {requiresInstructor ? (
          <label>
            <span className="field-label-with-help">
              Instructor cost
              <span className="info-tooltip">
                <button
                  type="button"
                  className="info-pill"
                  aria-label="More information about instructor cost"
                >
                  i
                </button>
                <span className="info-tooltip-bubble" role="tooltip">
                  Enter total paid to CFI
                </span>
              </span>
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={instructorCost}
              onChange={(event) => setInstructorCost(event.target.value)}
            />
          </label>
        ) : null}
      </div>

      {applicableRate ? (
        <div className="inline-note">
          Uses {applicableRate.billingTimeType} billing at ${applicableRate.hourlyRate}/hr
          from {applicableRate.effectiveFrom}.
        </div>
      ) : clubId ? (
        <div className="inline-note warning-note">
          This club has no rate period effective on the selected date yet.
        </div>
      ) : null}

      <label>
        Notes
        <textarea
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional notes"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
};
