import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import {
  DEFAULT_CHIT_API_URL,
  DEFAULT_CHIT_BASE_URL,
  DEFAULT_CHIT_DEMO_KEY,
  normalizeChitUrls,
  resolveChitConfig,
} from '../config.js';

describe('resolveChitConfig', () => {
  it('defaults to api.chit402.com demo key', () => {
    const config = resolveChitConfig();
    assert.equal(config.baseURL, DEFAULT_CHIT_BASE_URL);
    assert.equal(config.apiUrl, DEFAULT_CHIT_API_URL);
    assert.equal(config.apiKey, DEFAULT_CHIT_DEMO_KEY);
  });

  it('normalizes /v1 baseURL input', () => {
    const config = resolveChitConfig({
      baseURL: 'https://api.chit402.com/v1',
      apiKey: 'partner-key',
    });
    assert.equal(config.baseURL, 'https://api.chit402.com/v1');
    assert.equal(config.apiUrl, 'https://api.chit402.com');
    assert.equal(config.apiKey, 'partner-key');
  });

  it('normalizeChitUrls accepts gateway origin', () => {
    const urls = normalizeChitUrls('https://api.chit402.com');
    assert.deepEqual(urls, {
      apiUrl: 'https://api.chit402.com',
      baseURL: 'https://api.chit402.com/v1',
    });
  });
});

describe('createChitChatOpenAI config shape', () => {
  it('builds LangChain configuration without network', async () => {
    const config = resolveChitConfig({ apiKey: 'test-key' });
    assert.equal(config.baseURL.endsWith('/v1'), true);

    const expectedShape = {
      model: 'xfuel/auto',
      apiKey: 'test-key',
      configuration: { baseURL: config.baseURL },
    };

    assert.deepEqual(expectedShape.configuration.baseURL, DEFAULT_CHIT_BASE_URL);
    assert.equal(expectedShape.apiKey, 'test-key');
  });
});

describe('createChit provider config shape', () => {
  it('builds AI SDK provider settings without network', () => {
    const config = resolveChitConfig();
    const providerConfig = {
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      name: 'chit402',
    };
    assert.equal(providerConfig.baseURL, DEFAULT_CHIT_BASE_URL);
    assert.equal(providerConfig.name, 'chit402');
  });
});

describe('fixture receipt JSON', () => {
  const fixturePath = join(
    dirname(fileURLToPath(import.meta.url)),
    'fixtures',
    'chat-receipt.json',
  );
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));

  it('includes nested xfuel receipt fields', () => {
    assert.ok(fixture.xfuel?.task_id);
    assert.ok(fixture.xfuel?.verify_url);
    assert.equal(fixture.xfuel.hub, 'akash');
  });
});
