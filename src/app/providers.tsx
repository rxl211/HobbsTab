import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { Club, ClubRatePeriod } from "../domain/clubs/club-types";
import { buildExpenseEntry, buildFlightEntry } from "../domain/entries/entry-rules";
import type {
  EntryRecord,
  ExpenseEntryInput,
  FlightEntryInput,
} from "../domain/entries/entry-types";
import {
  buildHistoryRows,
  buildMonthlySummaries,
  buildSyntheticDues,
} from "../domain/summaries/summary-service";
import { createId } from "../lib/ids";
import {
  deleteClub,
  deleteClubRatePeriod,
  listClubRatePeriods,
  listClubs,
  saveClub,
  saveClubRatePeriod,
} from "../storage/clubs-repo";
import { exportBackup, importBackup, type HobbsTabBackup } from "../storage/backup-repo";
import { deleteEntry, listEntries, saveEntry } from "../storage/entries-repo";

interface AppDataState {
  clubs: Club[];
  clubRatePeriods: ClubRatePeriod[];
  entries: EntryRecord[];
  syntheticDues: ReturnType<typeof buildSyntheticDues>;
  monthlySummaries: ReturnType<typeof buildMonthlySummaries>;
  historyRows: ReturnType<typeof buildHistoryRows>;
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  createClub: (club: Omit<Club, "id">) => Promise<void>;
  updateClub: (club: Club) => Promise<void>;
  removeClub: (clubId: string) => Promise<void>;
  createRatePeriod: (ratePeriod: Omit<ClubRatePeriod, "id">) => Promise<void>;
  updateRatePeriod: (ratePeriod: ClubRatePeriod) => Promise<void>;
  removeRatePeriod: (ratePeriodId: string) => Promise<void>;
  createFlightEntry: (input: FlightEntryInput) => Promise<void>;
  updateFlightEntry: (entryId: string, input: FlightEntryInput) => Promise<void>;
  createExpenseEntry: (input: ExpenseEntryInput) => Promise<void>;
  updateExpenseEntry: (entryId: string, input: ExpenseEntryInput) => Promise<void>;
  removeEntry: (entryId: string) => Promise<void>;
  exportBackupData: () => Promise<HobbsTabBackup>;
  importBackupData: (backup: unknown) => Promise<void>;
}

const AppDataContext = createContext<AppDataState | undefined>(undefined);

export const AppDataProvider = ({ children }: PropsWithChildren) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubRatePeriods, setClubRatePeriods] = useState<ClubRatePeriod[]>([]);
  const [entries, setEntries] = useState<EntryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const [loadedClubs, loadedRatePeriods, loadedEntries] = await Promise.all([
        listClubs(),
        listClubRatePeriods(),
        listEntries(),
      ]);

      setClubs(loadedClubs.sort((left, right) => left.name.localeCompare(right.name)));
      setClubRatePeriods(
        loadedRatePeriods.sort((left, right) =>
          `${left.clubId}:${left.effectiveFrom}`.localeCompare(
            `${right.clubId}:${right.effectiveFrom}`,
          ),
        ),
      );
      setEntries(loadedEntries.sort((left, right) => right.date.localeCompare(left.date)));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load local data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const syntheticDues = useMemo(
    () => buildSyntheticDues(clubs, clubRatePeriods, entries),
    [clubs, clubRatePeriods, entries],
  );

  const monthlySummaries = useMemo(
    () => buildMonthlySummaries(entries, syntheticDues),
    [entries, syntheticDues],
  );

  const historyRows = useMemo(
    () => buildHistoryRows(entries, syntheticDues),
    [entries, syntheticDues],
  );

  const persistAndRefresh = useCallback(
    async (operation: () => Promise<void>) => {
      await operation();
      await refresh();
    },
    [refresh],
  );

  const value: AppDataState = {
    clubs,
    clubRatePeriods,
    entries,
    syntheticDues,
    monthlySummaries,
    historyRows,
    loading,
    error,
    refresh,
    createClub: async (club) =>
      persistAndRefresh(() =>
        saveClub({
          ...club,
          id: createId(),
        }),
      ),
    updateClub: async (club) => persistAndRefresh(() => saveClub(club)),
    removeClub: async (clubId) => persistAndRefresh(() => deleteClub(clubId)),
    createRatePeriod: async (ratePeriod) =>
      persistAndRefresh(() =>
        saveClubRatePeriod({
          ...ratePeriod,
          id: createId(),
        }),
      ),
    updateRatePeriod: async (ratePeriod) =>
      persistAndRefresh(() => saveClubRatePeriod(ratePeriod)),
    removeRatePeriod: async (ratePeriodId) =>
      persistAndRefresh(() => deleteClubRatePeriod(ratePeriodId)),
    createFlightEntry: async (input) =>
      persistAndRefresh(() =>
        saveEntry(buildFlightEntry(createId(), input, clubRatePeriods)),
      ),
    updateFlightEntry: async (entryId, input) =>
      persistAndRefresh(() =>
        saveEntry(buildFlightEntry(entryId, input, clubRatePeriods)),
      ),
    createExpenseEntry: async (input) =>
      persistAndRefresh(() => saveEntry(buildExpenseEntry(createId(), input))),
    updateExpenseEntry: async (entryId, input) =>
      persistAndRefresh(() => saveEntry(buildExpenseEntry(entryId, input))),
    removeEntry: async (entryId) => persistAndRefresh(() => deleteEntry(entryId)),
    exportBackupData: async () => exportBackup(),
    importBackupData: async (backup) => persistAndRefresh(() => importBackup(backup)),
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider.");
  }

  return context;
};
