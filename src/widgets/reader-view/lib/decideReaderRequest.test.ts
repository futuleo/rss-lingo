/// <reference types="jest" />
import { decideReaderRequest } from './decideReaderRequest';

describe('decideReaderRequest', () => {
  test('allows the injected about: document', () => {
    expect(decideReaderRequest('about:blank', null)).toBe('allow');
    expect(decideReaderRequest('about:srcdoc', null)).toBe('allow');
  });

  test('allows the reader own http(s) document on exact match', () => {
    expect(
      decideReaderRequest('https://example.org/article', 'https://example.org/article'),
    ).toBe('allow');
  });

  test('allows a self load whose request URL is percent-encoded and punycoded', () => {
    const rawArticleUrl = 'https://münich.example/путь/café';
    const encodedRequestUrl = new URL(rawArticleUrl).href;
    expect(decideReaderRequest(encodedRequestUrl, rawArticleUrl)).toBe('allow');
  });

  test('opens https links externally', () => {
    expect(decideReaderRequest('https://example.org/other', 'https://example.org/article')).toBe(
      'external',
    );
  });

  test('opens http links externally', () => {
    expect(decideReaderRequest('http://example.org/other', 'https://example.org/article')).toBe(
      'external',
    );
  });

  test('blocks file URLs', () => {
    expect(decideReaderRequest('file:///etc/passwd', 'https://example.org/article')).toBe(
      'block',
    );
  });

  test('blocks javascript URLs', () => {
    expect(decideReaderRequest('javascript:alert(1)', 'https://example.org/article')).toBe(
      'block',
    );
  });

  test('blocks data URLs', () => {
    expect(decideReaderRequest('data:text/html,<script>alert(1)</script>', 'https://example.org/article')).toBe(
      'block',
    );
  });

  test('blocks intent URLs', () => {
    expect(
      decideReaderRequest('intent://scan/#Intent;scheme=zxing;end', 'https://example.org/article'),
    ).toBe('block');
  });

  test('blocks custom schemes', () => {
    expect(decideReaderRequest('myapp://x', 'https://example.org/article')).toBe('block');
  });

  test('opens http(s) externally when there is no article URL', () => {
    expect(decideReaderRequest('https://example.org/other', null)).toBe('external');
  });

  test('does not treat a non-http article URL as the reader own document', () => {
    expect(decideReaderRequest('https://example.org/other', 'javascript:alert(1)')).toBe(
      'external',
    );
  });
});
