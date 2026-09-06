import { resolveChitConfig, type ResolveChitConfigOptions } from './config.js';

export interface CreateChitChatOpenAIOptions extends ResolveChitConfigOptions {
  /** LangChain model id (Chit catalog id, e.g. xfuel/auto). */
  model?: string;
  /** Extra ChatOpenAI constructor fields (temperature, maxTokens, …). */
  chatOptions?: Record<string, unknown>;
}

/**
 * Factory for LangChain `ChatOpenAI` pointed at Chit402.
 * Requires peer dependency `@langchain/openai`.
 */
export async function createChitChatOpenAI(options: CreateChitChatOpenAIOptions = {}) {
  const config = resolveChitConfig(options);
  const { ChatOpenAI } = await import('@langchain/openai');

  const { model = 'xfuel/auto', chatOptions = {} } = options;

  return new ChatOpenAI({
    model,
    apiKey: config.apiKey,
    configuration: {
      baseURL: config.baseURL,
    },
    ...chatOptions,
  });
}

/** @deprecated Prefer `createChitChatOpenAI`. */
export const createChitLangChain = createChitChatOpenAI;

export type { ChitClientConfig, ResolveChitConfigOptions } from './config.js';
