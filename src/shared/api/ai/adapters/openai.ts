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

export class OpenAiProvider implements AiProvider {
  readonly id = 'openai';

  async translate({
    text,
    targetLang,
    apiKey,
    model,
    baseUrl,
    signal,
  }: TranslateParams): Promise<string> {
    const url = `${baseUrl ?? 'https://api.openai.com/v1'}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: buildPrompt(text, targetLang) }],
        temperature: 0,
      }),
      signal,
    });

    if (!response.ok) {
      throw mapError(response.status);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Unexpected OpenAI response');
    }
    return content.trim();
  }
}
