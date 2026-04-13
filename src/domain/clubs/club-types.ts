export type BillingTimeType = "hobbs" | "tach";

export interface Club {
  id: string;
  name: string;
  active: boolean;
  notes?: string;
}

export interface Plane {
  id: string;
  clubId: string;
  name: string;
  active: boolean;
}

export interface ClubDuesPeriod {
  id: string;
  clubId: string;
  effectiveFrom: string;
  monthlyDues: number;
}

export interface PlaneRatePeriod {
  id: string;
  planeId: string;
  effectiveFrom: string;
  billingTimeType: BillingTimeType;
  hourlyRate: number;
}
