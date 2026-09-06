const AGENT_KEY = 'chit402-book-agent-id';
const SESSION_KEY = 'chit402-book-session';

import { resolveBookCredentials as resolveBookCredentialsCore } from './bookStorageCore.mjs';

export interface BookCredentials {
  agentId: string;
  session: string;
}

/** Prefer URL query params over sessionStorage (possession links use ?agent_id=&session=). */
export function resolveBookCredentials(
  url: { agentId: string | null; session: string | null },
  saved: BookCredentials = { agentId: '', session: '' },
): BookCredentials & { sessionFromUrl: boolean } {
  return resolveBookCredentialsCore(url, saved);
}

export function loadBookCredentials(): BookCredentials {
  try {
    return {
      agentId: sessionStorage.getItem(AGENT_KEY) ?? '',
      session: sessionStorage.getItem(SESSION_KEY) ?? '',
    };
  } catch {
    return { agentId: '', session: '' };
  }
}

export function saveBookCredentials(creds: BookCredentials): void {
  try {
    sessionStorage.setItem(AGENT_KEY, creds.agentId);
    sessionStorage.setItem(SESSION_KEY, creds.session);
  } catch {
    /* private mode / quota */
  }
}

export function clearBookCredentials(): void {
  try {
    sessionStorage.removeItem(AGENT_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
