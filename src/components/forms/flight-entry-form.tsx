import { useEffect, useMemo, useState } from "react";

import type { Club, Plane, PlaneRatePeriod } from "../../domain/clubs/club-types";
import { getApplicablePlaneRate } from "../../domain/clubs/club-rules";
import { flightPurposeLabel } from "../../domain/entries/entry-display";
import type {
  FlightEntry,
  FlightEntryInput,
  FlightPurpose,
} from "../../domain/entries/entry-types";

interface FlightEntryFormProps {
  clubs: Club[];
  planes: Plane[];
  planeRatePeriods: PlaneRatePeriod[];
  onSubmit: (input: FlightEntryInput) => Promise<void>;
  initialValue?: FlightEntry;
  submitLabel?: string;
}

const purposeOptions: { value: FlightPurpose; label: string }[] = (
  Object.entries(flightPurposeLabel) as [FlightPurpose, string][]
).map(([value, label]) => ({ value, label }));

const today = new Date().toISOString().slice(0, 10);
const rememberedClubKey = "hobbstab:last-club-id";
const rememberedPlaneKey = "hobbstab:last-plane-id";
const rememberedNoneClubValue = "__none__";

const getStoredSelection = (key: string) => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(key) ?? "";
};

export const FlightEntryForm = ({
  clubs,
  planes,
  planeRatePeriods,
  onSubmit,
  initialValue,
  submitLabel = "Save flight",
}: FlightEntryFormProps) => {
  const isEditing = Boolean(initialValue);
  const orderedClubs = useMemo(
    () => [...clubs].sort((left, right) => left.name.localeCompare(right.name)),
    [clubs],
  );
  const [date, setDate] = useState(initialValue?.date ?? today);
  const [clubId, setClubId] = useState(initialValue?.clubId ?? "");
  const [planeId, setPlaneId] = useState(
    initialValue?.planeId ?? getStoredSelection(rememberedPlaneKey),
  );
  const [purpose, setPurpose] = useState<FlightPurpose>(initialValue?.purpose ?? "hobby");
  const [flightTime, setFlightTime] = useState(initialValue?.flightTime?.toString() ?? "");
  const [billedTime, setBilledTime] = useState(initialValue?.billedTime?.toString() ?? "");
  const [nonClubHourlyRate, setNonClubHourlyRate] = useState(
    initialValue && !initialValue.clubId ? initialValue.hourlyRateUsed.toString() : "",
  );
  const [instructorCost, setInstructorCost] = useState(
    initialValue?.instructorCost?.toString() ?? "",
  );
  const [notes, setNotes] = useState(initialValue?.notes ?? "");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [billedTimeTouched, setBilledTimeTouched] = useState(Boolean(initialValue));

  const clubPlanes = useMemo(
    () => planes.filter((plane) => plane.clubId === clubId),
    [planes, clubId],
  );

  const applicableRate = useMemo(
    () => (planeId ? getApplicablePlaneRate(planeRatePeriods, planeId, date) : undefined),
    [planeId, date, planeRatePeriods],
  );

  const billedTimeType = applicableRate?.billingTimeType ?? "hobbs";
  const requiresInstructor = purpose === "training" || purpose === "checkFlight";
  const billedTimeLabel = billedTimeType === "tach" ? "Billed Tach Time" : "Billed Hobbs Time";

  useEffect(() => {
    if (isEditing || initialValue) {
      return;
    }

    const rememberedClubId = getStoredSelection(rememberedClubKey);
    const rememberedClubStillExists = orderedClubs.some((club) => club.id === rememberedClubId);

    if (rememberedClubId === rememberedNoneClubValue) {
      setClubId("");
      return;
    }

    if (rememberedClubStillExists) {
      setClubId(rememberedClubId);
      return;
    }

    setClubId(orderedClubs[0]?.id ?? "");
  }, [initialValue, isEditing, orderedClubs]);

  useEffect(() => {
    if (!clubId) {
      setPlaneId("");
      return;
    }

    if (clubPlanes.some((plane) => plane.id === planeId)) {
      return;
    }

    const rememberedPlaneId = getStoredSelection(rememberedPlaneKey);
    const nextPlane =
      clubPlanes.find((plane) => plane.id === rememberedPlaneId) ??
      (clubPlanes.length === 1 ? clubPlanes[0] : undefined);

    setPlaneId(nextPlane?.id ?? "");
  }, [clubId, clubPlanes, planeId]);

  useEffect(() => {
    if (billedTimeType === "hobbs" && !billedTimeTouched) {
      setBilledTime(flightTime);
    }
  }, [billedTimeType, billedTimeTouched, flightTime]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);

    try {
      setSaving(true);
      await onSubmit({
        date,
        clubId: clubId || null,
        planeId: clubId ? planeId || null : null,
        purpose,
        flightTime: Number(flightTime),
        billedTime: Number(billedTime || flightTime),
        nonClubHourlyRate: clubId ? undefined : Number(nonClubHourlyRate),
        instructorCost: requiresInstructor && instructorCost ? Number(instructorCost) : undefined,
        notes,
      });

      if (!isEditing && typeof window !== "undefined") {
        window.localStorage.setItem(
          rememberedClubKey,
          clubId || rememberedNoneClubValue,
        );
        if (clubId && planeId) {
          window.localStorage.setItem(rememberedPlaneKey, planeId);
        } else {
          window.localStorage.removeItem(rememberedPlaneKey);
        }
      }

      if (!initialValue) {
        setPurpose("hobby");
        setFlightTime("");
        setBilledTime("");
        setBilledTimeTouched(false);
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
            {orderedClubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
            <option value="">None / not club billed</option>
          </select>
        </label>
        {clubId ? (
          <label>
            Plane
            <select value={planeId} onChange={(event) => setPlaneId(event.target.value)} required={Boolean(clubId)}>
              <option value="">Select a plane</option>
              {clubPlanes.map((plane) => (
                <option key={plane.id} value={plane.id}>
                  {plane.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
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
          Flight Time
          <input
            type="number"
            min="0"
            step="0.01"
            value={flightTime}
            onChange={(event) => setFlightTime(event.target.value)}
            required
          />
        </label>
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

      {clubId && clubPlanes.length === 0 ? (
        <div className="inline-note warning-note">
          This club has no planes yet. Add a plane in Clubs before logging a club flight.
        </div>
      ) : applicableRate ? (
        <div className="inline-note">
          This club&apos;s plane bills by {applicableRate.billingTimeType} at $
          {applicableRate.hourlyRate}/hr effective {applicableRate.effectiveFrom}
        </div>
      ) : clubId && planeId ? (
        <div className="inline-note warning-note">
          This plane has no rate period effective on the selected date yet.
        </div>
      ) : null}

      <div className="single-field-row">
        <label>
          {billedTimeLabel}
          <input
            type="number"
            min="0"
            step="0.01"
            value={billedTime}
            onChange={(event) => {
              setBilledTime(event.target.value);
              setBilledTimeTouched(true);
            }}
            required
          />
        </label>
      </div>

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
