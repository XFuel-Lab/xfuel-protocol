import { receiptUrlFor } from './receipt-url.js';

export interface ReceiptLike {
  task_id?: string;
  verify_url?: string;
  xfuel?: {
    task_id?: string;
    verify_url?: string;
    hub?: string;
    model?: string;
    amount?: string;
  };
}

export interface ExtractedReceipt {
  task_id?: string;
  verify_url?: string;
  hub?: string;
  model?: string;
  amount?: string;
}

export type HeaderLike =
  | Record<string, string | string[] | undefined>
  | Headers
  | { get(name: string): string | null };

function headerValue(headers: HeaderLike | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  if (typeof (headers as Headers).get === 'function') {
    const value = (headers as Headers).get(name);
    return value ?? undefined;
  }
  const lower = name.toLowerCase();
  const record = headers as Record<string, string | string[] | undefined>;
  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase() !== lower || value == null) continue;
    return Array.isArray(value) ? value[0] : value;
  }
  return undefined;
}

/** Public receipt page for a task when the server omits verify_url. */
export { receiptUrlFor };

/** Resolve verify_url from payload fields or construct from task_id + apiUrl. */
export function verifyUrlOf(res: ReceiptLike, apiUrl: string): string {
  if (res.verify_url) return res.verify_url;
  const nested = res.xfuel?.verify_url;
  if (nested) return nested;
  const taskId = res.task_id ?? res.xfuel?.task_id;
  return taskId ? receiptUrlFor(apiUrl, taskId) : '';
}

/** Extract receipt fields from a chat-completions JSON body and optional headers. */
export function extractReceipt(
  payload: ReceiptLike | Record<string, unknown> | null | undefined,
  apiUrl: string,
  headers?: HeaderLike,
): ExtractedReceipt {
  const like = (payload ?? {}) as ReceiptLike;
  const headerVerify = headerValue(headers, 'x-xfuel-verify-url');
  const headerTask = headerValue(headers, 'x-xfuel-task-id');

  const task_id = like.task_id ?? like.xfuel?.task_id ?? headerTask;
  const verify_url = headerVerify || verifyUrlOf(like, apiUrl) || undefined;

  return {
    ...(task_id ? { task_id } : {}),
    ...(verify_url ? { verify_url } : {}),
    ...(like.xfuel?.hub ? { hub: like.xfuel.hub } : {}),
    ...(like.xfuel?.model ? { model: like.xfuel.model } : {}),
    ...(like.xfuel?.amount ? { amount: like.xfuel.amount } : {}),
  };
}

/** Promote receipt fields to the top level of a response object. */
export function withReceiptFields(
  payload: Record<string, unknown>,
  apiUrl: string,
  headers?: HeaderLike,
): Record<string, unknown> {
  const receipt = extractReceipt(payload, apiUrl, headers);
  return {
    ...payload,
    ...(receipt.task_id ? { task_id: receipt.task_id } : {}),
    ...(receipt.verify_url ? { verify_url: receipt.verify_url } : {}),
  };
}
