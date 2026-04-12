export type BillingTimeType = "hobbs" | "tach";

export interface Club {
  id: string;
  name: string;
  active: boolean;
  notes?: string;
}

export interface ClubRatePeriod {
  id: string;
  clubId: string;
  effectiveFrom: string;
  billingTimeType: BillingTimeType;
  hourlyRate: number;
  monthlyDues: number;
}
