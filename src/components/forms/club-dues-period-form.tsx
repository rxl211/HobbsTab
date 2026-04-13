import { useState } from "react";

import type { ClubDuesPeriod } from "../../domain/clubs/club-types";

interface ClubDuesPeriodFormProps {
  clubId: string;
  initialValue?: ClubDuesPeriod;
  onSubmit: (period: Omit<ClubDuesPeriod, "id"> | ClubDuesPeriod) => Promise<void>;
  submitLabel?: string;
}

const today = new Date().toISOString().slice(0, 10);

export const ClubDuesPeriodForm = ({
  clubId,
  initialValue,
  onSubmit,
  submitLabel = "Save dues period",
}: ClubDuesPeriodFormProps) => {
  const [effectiveFrom, setEffectiveFrom] = useState(initialValue?.effectiveFrom ?? today);
  const [monthlyDues, setMonthlyDues] = useState(initialValue?.monthlyDues?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        clubId,
        effectiveFrom,
        monthlyDues: Number(monthlyDues),
      };

      await onSubmit(initialValue ? { ...initialValue, ...payload } : payload);

      if (!initialValue) {
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
