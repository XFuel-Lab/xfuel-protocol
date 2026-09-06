import { normalizeChitUrls } from './config.js';
import { extractReceipt, type ExtractedReceipt } from './receipt.js';

export interface IngestForeignX402Payload {
  payment_required: {
    resource: string;
    amount: string;
    payTo: string;
    network?: string;
    asset?: string;
  };
  payment_response: {
    tx: string;
    payer: string;
    network?: string;
  };
}

export interface IngestToBookOptions {
  apiUrl?: string;
  apiKey: string;
  agentId: number | string;
  session: string;
}

export interface IngestToBookResult {
  ok: boolean;
  status: number;
  task_id?: string;
  verify_url?: string;
  error?: string;
  message?: string;
  body?: Record<string, unknown>;
}

/**
 * Record foreign x402 spend on a registered agent book (ACP / multi-hop flows).
 * Requires possession session from POST /v1/agents/register.
 */
export async function ingestForeignX402ToBook(
  payload: IngestForeignX402Payload,
  options: IngestToBookOptions,
): Promise<IngestToBookResult> {
  const { apiUrl } = normalizeChitUrls(options.apiUrl);
  const url = `${apiUrl}/v1/agents/${options.agentId}/book/ingest`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': options.apiKey,
      'X-Xfuel-Session': options.session,
    },
    body: JSON.stringify(payload),
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: (body.error as string) || 'ingest_failed',
      message: (body.message as string) || `HTTP ${res.status}`,
      body,
    };
  }

  const receipt = extractReceipt(body, apiUrl);
  return {
    ok: true,
    status: res.status,
    task_id: receipt.task_id ?? (body.task_id as string | undefined),
    verify_url: receipt.verify_url ?? (body.verify_url as string | undefined),
    body,
  };
}

export type { ExtractedReceipt };
