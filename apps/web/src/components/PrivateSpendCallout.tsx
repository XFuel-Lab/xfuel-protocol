import { Link } from 'react-router-dom';

type Props = {
  /** When true, show compact badge-only row (book dashboard header). */
  compact?: boolean;
};

export default function PrivateSpendCallout({ compact = false }: Props) {
  if (compact) {
    return (
      <span className="badge badge-purple" title="Gateway-trusted vendor blind — not prompt encryption">
        Private Spend on
      </span>
    );
  }

  return (
    <section className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span className="badge badge-purple">Private Spend</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>mode: vendor_blind</span>
      </div>
      <h3 style={{ marginBottom: '0.5rem' }}>Providers see gateway traffic, not your topology</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, maxWidth: '42rem' }}>
        With a possession session (<code>X-XFuel-Session</code> from register), inference routes in{' '}
        <strong>vendor_blind</strong> mode by default. Frontier labs and hubs see pooled Chit402
        credentials — not which principal, wallet graph, or org funded the call.
      </p>
      <ul style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginTop: '0.75rem', paddingLeft: '1.25rem' }}>
        <li>
          <strong>On when:</strong> valid possession session on chat completions or book APIs (demo keys never qualify).
        </li>
        <li>
          <strong>Providers see:</strong> gateway-pooled traffic, hub, model, amount on the receipt.
        </li>
        <li>
          <strong>Providers do not see:</strong> your end-customer spend topology or buyer identity graph.
        </li>
        <li>
          <strong>Not prompt confidentiality.</strong> Prompts are not encrypted by default. Receipt{' '}
          <code>privacy.notes</code> state this. For content privacy, use a confidential / TEE provider tier.
        </li>
      </ul>
      <p style={{ marginTop: '0.85rem' }}>
        <Link to="/docs/private-spend" className="btn btn-secondary btn-sm">
          Private Spend docs →
        </Link>
      </p>
    </section>
  );
}
