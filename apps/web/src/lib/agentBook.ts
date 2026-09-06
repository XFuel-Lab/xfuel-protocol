import { getApiHost } from '../apiHost';
import {
  USDC_DECIMALS,
  computeBurnRate,
  computeModelMix,
  formatCollectedAt,
  formatUsdc,
  parseUsdcInput,
  summarizePaymentRef,
  verifyUrlFor,
  type BurnRate,
  type ModelMixItem,
} from './agentBookCore.mjs';

export {
  USDC_DECIMALS,
  computeBurnRate,
  computeModelMix,
  formatCollectedAt,
  formatUsdc,
  parseUsdcInput,
  summarizePaymentRef,
  verifyUrlFor,
};

export interface BookPayment {
  ref: string;
  rail: string;
  amount: string | null;
}

export interface BookRoute {
  model?: string;
  hub?: string;
}

export interface BookEntry {
  task_id: string;
  payment: BookPayment;
  route?: BookRoute;
  collected_at: string | null;
  parent_ref?: string;
}

export interface BookTotals {
  count: number;
  usdc_sum: string;
  by_rail: Record<string, { count: number; amount: string }>;
}

export interface AgentBookResponse {
  agent_id: number;
  limit: number;
  entries: BookEntry[];
  totals: BookTotals;
  window: string;
  cap: string | null;
  spent: string;
  remaining: string | null;
  allowance?: {
    agent_id: number;
    remaining: string | null;
    as_of: string;
    signature: { alg: string; value: string };
  };
}

export type BookFetchError = 'unauth' | 'forbidden' | 'network' | 'parse';

export interface FetchBookParams {
  agentId: number;
  session: string;
  limit?: number;
  budget?: string | null;
}

export type FetchBookResult =
  | { ok: true; data: AgentBookResponse }
  | { ok: false; error: BookFetchError; status?: number };

export type { BurnRate, ModelMixItem };

/** POST /v1/agents/:agent_id/book with possession session. */
export async function fetchAgentBook(
  apiV1: string,
  params: FetchBookParams,
): Promise<FetchBookResult> {
  const url = `${apiV1.replace(/\/$/, '')}/agents/${params.agentId}/book`;
  const body: Record<string, unknown> = { session: params.session };
  if (params.limit != null) body.limit = params.limit;
  if (Object.prototype.hasOwnProperty.call(params, 'budget')) {
    body.budget = params.budget;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XFuel-Session': params.session,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: 'network' };
  }

  if (res.status === 401) return { ok: false, error: 'unauth', status: 401 };
  if (res.status === 403) return { ok: false, error: 'forbidden', status: 403 };
  if (!res.ok) return { ok: false, error: 'network', status: res.status };

  try {
    const data = (await res.json()) as AgentBookResponse;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'parse', status: res.status };
  }
}

/** Default verify URL host for helpers that need it. */
export function defaultApiHost(): string {
  return getApiHost();
}
