export type BudgetSettingKey = "annualBudget" | "instructionBudgetOverride";

export interface BudgetSetting {
  key: BudgetSettingKey;
  amount: number;
}
