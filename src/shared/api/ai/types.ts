export interface TranslateParams {
  text: string;
  targetLang: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
  signal?: AbortSignal;
}

export interface AiProvider {
  id: string;
  translate(params: TranslateParams): Promise<string>;
}

export interface ProviderInfo {
  id: string;
  label: string;
  defaultBaseUrl: string;
  docsUrl: string;
  keyHint: string;
  defaultModelExample: string;
}
