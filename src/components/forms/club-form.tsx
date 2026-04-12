import { useState } from "react";

import type { Club } from "../../domain/clubs/club-types";

interface ClubFormProps {
  initialValue?: Club;
  onSubmit: (club: Omit<Club, "id"> | Club) => Promise<void>;
  submitLabel?: string;
}

export const ClubForm = ({ initialValue, onSubmit, submitLabel = "Save club" }: ClubFormProps) => {
  const [name, setName] = useState(initialValue?.name ?? "");
  const [active, setActive] = useState(initialValue?.active ?? true);
  const [notes, setNotes] = useState(initialValue?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(
        initialValue
          ? { ...initialValue, name, active, notes: notes.trim() || undefined }
          : { name, active, notes: notes.trim() || undefined },
      );
      if (!initialValue) {
        setName("");
        setActive(true);
        setNotes("");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      <div className="field-grid">
        <label>
          Club name
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          Active club
        </label>
      </div>
      <label>
        Notes
        <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
};
