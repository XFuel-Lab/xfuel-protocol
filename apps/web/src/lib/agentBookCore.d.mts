export const USDC_DECIMALS: number;

export function formatUsdc(units: string | number | bigint | null | undefined): string;
export function parseUsdcInput(input: string): string | null;
export function verifyUrlFor(taskId: string, apiHost: string): string;
export function summarizePaymentRef(ref: string, rail: string): string;

export interface BurnRate {
  windowHours: number;
  spentUnits: bigint;
  perHour: string;
  perDay: string;
  rowCount: number;
}

export interface ModelMixItem {
  model: string;
  hub: string;
  amount: bigint;
  count: number;
  pct: number;
}

export interface BookEntryLike {
  task_id: string;
  payment: { ref: string; rail: string; amount: string | null };
  route?: { model?: string; hub?: string };
  collected_at: string | null;
}

export function computeBurnRate(entries: BookEntryLike[], windowHours?: number): BurnRate;
export function computeModelMix(entries: BookEntryLike[]): ModelMixItem[];
export function formatCollectedAt(iso: string | null): string;
