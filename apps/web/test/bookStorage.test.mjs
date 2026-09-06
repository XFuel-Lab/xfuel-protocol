import { test } from 'node:test';
import assert from 'node:assert/strict';

const { resolveBookCredentials } = await import('../src/lib/bookStorageCore.mjs');

test('resolveBookCredentials prefers URL session over sessionStorage', () => {
  const saved = { agentId: '1', session: 'stored-session' };
  const resolved = resolveBookCredentials(
    { agentId: '149', session: 'url-session-token' },
    saved,
  );
  assert.equal(resolved.agentId, '149');
  assert.equal(resolved.session, 'url-session-token');
  assert.equal(resolved.sessionFromUrl, true);
});

test('resolveBookCredentials falls back to saved when URL omits session', () => {
  const saved = { agentId: '7', session: 'stored-session' };
  const resolved = resolveBookCredentials(
    { agentId: '149', session: null },
    saved,
  );
  assert.equal(resolved.agentId, '149');
  assert.equal(resolved.session, 'stored-session');
  assert.equal(resolved.sessionFromUrl, false);
});

test('resolveBookCredentials uses saved agent_id when URL omits it', () => {
  const saved = { agentId: '42', session: 'stored-session' };
  const resolved = resolveBookCredentials(
    { agentId: null, session: 'url-session' },
    saved,
  );
  assert.equal(resolved.agentId, '42');
  assert.equal(resolved.session, 'url-session');
});
