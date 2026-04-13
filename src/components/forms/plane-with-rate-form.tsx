import { useState } from "react";
import type { ReactNode } from "react";

import type { BillingTimeType, Plane, PlaneRatePeriod } from "../../domain/clubs/club-types";

interface PlaneWithRateFormProps {
  children?: ReactNode;
  hideActiveToggle?: boolean;
  planeLabel?: string;
  sectionTitle?: string;
  submitLabel?: string;
  onSubmit: (input: {
    plane: Omit<Plane, "id" | "clubId">;
    planeRatePeriod: Omit<PlaneRatePeriod, "id" | "planeId">;
  }) => Promise<void>;
}

const today = new Date().toISOString().slice(0, 10);

export const PlaneWithRateForm = ({
  children,
  hideActiveToggle = false,
  planeLabel = "Plane/rate name",
  sectionTitle,
  submitLabel = "Save plane/rate",
  onSubmit,
}: PlaneWithRateFormProps) => {
  const [planeName, setPlaneName] = useState("");
  const [planeActive, setPlaneActive] = useState(true);
  const [rateEffectiveFrom, setRateEffectiveFrom] = useState(today);
  const [billingTimeType, setBillingTimeType] = useState<BillingTimeType>("hobbs");
  const [hourlyRate, setHourlyRate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      await onSubmit({
        plane: {
          name: planeName,
          active: planeActive,
        },
        planeRatePeriod: {
          effectiveFrom: rateEffectiveFrom,
          billingTimeType,
          hourlyRate: Number(hourlyRate),
        },
      });

      setPlaneName("");
      setPlaneActive(true);
      setRateEffectiveFrom(today);
      setBillingTimeType("hobbs");
      setHourlyRate("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      {children}

      <div className="stack-block">
        {sectionTitle ? <h3>{sectionTitle}</h3> : null}
        <div className="field-grid">
          <div className={hideActiveToggle ? "limited-field-row" : undefined}>
            <label>
              <span className="field-label-with-help">
                {planeLabel}
                <span className="info-tooltip">
                  <button
                    type="button"
                    className="info-pill"
                    aria-label="More information about plane naming"
                  >
                    i
                  </button>
                  <span className="info-tooltip-bubble" role="tooltip">
                    Does not need to be an N number. For example, if your club bills all 172s the
                    same then you could just label this plane &quot;172&quot;
                  </span>
                </span>
              </span>
              <input
                type="text"
                value={planeName}
                onChange={(event) => setPlaneName(event.target.value)}
                required
              />
            </label>
          </div>
          {hideActiveToggle ? null : (
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={planeActive}
                onChange={(event) => setPlaneActive(event.target.checked)}
              />
              Active plane/rate
            </label>
          )}
        </div>
      </div>

      <div className="stack-block">
        <div className="field-grid">
          <label>
            Effective from
            <input
              type="date"
              value={rateEffectiveFrom}
              onChange={(event) => setRateEffectiveFrom(event.target.value)}
              required
            />
          </label>
          <label>
            Billing time
            <select
              value={billingTimeType}
              onChange={(event) => setBillingTimeType(event.target.value as BillingTimeType)}
            >
              <option value="hobbs">Hobbs</option>
              <option value="tach">Tach</option>
            </select>
          </label>
          <label>
            Hourly rate
            <input
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(event) => setHourlyRate(event.target.value)}
              required
            />
          </label>
        </div>
      </div>

      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
};
