// Must be imported before `node-html-parser`: its bundled `entities` decodes a
// base64 trie via the global `atob` at module load, which Hermes/React Native
// does not provide. The shim below defines it (no-op on Node).
import '../lib/base64-polyfill';
import {
  parse,
  NodeType,
  type HTMLElement,
  type Node,
  type TextNode,
} from 'node-html-parser';

/**
 * Boilerplate extraction: turns a raw article page into the cleaned HTML of
 * its main body. The output is rendered later by the `ReaderWebView` (with
 * JavaScript disabled and a strict URL-scheme guard), but stripping scripts,
 * event handlers and iframes here is still required so active content is
 * never persisted.
 */

/** Tags that never belong to article body text. */
const BOILERPLATE_TAGS = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'iframe',
  'svg',
  'nav',
  'header',
  'footer',
  'aside',
  'form',
  'button',
  'select',
  'textarea',
  'input',
  'canvas',
  'video',
  'audio',
]);

/** ARIA roles that mark chrome rather than article content. */
const BOILERPLATE_ROLES = new Set([
  'navigation',
  'banner',
  'complementary',
  'contentinfo',
  'search',
]);

/** id/class fragments that signal non-content boilerplate. */
const BOILERPLATE_PATTERN =
  /comment|advert|ad-|_ad|ads|share|social|related|sidebar|promo|subscribe|newsletter|breadcrumb|cookie|consent|outbrain|taboola|sponsor|pagination|menu|footer|header|nav/i;

/** Tags preserved verbatim in the cleaned output. */
const CONTENT_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'figure',
  'figcaption',
  'pre',
  'code',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'span',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]);

/** Void content tags must be emitted without a closing tag. */
const VOID_CONTENT_TAGS = new Set(['img', 'br']);

/** Minimum visible text (characters) required to consider content meaningful. */
const MIN_VISIBLE_TEXT_LENGTH = 100;

/** Bonus points per direct-child paragraph when scoring body candidates. */
const PARAGRAPH_BONUS = 20;

function tagName(node: HTMLElement): string {
  return node.tagName.toLowerCase();
}

function isTextNode(node: Node): node is TextNode {
  return node.nodeType === NodeType.TEXT_NODE;
}

function isElementNode(node: Node): node is HTMLElement {
  return node.nodeType === NodeType.ELEMENT_NODE;
}

/** Sum of trimmed text lengths across the subtree, ignoring markup. */
function visibleTextLength(node: Node): number {
  if (isTextNode(node)) {
    return node.text.trim().length;
  }
  if (!isElementNode(node)) {
    return 0;
  }
  let total = 0;
  for (const child of node.childNodes) {
    total += visibleTextLength(child);
  }
  return total;
}

function isBoilerplate(node: HTMLElement): boolean {
  if (BOILERPLATE_TAGS.has(tagName(node))) {
    return true;
  }
  const role = node.getAttribute('role');
  if (role && BOILERPLATE_ROLES.has(role.trim().toLowerCase())) {
    return true;
  }
  const id = node.getAttribute('id') ?? '';
  const cls = node.getAttribute('class') ?? '';
  return BOILERPLATE_PATTERN.test(`${id} ${cls}`);
}

/** Removes boilerplate nodes in place (post-order, children first). */
function removeBoilerplate(node: HTMLElement): void {
  for (const child of [...node.childNodes]) {
    if (isElementNode(child)) {
      if (isBoilerplate(child)) {
        child.remove();
      } else {
        removeBoilerplate(child);
      }
    }
  }
}

/**
 * Scores a candidate container: sum of direct-child `<p>` text lengths plus a
 * small bonus per `<p>`, minus a link-density penalty.
 */
function paragraphScore(node: HTMLElement): number {
  let score = 0;
  let totalText = 0;
  let linkText = 0;
  for (const child of node.children) {
    if (tagName(child) !== 'p') {
      continue;
    }
    const textLength = child.text.trim().length;
    score += textLength + PARAGRAPH_BONUS;
    totalText += textLength;
    for (const link of child.querySelectorAll('a')) {
      linkText += link.text.trim().length;
    }
  }
  if (totalText > 0) {
    const density = linkText / totalText;
    if (density > 0.5) {
      score -= Math.round(totalText * (density - 0.5) * 2);
    }
  }
  return score;
}

/**
 * Picks the node that most likely holds the article body:
 * first `<article>` with substantial text, then `<main>`, then
 * `[itemprop="articleBody"]`, then the highest-scoring container, then `body`.
 */
function chooseCandidate(root: HTMLElement): HTMLElement {
  for (const article of root.querySelectorAll('article')) {
    if (visibleTextLength(article) >= MIN_VISIBLE_TEXT_LENGTH) {
      return article;
    }
  }

  const main = root.querySelector('main');
  if (main) {
    return main;
  }

  const articleBody = root.querySelector('[itemprop="articleBody"]');
  if (articleBody) {
    return articleBody;
  }

  let best: HTMLElement | null = null;
  let bestScore = 0;
  for (const node of root.querySelectorAll('div, section, article, main, td')) {
    const score = paragraphScore(node);
    if (score > bestScore) {
      best = node;
      bestScore = score;
    }
  }
  if (best) {
    return best;
  }

  return root.querySelector('body') ?? root;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Keeps only http/https hrefs; otherwise the attribute is dropped. */
function sanitizeHref(href: string | undefined): string | null {
  if (!href) {
    return null;
  }
  const trimmed = href.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

/**
 * Keeps http/https and relative (scheme-less) image sources, which resolve
 * against the article base URL; drops `data:`, `file:`, `javascript:` and
 * custom schemes.
 */
function sanitizeSrc(src: string | undefined): string | null {
  if (!src) {
    return null;
  }
  const trimmed = src.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return trimmed;
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

/** Whether a content element should be kept: has text or media. */
function hasRenderedContent(inner: string, node: HTMLElement): boolean {
  if (inner.includes('<img') || inner.includes('<br')) {
    return true;
  }
  return visibleTextLength(node) > 0;
}

/**
 * Serializes a subtree to clean HTML: only content tags are kept (others are
 * flattened), only `a[href]` / `img[src][alt]` attributes survive, and empty
 * elements are dropped.
 */
function serializeClean(node: Node): string {
  if (isTextNode(node)) {
    // Drop whitespace-only text nodes; keep everything else verbatim.
    return node.rawText.trim().length === 0 ? '' : node.rawText;
  }
  if (!isElementNode(node)) {
    return '';
  }

  const name = tagName(node);
  if (!CONTENT_TAGS.has(name)) {
    // Non-content wrapper (div, article, section, main, td, …): flatten.
    return node.childNodes.map(serializeClean).join('');
  }

  let attributes = '';
  if (name === 'a') {
    const href = sanitizeHref(node.getAttribute('href'));
    if (href) {
      attributes += ` href="${escapeAttribute(href)}"`;
    }
  } else if (name === 'img') {
    const src = sanitizeSrc(node.getAttribute('src'));
    const alt = node.getAttribute('alt');
    if (src) {
      attributes += ` src="${escapeAttribute(src)}"`;
    }
    if (alt !== undefined) {
      attributes += ` alt="${escapeAttribute(alt)}"`;
    }
  }

  const inner = node.childNodes.map(serializeClean).join('');

  // Void content tags (img/br) are media/breaks: always keep them.
  if (VOID_CONTENT_TAGS.has(name)) {
    return `<${name}${attributes}>`;
  }

  if (!hasRenderedContent(inner, node)) {
    return '';
  }

  return `<${name}${attributes}>${inner}</${name}>`;
}

/**
 * Extracts the main article text from a raw HTML page as clean HTML, or
 * returns `null` when no meaningful content could be found.
 */
export function extractArticleContent(html: string): string | null {
  let root: HTMLElement;
  try {
    root = parse(html);
  } catch {
    return null;
  }

  removeBoilerplate(root);

  const candidate = chooseCandidate(root);
  if (visibleTextLength(candidate) < MIN_VISIBLE_TEXT_LENGTH) {
    return null;
  }

  const cleaned = serializeClean(candidate).trim();
  return cleaned.length === 0 ? null : cleaned;
}
