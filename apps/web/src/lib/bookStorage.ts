const AGENT_KEY = 'chit402-book-agent-id';
const SESSION_KEY = 'chit402-book-session';

export interface BookCredentials {
  agentId: string;
  session: string;
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
