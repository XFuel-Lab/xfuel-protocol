/** Pure credential resolution for /book (shared with unit tests). */
export function resolveBookCredentials(
  url,
  saved = { agentId: '', session: '' },
) {
  const agentId = (url.agentId ?? '').trim() || saved.agentId;
  const urlSession = (url.session ?? '').trim();
  const session = urlSession || saved.session;
  return { agentId, session, sessionFromUrl: Boolean(urlSession) };
}
