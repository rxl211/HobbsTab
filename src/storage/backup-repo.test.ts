import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
  clubs: {
    toArray: vi.fn(),
    clear: vi.fn(),
    bulkPut: vi.fn(),
  },
  planes: {
    toArray: vi.fn(),
    clear: vi.fn(),
    bulkPut: vi.fn(),
  },
  clubDuesPeriods: {
    toArray: vi.fn(),
    clear: vi.fn(),
    bulkPut: vi.fn(),
  },
  planeRatePeriods: {
    toArray: vi.fn(),
    clear: vi.fn(),
    bulkPut: vi.fn(),
  },
  entries: {
    toArray: vi.fn(),
    clear: vi.fn(),
    bulkPut: vi.fn(),
  },
  settings: {
    toArray: vi.fn(),
    clear: vi.fn(),
    bulkPut: vi.fn(),
  },
  transaction: vi.fn(async (_mode: string, _tables: unknown, callback: () => Promise<void>) => {
    await callback();
  }),
  },
}));

vi.mock("./db", () => ({
  db: dbMock,
}));

import { exportBackup, importBackup } from "./backup-repo";

describe("backup repo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes the saved budget settings in backup export", async () => {
    dbMock.clubs.toArray.mockResolvedValue([]);
    dbMock.planes.toArray.mockResolvedValue([]);
    dbMock.clubDuesPeriods.toArray.mockResolvedValue([]);
    dbMock.planeRatePeriods.toArray.mockResolvedValue([]);
    dbMock.entries.toArray.mockResolvedValue([]);
    dbMock.settings.toArray.mockResolvedValue([
      { key: "annualBudget", amount: 4200 },
      { key: "instructionBudgetOverride", amount: 600 },
    ]);

    const backup = await exportBackup();

    expect(backup.version).toBe(3);
    expect(backup.settings).toEqual([
      { key: "annualBudget", amount: 4200 },
      { key: "instructionBudgetOverride", amount: 600 },
    ]);
  });

  it("restores saved budget settings during import", async () => {
    await importBackup({
      version: 3,
      exportedAt: "2026-04-13T12:00:00.000Z",
      clubs: [],
      planes: [],
      clubDuesPeriods: [],
      planeRatePeriods: [],
      entries: [],
      settings: [
        { key: "annualBudget", amount: 4200 },
        { key: "instructionBudgetOverride", amount: 600 },
      ],
    });

    expect(dbMock.settings.clear).toHaveBeenCalled();
    expect(dbMock.settings.bulkPut).toHaveBeenCalledWith([
      { key: "annualBudget", amount: 4200 },
      { key: "instructionBudgetOverride", amount: 600 },
    ]);
  });
});
