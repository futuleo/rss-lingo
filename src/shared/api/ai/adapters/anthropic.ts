import type { AiProvider, TranslateParams } from '../types';
import { assertHttpsEndpoint, assertObjectResponse } from './helpers';

function buildPrompt(text: string, targetLang: string): string {
  return `Translate the following text to ${targetLang}. Return ONLY the translation, preserving paragraph breaks.\n\n${text}`;
}

function mapError(status: number): Error {
  if (status === 401 || status === 403) {
    return new Error('Invalid API key');
  }
  if (status === 429) {
    return new Error('Rate limited');
  }
  return new Error(`Provider request failed: HTTP ${status}`);
}

interface AnthropicContentBlock {
  type?: string;
  text?: unknown;
}

export class AnthropicProvider implements AiProvider {
  readonly id = 'anthropic';

  async translate({
    text,
    targetLang,
    apiKey,
    model,
    baseUrl,
    signal,
  }: TranslateParams): Promise<string> {
    const url = `${assertHttpsEndpoint(baseUrl, 'https://api.anthropic.com')}/v1/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8000,
        messages: [{ role: 'user', content: buildPrompt(text, targetLang) }],
      }),
      signal,
    });

    if (!response.ok) {
      throw mapError(response.status);
    }

    const data = await response.json();
    assertObjectResponse(data, 'Anthropic');
    const typedData = data as {
      content?: AnthropicContentBlock[];
    };
    const blocks = typedData.content;
    if (!Array.isArray(blocks) || blocks.length === 0) {
      throw new Error('Unexpected Anthropic response');
    }

    const translated = blocks
      .map((block) => (typeof block.text === 'string' ? block.text : ''))
      .join('');
    if (translated.length === 0) {
      throw new Error('Unexpected Anthropic response');
    }
    return translated.trim();
  }
}
