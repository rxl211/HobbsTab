import { useRef, useState } from "react";

import { useAppData } from "../../app/providers";

export const BackupCard = () => {
  const { exportBackupData, importBackupData } = useAppData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const backup = await exportBackupData();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hobbstab-backup-${backup.exportedAt.slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Backup exported.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to export backup.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!window.confirm("Importing will replace your current local data. Continue?")) {
      event.target.value = "";
      return;
    }

    setBusy(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      await importBackupData(parsed);
      setMessage("Backup imported.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to import backup.",
      );
    } finally {
      event.target.value = "";
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Import / Export</h2>
          <p className="subtle">Download a JSON backup or restore one into this browser.</p>
        </div>
      </div>
      <div className="backup-actions">
        <button type="button" className="secondary-button" onClick={() => void handleExport()} disabled={busy}>
          Export JSON
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden-input"
          onChange={(event) => {
            void handleImport(event);
          }}
        />
      </div>
      <p className="subtle">Import replaces the current local data in this browser.</p>
      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
};
