/**
 * Basic smoke test for chit402-adapters re-exports.
 */
import assert from 'node:assert';

const sdk = await import('./index.js');

assert.ok(sdk.resolveChitConfig, 'resolveChitConfig should be exported');
assert.ok(sdk.extractReceipt, 'extractReceipt should be exported');
assert.ok(sdk.createChitChatOpenAI, 'createChitChatOpenAI should be exported');
assert.ok(sdk.createChit, 'createChit should be exported');
assert.ok(sdk.ingestForeignX402ToBook, 'ingestForeignX402ToBook should be exported');

console.log('✓ chit402-adapters re-exports verified');
