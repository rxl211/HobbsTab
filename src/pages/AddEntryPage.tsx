import { useState } from "react";
import { Link } from "react-router-dom";

import { useAppData } from "../app/providers";
import { ExpenseEntryForm } from "../components/forms/expense-entry-form";
import { FlightEntryForm } from "../components/forms/flight-entry-form";

export const AddEntryPage = () => {
  const { clubs, clubRatePeriods, createExpenseEntry, createFlightEntry } = useAppData();
  const [mode, setMode] = useState<"flight" | "expense">("flight");
  const [successMessage, setSuccessMessage] = useState<string>();
  const activeClubs = clubs.filter((club) => club.active);

  return (
    <div className="page-stack">
      <section className="card">
        <div className="section-heading">
          <h2>Add entry</h2>
          <p className="subtle">Choose the simplest flow and let the app calculate the rest.</p>
        </div>
        <div className="segmented-control">
          <button
            type="button"
            className={mode === "flight" ? "segmented-button active" : "segmented-button"}
            onClick={() => {
              setMode("flight");
              setSuccessMessage(undefined);
            }}
          >
            Flight
          </button>
          <button
            type="button"
            className={mode === "expense" ? "segmented-button active" : "segmented-button"}
            onClick={() => {
              setMode("expense");
              setSuccessMessage(undefined);
            }}
          >
            Expense
          </button>
        </div>
      </section>

      <section className="card">
        {successMessage ? (
          <div className="inline-note success-note">
            {successMessage} <Link to="/history" className="success-link">View History</Link>.
          </div>
        ) : null}
        {mode === "flight" ? (
          <FlightEntryForm
            clubs={activeClubs}
            ratePeriods={clubRatePeriods}
            onSubmit={async (input) => {
              await createFlightEntry(input);
              setSuccessMessage(`Flight saved for ${input.date}.`);
            }}
          />
        ) : (
          <ExpenseEntryForm
            onSubmit={async (input) => {
              await createExpenseEntry(input);
              setSuccessMessage(`Expense saved for ${input.date}.`);
            }}
          />
        )}
      </section>
    </div>
  );
};
