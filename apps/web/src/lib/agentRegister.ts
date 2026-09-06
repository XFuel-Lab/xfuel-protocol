import { registerErrorCopy as registerErrorCopyCore } from './agentRegisterCore.mjs';

export interface RegisterSuccess {
  agent_id: number;
  agentWallet: string;
  wallet_kind: string | null;
  session: string;
  task_id: string;
  payment: {
    ref: string;
    rail: string;
    collected: boolean;
  };
}

export interface RegisterErrorBody {
  error?: string;
  message?: string;
}

export type RegisterResult =
  | { ok: true; data: RegisterSuccess }
  | { ok: false; status: number; error: string; message: string };

/** POST /v1/agents/register — bind agentWallet to a collected receipt. */
export async function registerAgent(
  apiV1: string,
  body: { agentWallet: string; task_id: string },
): Promise<RegisterResult> {
  const url = `${apiV1.replace(/\/$/, '')}/agents/register`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: 'network',
      message: 'Could not reach the gateway. Check your connection and retry.',
    };
  }

  let payload: RegisterSuccess & RegisterErrorBody;
  try {
    payload = (await res.json()) as RegisterSuccess & RegisterErrorBody;
  } catch {
    return {
      ok: false,
      status: res.status,
      error: 'parse',
      message: 'Unexpected response from the gateway.',
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: payload.error ?? 'unknown',
      message: payload.message ?? 'Registration failed.',
    };
  }

  return { ok: true, data: payload as RegisterSuccess };
}

export const registerErrorCopy = registerErrorCopyCore;
