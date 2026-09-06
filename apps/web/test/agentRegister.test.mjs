import { test } from 'node:test';
import assert from 'node:assert/strict';

const { registerErrorCopy } = await import('../src/lib/agentRegisterCore.mjs');

test('registerErrorCopy maps not_qualifying demo honestly', () => {
  const copy = registerErrorCopy('not_qualifying', 'demo/unmetered receipt does not qualify');
  assert.match(copy.body, /Demo and unmetered/);
  assert.match(copy.body, /POST \/v1\/chat\/completions/);
});

test('registerErrorCopy maps hmac_invalid', () => {
  const copy = registerErrorCopy('hmac_invalid', 'HMAC mismatch');
  assert.equal(copy.title, 'HMAC verification failed');
  assert.match(copy.body, /verify_url/);
});

test('registerErrorCopy maps duplicate_ref', () => {
  const copy = registerErrorCopy('duplicate_ref', 'duplicate payment.ref');
  assert.equal(copy.title, 'Already registered');
});

test('registerErrorCopy maps invalid_wallet', () => {
  const copy = registerErrorCopy('invalid_wallet', 'EOA agentWallet is not accepted');
  assert.match(copy.body, /EOA/);
});
