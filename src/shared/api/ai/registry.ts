import { OpenAiProvider } from './adapters/openai';
import { AnthropicProvider } from './adapters/anthropic';
import { GeminiProvider } from './adapters/gemini';
import { DeepSeekProvider } from './adapters/deepseek';
import type { AiProvider, ProviderInfo } from './types';

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    docsUrl: 'https://platform.openai.com/docs',
    keyHint: 'sk-...',
    defaultModelExample: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4.1', 'o3-mini'],
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com',
    docsUrl: 'https://docs.anthropic.com',
    keyHint: 'sk-ant-...',
    defaultModelExample: 'claude-sonnet-4-5',
    models: ['claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-opus-4-5'],
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    keyHint: 'AIza...',
    defaultModelExample: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com',
    docsUrl: 'https://api-docs.deepseek.com',
    keyHint: 'sk-...',
    defaultModelExample: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
];

export function createProvider(id: string): AiProvider {
  switch (id) {
    case 'openai':
      return new OpenAiProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'gemini':
      return new GeminiProvider();
    case 'deepseek':
      return new DeepSeekProvider();
    default:
      throw new Error(`Unknown AI provider: ${id}`);
  }
}
