import { useState } from "react";

import type { BillingTimeType, PlaneRatePeriod } from "../../domain/clubs/club-types";

interface PlaneRatePeriodFormProps {
  planeId: string;
  initialValue?: PlaneRatePeriod;
  onSubmit: (period: Omit<PlaneRatePeriod, "id"> | PlaneRatePeriod) => Promise<void>;
  submitLabel?: string;
}

const today = new Date().toISOString().slice(0, 10);

export const PlaneRatePeriodForm = ({
  planeId,
  initialValue,
  onSubmit,
  submitLabel = "Save plane rate",
}: PlaneRatePeriodFormProps) => {
  const [effectiveFrom, setEffectiveFrom] = useState(initialValue?.effectiveFrom ?? today);
  const [billingTimeType, setBillingTimeType] = useState<BillingTimeType>(
    initialValue?.billingTimeType ?? "hobbs",
  );
  const [hourlyRate, setHourlyRate] = useState(initialValue?.hourlyRate?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        planeId,
        effectiveFrom,
        billingTimeType,
        hourlyRate: Number(hourlyRate),
      };

      await onSubmit(initialValue ? { ...initialValue, ...payload } : payload);

      if (!initialValue) {
        setHourlyRate("");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      <div className="field-grid">
        <label>
          Effective from
          <input
            type="date"
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
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
      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
};
