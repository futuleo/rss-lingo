// Must be imported before `node-html-parser`: its bundled `entities` decodes a
// base64 trie via the global `atob` at module load, which Hermes/React Native
// does not provide. The shim is a no-op on Node.
import '@shared/lib/base64-polyfill';
import {
  parse,
  NodeType,
  type HTMLElement,
  type Node,
  type TextNode,
} from 'node-html-parser';

export type Segment =
  | { kind: 'text'; tag: string; text: string }
  | { kind: 'media'; html: string };

/** Tags emitted verbatim as media segments (never descended into). */
const MEDIA_TAGS = new Set([
  'img',
  'picture',
  'video',
  'audio',
  'iframe',
  'source',
  'track',
]);

/** Block tags whose full text becomes a single text segment. */
const TEXT_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'figcaption',
  'li',
  'pre',
  'dt',
  'dd',
  'td',
  'th',
]);

function isTextNode(node: Node): node is TextNode {
  return node.nodeType === NodeType.TEXT_NODE;
}

function isElementNode(node: Node): node is HTMLElement {
  return node.nodeType === NodeType.ELEMENT_NODE;
}

function tagName(node: HTMLElement): string {
  return node.tagName.toLowerCase();
}

function hasDescendant(node: HTMLElement, tag: string): boolean {
  for (const child of node.childNodes) {
    if (isElementNode(child) && (tagName(child) === tag || hasDescendant(child, tag))) {
      return true;
    }
  }
  return false;
}

function walk(node: Node, segments: Segment[]): void {
  if (isTextNode(node)) {
    const text = node.text.trim();
    if (text.length > 0) {
      segments.push({ kind: 'text', tag: 'p', text });
    }
    return;
  }

  if (!isElementNode(node)) {
    return;
  }

  const name = tagName(node);

  if (MEDIA_TAGS.has(name)) {
    segments.push({ kind: 'media', html: node.toString() });
    return;
  }

  // A captionless `<figure>` is purely a media wrapper, so preserve it whole.
  // When it carries a `<figcaption>`, fall through and recurse so the caption
  // is extracted as a translatable text segment.
  if (name === 'figure' && !hasDescendant(node, 'figcaption')) {
    segments.push({ kind: 'media', html: node.toString() });
    return;
  }

  if (TEXT_TAGS.has(name)) {
    const text = node.text.trim();
    if (text.length > 0) {
      segments.push({ kind: 'text', tag: name, text });
    }
    return;
  }

  for (const child of node.childNodes) {
    walk(child, segments);
  }
}

/**
 * Splits article HTML into ordered text and media segments.
 *
 * Text segments (paragraphs, headings, captions, …) are translated, while
 * media segments (images, figures, video, …) are preserved verbatim. Inline
 * markup inside a block is collapsed into that block's single text segment.
 */
export function segmentize(html: string): Segment[] {
  const root = parse(html);
  const segments: Segment[] = [];
  for (const child of root.childNodes) {
    walk(child, segments);
  }
  return segments;
}
