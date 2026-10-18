const BLOCK_TAG_RE =
  /(<\/?(?:p|div|h[1-6]|li|blockquote)(?:\s[^>]*)?>|<br(?:\s[^>]*)?>)/gi;

/**
 * Splits article HTML into block-level segments, then greedily merges
 * adjacent segments so every chunk is at most `maxChars` long.
 * A single oversized segment becomes its own chunk.
 */
export function splitIntoChunks(html: string, maxChars = 2000): string[] {
  const segments: string[] = [];
  let current = '';
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = BLOCK_TAG_RE.exec(html)) !== null) {
    current += html.slice(lastIndex, match.index) + match[0];
    if (/^<\//.test(match[0]) || /^<br\b/i.test(match[0])) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        segments.push(trimmed);
      }
      current = '';
    }
    lastIndex = BLOCK_TAG_RE.lastIndex;
  }

  const tail = html.slice(lastIndex);
  const final = (current + tail).trim();
  if (final.length > 0) {
    segments.push(final);
  }

  const chunks: string[] = [];
  let buffer = '';
  for (const segment of segments) {
    if (buffer.length > 0 && buffer.length + segment.length > maxChars) {
      chunks.push(buffer);
      buffer = segment;
    } else {
      buffer += segment;
    }
  }
  if (buffer.length > 0) {
    chunks.push(buffer);
  }

  return chunks;
}
