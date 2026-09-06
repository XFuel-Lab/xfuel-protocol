/** USDC atomic units use 6 decimal places. */
export const USDC_DECIMALS = 6;

/** Format USDC atomic units (6 dp) for display. */
export function formatUsdc(units) {
  if (units == null || units === '') return '—';
  try {
    const n = BigInt(String(units).trim());
    const neg = n < 0n;
    const abs = neg ? -n : n;
    const whole = abs / 1_000_000n;
    const frac = abs % 1_000_000n;
    const fracStr = frac.toString().padStart(USDC_DECIMALS, '0').replace(/0+$/, '');
    const body = fracStr ? `${whole}.${fracStr}` : whole.toString();
    return neg ? `-${body}` : body;
  } catch {
    return String(units);
  }
}

/** Parse a human USDC amount into atomic units. */
export function parseUsdcInput(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,6})?$/.test(trimmed)) return null;
  const [whole, frac = ''] = trimmed.split('.');
  const padded = (frac + '000000').slice(0, USDC_DECIMALS);
  try {
    const units = BigInt(whole) * 1_000_000n + BigInt(padded);
    return units.toString();
  } catch {
    return null;
  }
}

/** Public receipt URL for a collected task. */
export function verifyUrlFor(taskId, apiHost) {
  const base = String(apiHost).replace(/\/$/, '');
  return `${base}/receipt/${encodeURIComponent(taskId)}`;
}

/** Shorten a payment ref for table display. */
export function summarizePaymentRef(ref, rail) {
  const raw = `${rail}:${ref}`;
  if (raw.length <= 28) return raw;
  return `${raw.slice(0, 12)}…${raw.slice(-10)}`;
}

/** Sum spend in the last N hours from collected_at timestamps. */
export function computeBurnRate(entries, windowHours = 24) {
  const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
  let spent = 0n;
  let rowCount = 0;
  for (const e of entries) {
    if (!e.collected_at) continue;
    const ts = Date.parse(e.collected_at);
    if (!Number.isFinite(ts) || ts < cutoff) continue;
    try {
      spent += BigInt(String(e.payment.amount ?? '0'));
      rowCount += 1;
    } catch {
      /* skip malformed */
    }
  }
  const perHourUnits = windowHours > 0 ? spent / BigInt(windowHours) : spent;
  const perDayUnits = windowHours > 0 ? (spent * 24n) / BigInt(windowHours) : spent * 24n;
  return {
    windowHours,
    spentUnits: spent,
    perHour: formatUsdc(perHourUnits),
    perDay: formatUsdc(perDayUnits),
    rowCount,
  };
}

/** Group spend by model for mix bars. */
export function computeModelMix(entries) {
  const byKey = new Map();
  let total = 0n;
  for (const e of entries) {
    const model = e.route?.model || '(unknown)';
    const hub = e.route?.hub || '—';
    const key = `${hub}::${model}`;
    const prev = byKey.get(key) ?? { model, hub, amount: 0n, count: 0 };
    try {
      prev.amount += BigInt(String(e.payment.amount ?? '0'));
      total += BigInt(String(e.payment.amount ?? '0'));
    } catch {
      /* skip */
    }
    prev.count += 1;
    byKey.set(key, prev);
  }
  const items = [...byKey.values()].sort((a, b) => (a.amount < b.amount ? 1 : -1));
  return items.map((item) => ({
    ...item,
    pct: total > 0n ? Number((item.amount * 10000n) / total) / 100 : 0,
  }));
}

export function formatCollectedAt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
