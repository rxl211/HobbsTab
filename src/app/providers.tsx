import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type {
  Club,
  ClubDuesPeriod,
  Plane,
  PlaneRatePeriod,
} from "../domain/clubs/club-types";
import { buildExpenseEntry, buildFlightEntry } from "../domain/entries/entry-rules";
import type {
  EntryRecord,
  ExpenseEntryInput,
  FlightEntryInput,
} from "../domain/entries/entry-types";
import type { BudgetSetting } from "../domain/settings/settings-types";
import {
  buildHistoryRows,
  buildMonthlySummaries,
  buildSyntheticDues,
} from "../domain/summaries/summary-service";
import { createId } from "../lib/ids";
import {
  deleteClub,
  deleteClubDuesPeriod,
  deletePlane,
  deletePlaneRatePeriod,
  listClubDuesPeriods,
  listClubs,
  listPlaneRatePeriods,
  listPlanes,
  saveCompleteClub,
  saveClub,
  saveClubDuesPeriod,
  savePlane,
  savePlaneWithRate,
  savePlaneRatePeriod,
} from "../storage/clubs-repo";
import { exportBackup, importBackup, type HobbsTabBackup } from "../storage/backup-repo";
import { deleteEntry, listEntries, saveEntry } from "../storage/entries-repo";
import {
  deleteBudgetSetting,
  listBudgetSettings,
  saveBudgetSetting,
} from "../storage/settings-repo";

interface AppDataState {
  clubs: Club[];
  planes: Plane[];
  clubDuesPeriods: ClubDuesPeriod[];
  planeRatePeriods: PlaneRatePeriod[];
  entries: EntryRecord[];
  budgetSetting?: BudgetSetting;
  instructionBudgetOverrideSetting?: BudgetSetting;
  syntheticDues: ReturnType<typeof buildSyntheticDues>;
  monthlySummaries: ReturnType<typeof buildMonthlySummaries>;
  historyRows: ReturnType<typeof buildHistoryRows>;
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  createClub: (club: Omit<Club, "id">) => Promise<void>;
  createCompleteClub: (input: {
    club: Omit<Club, "id">;
    duesPeriod: Omit<ClubDuesPeriod, "id" | "clubId">;
    plane: Omit<Plane, "id" | "clubId">;
    planeRatePeriod: Omit<PlaneRatePeriod, "id" | "planeId">;
  }) => Promise<void>;
  updateClub: (club: Club) => Promise<void>;
  removeClub: (clubId: string) => Promise<void>;
  createPlane: (plane: Omit<Plane, "id">) => Promise<void>;
  createPlaneWithRate: (input: {
    plane: Omit<Plane, "id" | "clubId"> & { clubId: string };
    planeRatePeriod: Omit<PlaneRatePeriod, "id" | "planeId">;
  }) => Promise<void>;
  updatePlane: (plane: Plane) => Promise<void>;
  removePlane: (planeId: string) => Promise<void>;
  createClubDuesPeriod: (period: Omit<ClubDuesPeriod, "id">) => Promise<void>;
  updateClubDuesPeriod: (period: ClubDuesPeriod) => Promise<void>;
  removeClubDuesPeriod: (periodId: string) => Promise<void>;
  createPlaneRatePeriod: (period: Omit<PlaneRatePeriod, "id">) => Promise<void>;
  updatePlaneRatePeriod: (period: PlaneRatePeriod) => Promise<void>;
  removePlaneRatePeriod: (periodId: string) => Promise<void>;
  createFlightEntry: (input: FlightEntryInput) => Promise<void>;
  updateFlightEntry: (entryId: string, input: FlightEntryInput) => Promise<void>;
  createExpenseEntry: (input: ExpenseEntryInput) => Promise<void>;
  updateExpenseEntry: (entryId: string, input: ExpenseEntryInput) => Promise<void>;
  removeEntry: (entryId: string) => Promise<void>;
  exportBackupData: () => Promise<HobbsTabBackup>;
  importBackupData: (backup: unknown) => Promise<void>;
  updateAnnualBudget: (amount: number) => Promise<void>;
  updateInstructionBudgetOverride: (amount: number) => Promise<void>;
  clearInstructionBudgetOverride: () => Promise<void>;
}

const AppDataContext = createContext<AppDataState | undefined>(undefined);

export const AppDataProvider = ({ children }: PropsWithChildren) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [planes, setPlanes] = useState<Plane[]>([]);
  const [clubDuesPeriods, setClubDuesPeriods] = useState<ClubDuesPeriod[]>([]);
  const [planeRatePeriods, setPlaneRatePeriods] = useState<PlaneRatePeriod[]>([]);
  const [entries, setEntries] = useState<EntryRecord[]>([]);
  const [budgetSetting, setBudgetSetting] = useState<BudgetSetting>();
  const [instructionBudgetOverrideSetting, setInstructionBudgetOverrideSetting] =
    useState<BudgetSetting>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const [
        loadedClubs,
        loadedPlanes,
        loadedDuesPeriods,
        loadedPlaneRates,
        loadedEntries,
        loadedBudgetSettings,
      ] =
        await Promise.all([
          listClubs(),
          listPlanes(),
          listClubDuesPeriods(),
          listPlaneRatePeriods(),
          listEntries(),
          listBudgetSettings(),
        ]);

      const annualBudgetSetting = loadedBudgetSettings.find(
        (setting) => setting.key === "annualBudget",
      );
      const instructionSetting = loadedBudgetSettings.find(
        (setting) => setting.key === "instructionBudgetOverride",
      );

      setClubs(loadedClubs.sort((left, right) => left.name.localeCompare(right.name)));
      setPlanes(
        loadedPlanes.sort((left, right) =>
          `${left.clubId}:${left.name}`.localeCompare(`${right.clubId}:${right.name}`),
        ),
      );
      setClubDuesPeriods(
        loadedDuesPeriods.sort((left, right) =>
          `${left.clubId}:${left.effectiveFrom}`.localeCompare(
            `${right.clubId}:${right.effectiveFrom}`,
          ),
        ),
      );
      setPlaneRatePeriods(
        loadedPlaneRates.sort((left, right) =>
          `${left.planeId}:${left.effectiveFrom}`.localeCompare(
            `${right.planeId}:${right.effectiveFrom}`,
          ),
        ),
      );
      setEntries(loadedEntries.sort((left, right) => right.date.localeCompare(left.date)));
      setBudgetSetting(annualBudgetSetting);
      setInstructionBudgetOverrideSetting(instructionSetting);
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
    () => buildSyntheticDues(clubs, clubDuesPeriods, entries),
    [clubs, clubDuesPeriods, entries],
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
    planes,
    clubDuesPeriods,
    planeRatePeriods,
    entries,
    budgetSetting,
    instructionBudgetOverrideSetting,
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
    createCompleteClub: async (input) =>
      persistAndRefresh(() => {
        const clubId = createId();
        const planeId = createId();

        return saveCompleteClub({
          club: {
            ...input.club,
            id: clubId,
          },
          duesPeriod: {
            ...input.duesPeriod,
            clubId,
            id: createId(),
          },
          plane: {
            ...input.plane,
            clubId,
            id: planeId,
          },
          planeRatePeriod: {
            ...input.planeRatePeriod,
            planeId,
            id: createId(),
          },
        });
      }),
    updateClub: async (club) => persistAndRefresh(() => saveClub(club)),
    removeClub: async (clubId) => persistAndRefresh(() => deleteClub(clubId)),
    createPlane: async (plane) =>
      persistAndRefresh(() =>
        savePlane({
          ...plane,
          id: createId(),
        }),
      ),
    createPlaneWithRate: async (input) =>
      persistAndRefresh(() => {
        const planeId = createId();

        return savePlaneWithRate({
          plane: {
            ...input.plane,
            id: planeId,
          },
          planeRatePeriod: {
            ...input.planeRatePeriod,
            planeId,
            id: createId(),
          },
        });
      }),
    updatePlane: async (plane) => persistAndRefresh(() => savePlane(plane)),
    removePlane: async (planeId) => persistAndRefresh(() => deletePlane(planeId)),
    createClubDuesPeriod: async (period) =>
      persistAndRefresh(() =>
        saveClubDuesPeriod({
          ...period,
          id: createId(),
        }),
      ),
    updateClubDuesPeriod: async (period) =>
      persistAndRefresh(() => saveClubDuesPeriod(period)),
    removeClubDuesPeriod: async (periodId) =>
      persistAndRefresh(() => deleteClubDuesPeriod(periodId)),
    createPlaneRatePeriod: async (period) =>
      persistAndRefresh(() =>
        savePlaneRatePeriod({
          ...period,
          id: createId(),
        }),
      ),
    updatePlaneRatePeriod: async (period) =>
      persistAndRefresh(() => savePlaneRatePeriod(period)),
    removePlaneRatePeriod: async (periodId) =>
      persistAndRefresh(() => deletePlaneRatePeriod(periodId)),
    createFlightEntry: async (input) =>
      persistAndRefresh(() =>
        saveEntry(buildFlightEntry(createId(), input, planeRatePeriods)),
      ),
    updateFlightEntry: async (entryId, input) =>
      persistAndRefresh(() =>
        saveEntry(buildFlightEntry(entryId, input, planeRatePeriods)),
      ),
    createExpenseEntry: async (input) =>
      persistAndRefresh(() => saveEntry(buildExpenseEntry(createId(), input))),
    updateExpenseEntry: async (entryId, input) =>
      persistAndRefresh(() => saveEntry(buildExpenseEntry(entryId, input))),
    removeEntry: async (entryId) => persistAndRefresh(() => deleteEntry(entryId)),
    exportBackupData: async () => exportBackup(),
    importBackupData: async (backup) => persistAndRefresh(() => importBackup(backup)),
    updateAnnualBudget: async (amount) =>
      persistAndRefresh(() => saveBudgetSetting("annualBudget", amount)),
    updateInstructionBudgetOverride: async (amount) =>
      persistAndRefresh(() => saveBudgetSetting("instructionBudgetOverride", amount)),
    clearInstructionBudgetOverride: async () =>
      persistAndRefresh(() => deleteBudgetSetting("instructionBudgetOverride")),
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
