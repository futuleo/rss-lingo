/**
 * Minimal `atob`/`btoa` shims for runtimes that lack them (React Native /
 * Hermes). `node-html-parser` bundles `entities`, which decodes a base64 trie
 * via the global `atob` at module-load time; without this shim the module
 * throws `ReferenceError: atob is not defined` on-device.
 *
 * The shim is a no-op when a native implementation already exists (e.g. Node).
 */

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodes base64 into a "binary string" (each char is a byte, 0-255). */
function base64DecodeToBinary(input: string): string {
  const clean = input.replace(/[\t\n\f\r ]/g, '').replace(/=+$/, '');
  if (clean.length % 4 === 1) {
    throw new Error('Invalid base64 input');
  }

  let output = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i += 1) {
    const value = BASE64_ALPHABET.indexOf(clean[i]);
    if (value === -1) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

/** Encodes a "binary string" (each char is a byte, 0-255) into base64. */
function binaryEncodeToBase64(input: string): string {
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < input.length; i += 1) {
    buffer = (buffer << 8) | (input.charCodeAt(i) & 0xff);
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      output += BASE64_ALPHABET[(buffer >> bits) & 0x3f];
    }
  }
  if (bits > 0) {
    output += BASE64_ALPHABET[(buffer << (6 - bits)) & 0x3f];
  }
  while (output.length % 4 !== 0) {
    output += '=';
  }
  return output;
}

if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = base64DecodeToBinary;
}
if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = binaryEncodeToBase64;
}

export { base64DecodeToBinary, binaryEncodeToBase64 };
