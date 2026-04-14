import { useMemo, useState } from "react";

import { useAppData } from "../app/providers";
import { HistoryList } from "../components/common/history-list";
import { flightPurposeLabel } from "../domain/entries/entry-display";
import type { FlightPurpose } from "../domain/entries/entry-types";
import { entryTotal } from "../domain/entries/entry-rules";
import type { HistoryRow } from "../domain/summaries/summary-types";

type CostFilterMode = "greaterThan" | "lessThan";
type EntryTypeFilter =
  | ""
  | "flight:hobby"
  | "flight:training"
  | "flight:checkFlight"
  | "syntheticDue"
  | "expense";

const entryTypeOptions: { value: EntryTypeFilter; label: string }[] = [
  { value: "", label: "All entries" },
  { value: "flight:hobby", label: `Flight - ${flightPurposeLabel.hobby}` },
  { value: "flight:training", label: `Flight - ${flightPurposeLabel.training}` },
  { value: "flight:checkFlight", label: `Flight - ${flightPurposeLabel.checkFlight}` },
  { value: "syntheticDue", label: "Club dues" },
  { value: "expense", label: "Other expenses" },
];

const getHistoryRowCost = (row: HistoryRow) =>
  row.kind === "syntheticDue" ? row.monthlyDues : entryTotal(row);

export const HistoryPage = () => {
  const { historyRows, loading, planes, removeEntry } = useAppData();
  const [showFilters, setShowFilters] = useState(false);
  const [entryType, setEntryType] = useState<EntryTypeFilter>("");
  const [costFilterMode, setCostFilterMode] = useState<CostFilterMode>("greaterThan");
  const [costFilterValue, setCostFilterValue] = useState("");
  const activeFilterCount =
    (entryType ? 1 : 0) + (costFilterValue.trim() !== "" ? 1 : 0);

  const resetFilters = () => {
    setEntryType("");
    setCostFilterMode("greaterThan");
    setCostFilterValue("");
  };

  const filteredRows = useMemo(() => {
    const parsedCostFilter = Number(costFilterValue);
    const hasCostFilter = costFilterValue.trim() !== "" && Number.isFinite(parsedCostFilter);

    return historyRows.filter((row) => {
      if (entryType) {
        if (entryType === "syntheticDue" && row.kind !== "syntheticDue") {
          return false;
        }

        if (entryType === "expense" && row.kind !== "expense") {
          return false;
        }

        if (entryType.startsWith("flight:")) {
          const purpose = entryType.slice("flight:".length) as FlightPurpose;

          if (row.kind !== "flight" || row.purpose !== purpose) {
            return false;
          }
        }
      }

      if (!hasCostFilter) {
        return true;
      }

      const rowCost = getHistoryRowCost(row);

      return costFilterMode === "greaterThan"
        ? rowCost > parsedCostFilter
        : rowCost < parsedCostFilter;
    });
  }, [costFilterMode, costFilterValue, entryType, historyRows]);

  return (
    <div className="page-stack">
      {loading ? <section className="card">Loading...</section> : null}
      <HistoryList
        rows={filteredRows}
        planes={planes}
        onDeleteEntry={removeEntry}
        headerActions={
          <button
            type="button"
            className={
              activeFilterCount > 0
                ? "secondary-button history-filter-button active"
                : "secondary-button history-filter-button"
            }
            onClick={() => setShowFilters((current) => !current)}
            aria-expanded={showFilters}
            aria-controls="history-filters-panel"
            aria-label={
              activeFilterCount > 0
                ? `Filter, ${activeFilterCount} active`
                : "Filter"
            }
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="history-filter-button-icon"
            >
              <path
                d="M4 6h16M7 12h10M10 18h4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Filter
            {activeFilterCount > 0 ? (
              <span className="history-filter-button-badge">{activeFilterCount}</span>
            ) : null}
          </button>
        }
        topContent={
          showFilters ? (
            <div
              id="history-filters-panel"
              className="history-filter-popover"
              role="dialog"
              aria-label="History filters"
            >
              <div className="history-filter-popover-header">
                <div>
                  <h3>Filters</h3>
                  <p className="subtle">Narrow history by flight type or spend amount.</p>
                </div>
                <button
                  type="button"
                  className="link-button"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>
              <div className="field-grid">
                <label>
                  Entry type
                  <select
                    value={entryType}
                    onChange={(event) => setEntryType(event.target.value as EntryTypeFilter)}
                  >
                    {entryTypeOptions.map((option) => (
                      <option key={option.value || "all"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Cost
                  <select
                    value={costFilterMode}
                    onChange={(event) => setCostFilterMode(event.target.value as CostFilterMode)}
                  >
                    <option value="greaterThan">Greater than</option>
                    <option value="lessThan">Less than</option>
                  </select>
                </label>
                <label>
                  Amount
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costFilterValue}
                    onChange={(event) => setCostFilterValue(event.target.value)}
                    placeholder="Any amount"
                  />
                </label>
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
};
