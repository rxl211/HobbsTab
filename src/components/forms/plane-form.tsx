import { useState } from "react";

import type { Plane } from "../../domain/clubs/club-types";

interface PlaneFormProps {
  activeLabel?: string;
  clubId: string;
  fieldLabel?: string;
  initialValue?: Plane;
  onSubmit: (plane: Omit<Plane, "id"> | Plane) => Promise<void>;
  submitLabel?: string;
}

export const PlaneForm = ({
  activeLabel = "Active plane",
  clubId,
  fieldLabel = "Plane name",
  initialValue,
  onSubmit,
  submitLabel = "Save plane",
}: PlaneFormProps) => {
  const [name, setName] = useState(initialValue?.name ?? "");
  const [active, setActive] = useState(initialValue?.active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(
        initialValue
          ? { ...initialValue, clubId, name, active }
          : { clubId, name, active },
      );

      if (!initialValue) {
        setName("");
        setActive(true);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      <div className="field-grid">
        <label>
          <span className="field-label-with-help">
            {fieldLabel}
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
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="checkbox-field">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
          {activeLabel}
        </label>
      </div>
      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
};
