import type { AiProvider, TranslateParams } from '../types';

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

interface GeminiPart {
  text?: unknown;
}

export class GeminiProvider implements AiProvider {
  readonly id = 'gemini';

  async translate({
    text,
    targetLang,
    apiKey,
    model,
    baseUrl,
    signal,
  }: TranslateParams): Promise<string> {
    const base =
      baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta';
    const url = `${base}/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildPrompt(text, targetLang) }],
          },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      throw mapError(response.status);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
    };
    const parts = data.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts) || parts.length === 0) {
      throw new Error('Unexpected Gemini response');
    }

    const translated = parts
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('');
    if (translated.length === 0) {
      throw new Error('Unexpected Gemini response');
    }
    return translated.trim();
  }
}
