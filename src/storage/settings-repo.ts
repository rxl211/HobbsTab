import type { BudgetSetting, BudgetSettingKey } from "../domain/settings/settings-types";
import { db } from "./db";

export const listBudgetSettings = () => db.settings.toArray();

export const saveBudgetSetting = async (key: BudgetSettingKey, amount: number) => {
  const setting: BudgetSetting = {
    key,
    amount: Number(amount.toFixed(2)),
  };

  await db.settings.put(setting);
};

export const deleteBudgetSetting = async (key: BudgetSettingKey) => {
  await db.settings.delete(key);
};
