export function resolveBookCredentials(
  url: { agentId: string | null; session: string | null },
  saved?: { agentId: string; session: string },
): { agentId: string; session: string; sessionFromUrl: boolean };
