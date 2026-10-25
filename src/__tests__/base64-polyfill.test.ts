/// <reference types="jest" />
import {
  base64DecodeToBinary,
  binaryEncodeToBase64,
} from '@features/fetch-article-content';

describe('base64 polyfill', () => {
  test('decodes standard base64 into a binary string', () => {
    expect(base64DecodeToBinary('TWFu')).toBe('Man');
    expect(base64DecodeToBinary('TWE=')).toBe('Ma');
    expect(base64DecodeToBinary('TQ==')).toBe('M');
    expect(base64DecodeToBinary('')).toBe('');
  });

  test('encodes a binary string into base64', () => {
    expect(binaryEncodeToBase64('Man')).toBe('TWFu');
    expect(binaryEncodeToBase64('Ma')).toBe('TWE=');
    expect(binaryEncodeToBase64('M')).toBe('TQ==');
    expect(binaryEncodeToBase64('')).toBe('');
  });

  test('round-trips arbitrary byte strings', () => {
    const bytes = Array.from({ length: 256 }, (_, i) =>
      String.fromCharCode(i),
    ).join('');
    expect(base64DecodeToBinary(binaryEncodeToBase64(bytes))).toBe(bytes);
  });

  test('installs globalThis.atob/btoa when missing', () => {
    expect(typeof globalThis.atob).toBe('function');
    expect(typeof globalThis.btoa).toBe('function');
    expect(globalThis.atob('TWFu')).toBe('Man');
  });
});
