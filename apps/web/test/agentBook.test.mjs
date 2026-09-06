import { test } from 'node:test';
import assert from 'node:assert/strict';

const {
  formatUsdc,
  parseUsdcInput,
  computeBurnRate,
  computeModelMix,
  summarizePaymentRef,
} = await import('../src/lib/agentBookCore.mjs');

test('formatUsdc renders atomic units', () => {
  assert.equal(formatUsdc('10000'), '0.01');
  assert.equal(formatUsdc('1000000'), '1');
  assert.equal(formatUsdc('0'), '0');
});

test('parseUsdcInput converts human amounts', () => {
  assert.equal(parseUsdcInput('1.5'), '1500000');
  assert.equal(parseUsdcInput('0.002'), '2000');
  assert.equal(parseUsdcInput(''), null);
  assert.equal(parseUsdcInput('bad'), null);
});

test('computeBurnRate sums rows in window', () => {
  const now = new Date().toISOString();
  const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const rate = computeBurnRate([
    { task_id: 'a', payment: { ref: 'x', rail: 'usdc', amount: '1000000' }, collected_at: now },
    { task_id: 'b', payment: { ref: 'y', rail: 'usdc', amount: '500000' }, collected_at: old },
  ], 24);
  assert.equal(rate.rowCount, 1);
  assert.equal(rate.spentUnits, 1000000n);
  assert.equal(rate.perDay, '1');
});

test('computeModelMix groups by hub and model', () => {
  const mix = computeModelMix([
    {
      task_id: '1',
      payment: { ref: 'a', rail: 'usdc', amount: '3000000' },
      route: { hub: 'theta', model: 'theta/glm' },
      collected_at: null,
    },
    {
      task_id: '2',
      payment: { ref: 'b', rail: 'usdc', amount: '1000000' },
      route: { hub: 'akash', model: 'xfuel/auto' },
      collected_at: null,
    },
  ]);
  assert.equal(mix.length, 2);
  assert.equal(mix[0].model, 'theta/glm');
  assert.equal(mix[0].pct, 75);
});

test('summarizePaymentRef truncates long refs', () => {
  const short = summarizePaymentRef('base:0xabc', 'usdc');
  assert.equal(short, 'usdc:base:0xabc');
  const long = summarizePaymentRef('base:0x' + 'a'.repeat(40), 'usdc');
  assert.ok(long.includes('…'));
});
