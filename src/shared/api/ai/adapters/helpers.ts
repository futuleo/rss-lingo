export function assertHttpsEndpoint(
  baseUrl: string | undefined,
  defaultUrl: string,
): string {
  const effectiveUrl = baseUrl?.trim() || defaultUrl;
  const parsed = new URL(effectiveUrl);
  if (parsed.protocol !== 'https:') {
    throw new Error('Insecure endpoint: only https:// is allowed');
  }
  return effectiveUrl;
}

export function assertObjectResponse(
  data: unknown,
  providerName: string,
): asserts data is Record<string, unknown> {
  if (typeof data !== 'object' || data === null) {
    throw new Error(`Unexpected ${providerName} response`);
  }
}
