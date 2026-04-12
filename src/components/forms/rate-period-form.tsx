import { useState } from "react";

import type { BillingTimeType, ClubRatePeriod } from "../../domain/clubs/club-types";

interface RatePeriodFormProps {
  clubId: string;
  initialValue?: ClubRatePeriod;
  onSubmit: (ratePeriod: Omit<ClubRatePeriod, "id"> | ClubRatePeriod) => Promise<void>;
  submitLabel?: string;
}

const today = new Date().toISOString().slice(0, 10);

export const RatePeriodForm = ({
  clubId,
  initialValue,
  onSubmit,
  submitLabel = "Save rate period",
}: RatePeriodFormProps) => {
  const [effectiveFrom, setEffectiveFrom] = useState(initialValue?.effectiveFrom ?? today);
  const [billingTimeType, setBillingTimeType] = useState<BillingTimeType>(
    initialValue?.billingTimeType ?? "hobbs",
  );
  const [hourlyRate, setHourlyRate] = useState(initialValue?.hourlyRate?.toString() ?? "");
  const [monthlyDues, setMonthlyDues] = useState(initialValue?.monthlyDues?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        clubId,
        effectiveFrom,
        billingTimeType,
        hourlyRate: Number(hourlyRate),
        monthlyDues: Number(monthlyDues),
      };
      await onSubmit(initialValue ? { ...initialValue, ...payload } : payload);

      if (!initialValue) {
        setHourlyRate("");
        setMonthlyDues("");
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
      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
};
