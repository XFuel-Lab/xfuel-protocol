import { resolveChitConfig, type ResolveChitConfigOptions } from './config.js';

export interface CreateChitOptions extends ResolveChitConfigOptions {
  /** Extra createOpenAI fields (compatibility, headers, fetch, …). */
  providerOptions?: Record<string, unknown>;
}

/**
 * Vercel AI SDK provider for Chit402 (`createOpenAI` with Chit baseURL).
 * Requires peer dependency `@ai-sdk/openai`.
 *
 * @example
 * ```ts
 * import { generateText } from 'ai';
 * import { createChit } from '@xfuel/adapters/ai-sdk';
 *
 * const chit = createChit();
 * const { text, response } = await generateText({
 *   model: chit('xfuel/auto'),
 *   prompt: 'Say hello in five words.',
 * });
 * // Read receipt from raw response headers or body via extractReceipt().
 * ```
 */
export async function createChit(options: CreateChitOptions = {}) {
  const config = resolveChitConfig(options);
  const { createOpenAI } = await import('@ai-sdk/openai');
  const { providerOptions = {} } = options;

  return createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    name: 'chit402',
    ...providerOptions,
  });
}

export type { ChitClientConfig, ResolveChitConfigOptions } from './config.js';
