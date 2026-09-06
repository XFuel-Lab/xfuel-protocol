# Later framework adapters — shipped

Status: **shipped** (see PR: Open framework adapter doors).

Doors that share the same beachhead — no deep protocol fork:

| Platform | www docs | Code / skill |
|----------|----------|--------------|
| LangChain + Vercel AI SDK | `/docs/framework-adapters` | `packages/adapters` · `chit402-adapters` |
| Cloudflare Agents / Workers | `/docs/cloudflare` | `packages/sidecar` · `chit402-sidecar` |
| OpenClaw | `/docs/openclaw` | `skills/openclaw-chit402/` |
| Virtuals ACP | `/docs/acp` | [acp-stamp-path.md](./acp-stamp-path.md) · optional `ingestForeignX402ToBook` in adapters |
| Olas | `/docs/olas` → swarm page | docs only |
| Theoriq | `/docs/theoriq` → swarm page | docs only |

## Beachhead (locked)

1. Point OpenAI-compatible client at `https://api.chit402.com/v1`
2. Pay USDC on Base (x402) with session/call caps
3. Return `verify_url` to the principal — hub, model, amount on the receipt page
4. Optional: `POST /v1/agents/register` then hold the possession-gated book

Do not lead with floor pricing. Chit402 is the receipt book, not a cheaper inference router.

## npm publish (manual)

```bash
cd packages/adapters && npm publish --access public
cd packages/aliases/chit402-adapters && npm publish --access public
```

Requires WebAuthn / browser auth per [packages/sdk/PUBLISHING.md](../../packages/sdk/PUBLISHING.md).
