import type { BudgetSetting } from "../domain/settings/settings-types";
import { db } from "./db";

export const getBudgetSetting = () => db.settings.get("annualBudget");

export const saveBudgetSetting = async (amount: number) => {
  const setting: BudgetSetting = {
    key: "annualBudget",
    amount: Number(amount.toFixed(2)),
  };

  await db.settings.put(setting);
};
