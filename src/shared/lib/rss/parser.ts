import { XMLParser } from 'fast-xml-parser';
import type { ParsedArticle, ParsedFeed } from './types';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
});

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' ? (value as UnknownRecord) : null;
}

/**
 * fast-xml-parser collapses single-item arrays; normalize both shapes.
 */
function asArray<T>(value: unknown): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? (value as T[]) : [value as T];
}

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number') return String(value);
  const record = asRecord(value);
  if (record && typeof record['#text'] === 'string') {
    return record['#text'].trim() || null;
  }
  return null;
}

function asLink(item: UnknownRecord): string | null {
  const rawLink = item['link'];
  if (typeof rawLink === 'string' && rawLink.trim() !== '') {
    return rawLink.trim();
  }
  const links = asArray<UnknownRecord>(asRecord(rawLink));
  // Atom: prefer rel="alternate" (or missing rel), which is the article URL.
  for (const link of links) {
    const rel = link['@_rel'];
    const href = asText(link['@_href']);
    if (href && (rel === undefined || rel === 'alternate')) return href;
  }
  for (const link of links) {
    const href = asText(link['@_href']);
    if (href) return href;
  }
  return null;
}

function toDateMs(value: unknown): number | null {
  const text = asText(value);
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : parsed;
}

/** djb2-based fallback identity for items without guid/link. */
function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return `hash:${(hash >>> 0).toString(16)}`;
}

function parseRssItem(item: UnknownRecord): ParsedArticle | null {
  const title = asText(item['title']);
  const guid =
    asText(item['guid']) ?? asLink(item) ?? (title ? hashString(title) : null);
  if (!guid) return null;

  return {
    guid,
    url: asLink(item),
    title: title ?? guid,
    author: asText(item['dc:creator']) ?? asText(item['author']),
    summary: asText(item['description']),
    contentHtml: asText(item['content:encoded']) ?? asText(item['description']),
    publishedAt:
      toDateMs(item['pubDate']) ??
      toDateMs(item['dc:date']) ??
      toDateMs(item['published']),
  };
}

function parseAtomEntry(entry: UnknownRecord): ParsedArticle | null {
  const title = asText(entry['title']);
  const id = asText(entry['id']) ?? asLink(entry) ?? (title ? hashString(title) : null);
  if (!id) return null;

  return {
    guid: id,
    url: asLink(entry),
    title: title ?? id,
    author: asText(asRecord(entry['author'])?.['name']),
    summary: asText(entry['summary']),
    contentHtml: asText(entry['content']) ?? asText(entry['summary']),
    publishedAt:
      toDateMs(entry['published']) ??
      toDateMs(entry['updated']) ??
      toDateMs(entry['issued']),
  };
}

/**
 * Parses RSS 2.0 / RDF / Atom XML into the normalized {@link ParsedFeed}.
 * Throws when the payload is neither RSS nor Atom.
 */
export function parseFeedXml(xml: string): ParsedFeed {
  const doc = asRecord(xmlParser.parse(xml));
  if (!doc) {
    throw new Error('RSS parse error: document is empty');
  }

  const rss = asRecord(doc['rss']);
  const channel = rss ? asRecord(rss['channel']) : null;
  if (channel) {
    const articles = asArray(channel['item'])
      .map((item) => parseRssItem(asRecord(item) ?? {}))
      .filter((a): a is ParsedArticle => a !== null);
    return {
      title: asText(channel['title']),
      siteUrl: asText(channel['link']),
      articles,
    };
  }

  const rdf = asRecord(doc['rdf:RDF']);
  if (rdf) {
    // RSS 1.0 / RDF: items live at the top level, channel holds metadata.
    const channel = asRecord(rdf['channel']);
    const items = [...asArray(rdf['item'])];
    const articles = items
      .map((item) => parseRssItem(asRecord(item) ?? {}))
      .filter((a): a is ParsedArticle => a !== null);
    return {
      title: channel ? asText(channel['title']) : null,
      siteUrl: channel ? asText(channel['link']) : null,
      articles,
    };
  }

  const atom = asRecord(doc['feed']);
  if (atom) {
    const articles = asArray(atom['entry'])
      .map((entry) => parseAtomEntry(asRecord(entry) ?? {}))
      .filter((a): a is ParsedArticle => a !== null);
    return {
      title: asText(atom['title']),
      siteUrl: asLink(atom),
      articles,
    };
  }

  throw new Error('RSS parse error: unsupported feed format');
}

/** Fetches and parses a feed. Caller is responsible for error handling. */
export async function fetchAndParseFeed(url: string): Promise<ParsedFeed> {
  const response = await fetch(url, {
    headers: {
      Accept:
        'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
  });
  if (!response.ok) {
    throw new Error(`Feed request failed: HTTP ${response.status} (${url})`);
  }
  return parseFeedXml(await response.text());
}
