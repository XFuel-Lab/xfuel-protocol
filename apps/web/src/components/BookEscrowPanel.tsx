import { useCallback, useState } from 'react';
import {
  bookEscrowAction,
  type BookEscrowRecord,
  type EscrowActionResult,
} from '../lib/agentBook';

type Props = {
  apiV1: string;
  agentId: number;
  session: string;
  /** Pre-fill from a selected book row. */
  defaultTaskId?: string;
};

const DISCLAIMER =
  'Ledger escrow v1: USDC already moved at x402 payment. Release verifies settlement metadata '
  + '(output hash, proof tier) — not that a closed-weight model ran your prompt. Clawback is dispute '
  + 'adjudication; refunds are instructions, not automatic on-chain claw.';

export default function BookEscrowPanel({ apiV1, agentId, session, defaultTaskId = '' }: Props) {
  const [taskId, setTaskId] = useState(defaultTaskId);
  const [outputHash, setOutputHash] = useState('');
  const [proofTier, setProofTier] = useState<'settlement' | 'inference' | ''>('settlement');
  const [escrowId, setEscrowId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastEscrow, setLastEscrow] = useState<BookEscrowRecord | null>(null);
  const [lastResult, setLastResult] = useState<EscrowActionResult | null>(null);

  const run = useCallback(async (action: 'open' | 'release' | 'clawback' | 'status') => {
    setBusy(true);
    setMessage(null);
    const params: Parameters<typeof bookEscrowAction>[2] = { action };
    if (action === 'open') {
      if (!taskId.trim()) {
        setMessage('task_id required to open escrow.');
        setBusy(false);
        return;
      }
      params.task_id = taskId.trim();
      params.required = {};
      if (outputHash.trim()) params.required.output_hash = outputHash.trim();
      if (proofTier) params.required.proof_tier = proofTier;
      if (!params.required.output_hash && !params.required.proof_tier) {
        setMessage('Set required output hash and/or proof tier.');
        setBusy(false);
        return;
      }
    } else {
      if (escrowId.trim()) params.escrow_id = escrowId.trim();
      else if (taskId.trim()) params.task_id = taskId.trim();
      else {
        setMessage('escrow_id or task_id required.');
        setBusy(false);
        return;
      }
      if (action === 'clawback') {
        params.claim_type = 'output_missing';
      }
    }

    const result = await bookEscrowAction(apiV1, { agentId, session }, params);
    setBusy(false);
    setLastResult(result);

    if (!result.ok) {
      setMessage(result.message || result.error);
      if (result.escrow) {
        setLastEscrow(result.escrow);
        setEscrowId(result.escrow.escrow_id);
      }
      return;
    }

    if (result.escrow) {
      setLastEscrow(result.escrow);
      setEscrowId(result.escrow.escrow_id);
      setMessage(`Escrow ${result.escrow.status} · ${result.escrow.escrow_id}`);
    } else {
      setMessage('Done.');
    }
  }, [apiV1, agentId, escrowId, outputHash, proofTier, session, taskId]);

  return (
    <section className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>Escrow / high-value helper</h3>
        <span className="badge badge-orange">ledger v1</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1rem' }}>
        {DISCLAIMER}
      </p>

      <div className="book-access-form" style={{ gap: '0.75rem' }}>
        <label className="book-field">
          <span className="book-field-label">task_id (on book, paid)</span>
          <input
            className="input"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            placeholder="from collected row or verify_url"
            spellCheck={false}
          />
        </label>
        <label className="book-field">
          <span className="book-field-label">required output hash (open)</span>
          <input
            className="input"
            value={outputHash}
            onChange={(e) => setOutputHash(e.target.value)}
            placeholder="0x… SHA-256 commitment"
            spellCheck={false}
          />
        </label>
        <label className="book-field">
          <span className="book-field-label">required proof tier (open)</span>
          <select
            className="input"
            value={proofTier}
            onChange={(e) => setProofTier(e.target.value as '' | 'settlement' | 'inference')}
          >
            <option value="">— none —</option>
            <option value="settlement">settlement</option>
            <option value="inference">inference</option>
          </select>
        </label>
        <label className="book-field">
          <span className="book-field-label">escrow_id (release / clawback / status)</span>
          <input
            className="input"
            value={escrowId}
            onChange={(e) => setEscrowId(e.target.value)}
            placeholder="from open response"
            spellCheck={false}
          />
        </label>
      </div>

      <div className="book-access-actions" style={{ marginTop: '1rem' }}>
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void run('open')}>
          Open
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void run('status')}>
          Status
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void run('release')}>
          Release
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void run('clawback')}>
          Clawback
        </button>
      </div>

      {message && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.85rem' }} role="status">
          {message}
        </p>
      )}

      {lastEscrow && (
        <pre
          className="docs-code"
          style={{ marginTop: '1rem', fontSize: '0.75rem', maxHeight: 220, overflow: 'auto' }}
        >
          <code>{JSON.stringify(lastEscrow, null, 2)}</code>
        </pre>
      )}

      {lastResult?.disclaimer && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.75rem' }}>
          {lastResult.disclaimer}
        </p>
      )}
    </section>
  );
}
