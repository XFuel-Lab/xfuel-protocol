import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { extractReceipt, receiptUrlFor, verifyUrlOf, withReceiptFields } from '../receipt.js';

const API_URL = 'https://api.chit402.com';
const fixturePath = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'chat-receipt.json');
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));

describe('verifyUrlOf', () => {
  it('reads nested xfuel.verify_url from fixture', () => {
    const url = verifyUrlOf(fixture, API_URL);
    assert.equal(url, fixture.xfuel.verify_url);
  });

  it('constructs verify_url from task_id when omitted', () => {
    const url = verifyUrlOf({ xfuel: { task_id: 'chit-abc' } }, API_URL);
    assert.equal(url, `${API_URL}/receipt/chit-abc`);
  });

  it('returns empty string when no receipt fields', () => {
    assert.equal(verifyUrlOf({}, API_URL), '');
  });
});

describe('extractReceipt', () => {
  it('extracts full receipt from fixture body', () => {
    const receipt = extractReceipt(fixture, API_URL);
    assert.equal(receipt.task_id, fixture.xfuel.task_id);
    assert.equal(receipt.verify_url, fixture.xfuel.verify_url);
    assert.equal(receipt.hub, 'akash');
    assert.equal(receipt.amount, '10000');
  });

  it('prefers x-xfuel-verify-url header', () => {
    const receipt = extractReceipt(
      {},
      API_URL,
      { 'x-xfuel-verify-url': 'https://api.chit402.com/receipt/header-id' },
    );
    assert.equal(receipt.verify_url, 'https://api.chit402.com/receipt/header-id');
  });

  it('promotes fields via withReceiptFields', () => {
    const enriched = withReceiptFields(fixture as Record<string, unknown>, API_URL);
    assert.equal(enriched.verify_url, fixture.xfuel.verify_url);
    assert.equal(enriched.task_id, fixture.xfuel.task_id);
  });
});

describe('receiptUrlFor', () => {
  it('strips trailing slash on apiUrl', () => {
    assert.equal(
      receiptUrlFor('https://api.chit402.com/', 'chit-1'),
      'https://api.chit402.com/receipt/chit-1',
    );
  });
});
