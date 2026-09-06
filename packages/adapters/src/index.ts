export {
  DEFAULT_CHIT_API_URL,
  DEFAULT_CHIT_BASE_URL,
  DEFAULT_CHIT_DEMO_KEY,
  normalizeChitUrls,
  resolveChitConfig,
  type ChitClientConfig,
  type ResolveChitConfigOptions,
} from './config.js';

export {
  extractReceipt,
  receiptUrlFor,
  verifyUrlOf,
  withReceiptFields,
  type ExtractedReceipt,
  type ReceiptLike,
  type HeaderLike,
} from './receipt.js';

export { createChitChatOpenAI, createChitLangChain, type CreateChitChatOpenAIOptions } from './langchain.js';
export { createChit, type CreateChitOptions } from './ai-sdk.js';
export {
  ingestForeignX402ToBook,
  type IngestForeignX402Payload,
  type IngestToBookOptions,
  type IngestToBookResult,
} from './ingest.js';
