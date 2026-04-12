import { Navigate, useNavigate, useParams } from "react-router-dom";

import { useAppData } from "../app/providers";
import { ExpenseEntryForm } from "../components/forms/expense-entry-form";
import { FlightEntryForm } from "../components/forms/flight-entry-form";

export const EditEntryPage = () => {
  const navigate = useNavigate();
  const { entryId = "" } = useParams();
  const {
    clubs,
    clubRatePeriods,
    entries,
    updateExpenseEntry,
    updateFlightEntry,
  } = useAppData();

  const entry = entries.find((candidate) => candidate.id === entryId);

  if (!entry) {
    return <Navigate to="/history" replace />;
  }

  return (
    <div className="page-stack">
      <section className="card">
        <div className="section-heading">
          <h2>Edit entry</h2>
          <p className="subtle">Stored entries are editable; derived dues stay read-only.</p>
        </div>
        {entry.kind === "flight" ? (
          <FlightEntryForm
            clubs={clubs}
            ratePeriods={clubRatePeriods}
            initialValue={entry}
            submitLabel="Update flight"
            onSubmit={async (input) => {
              await updateFlightEntry(entry.id, input);
              await navigate("/history");
            }}
          />
        ) : (
          <ExpenseEntryForm
            initialValue={entry}
            submitLabel="Update expense"
            onSubmit={async (input) => {
              await updateExpenseEntry(entry.id, input);
              await navigate("/history");
            }}
          />
        )}
      </section>
    </div>
  );
};
