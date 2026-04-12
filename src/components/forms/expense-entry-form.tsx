import { useState } from "react";

import type { ExpenseEntry, ExpenseEntryInput } from "../../domain/entries/entry-types";

interface ExpenseEntryFormProps {
  onSubmit: (input: ExpenseEntryInput) => Promise<void>;
  initialValue?: ExpenseEntry;
  submitLabel?: string;
}

const today = new Date().toISOString().slice(0, 10);

export const ExpenseEntryForm = ({
  onSubmit,
  initialValue,
  submitLabel = "Save expense",
}: ExpenseEntryFormProps) => {
  const [date, setDate] = useState(initialValue?.date ?? today);
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [amount, setAmount] = useState(initialValue?.amount?.toString() ?? "");
  const [note, setNote] = useState(initialValue?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);

    try {
      setSaving(true);
      await onSubmit({
        date,
        description,
        amount: Number(amount),
        note,
      });

      if (!initialValue) {
        setDescription("");
        setAmount("");
        setNote("");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to save expense entry.",
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
          Description
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="MFT, Ground Instruction, etc."
            required
          />
        </label>
        <label>
          Amount
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </label>
      </div>

      <label>
        Note
        <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
};
