/// <reference types="jest" />
import { parseFeedXml } from '@shared/lib/rss/parser';

describe('RSS parser invariants', () => {
  test('double-escaped entities decode exactly once', () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Feed</title>
    <link>https://example.org</link>
    <item>
      <guid>double-escaped</guid>
      <title>&amp;lt;escaped&amp;gt;</title>
      <description>&amp;lt;p&amp;gt;raw html&amp;lt;/p&amp;gt;</description>
    </item>
  </channel>
</rss>`;

    const parsed = parseFeedXml(xml);
    expect(parsed.articles).toHaveLength(1);
    expect(parsed.articles[0]!.title).toBe('&lt;escaped&gt;');
    // Content HTML must stay raw: fast-xml-parser's entity decoding is
    // disabled, so the original double-escaped text is preserved.
    expect(parsed.articles[0]!.contentHtml).toBe(
      '&amp;lt;p&amp;gt;raw html&amp;lt;/p&amp;gt;',
    );
  });

  test('parses RSS 1.0 / RDF feeds', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns="http://purl.org/rss/1.0/"
         xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel rdf:about="https://example.org">
    <title>RDF Feed</title>
    <link>https://example.org</link>
  </channel>
  <item>
    <title>RDF Item</title>
    <link>https://example.org/item</link>
    <dc:date>2026-09-03T08:00:00Z</dc:date>
  </item>
</rdf:RDF>`;

    const parsed = parseFeedXml(xml);
    expect(parsed.title).toBe('RDF Feed');
    expect(parsed.siteUrl).toBe('https://example.org');
    expect(parsed.articles).toHaveLength(1);
    expect(parsed.articles[0]!.title).toBe('RDF Item');
    expect(parsed.articles[0]!.url).toBe('https://example.org/item');
    expect(parsed.articles[0]!.publishedAt).toBe(Date.parse('2026-09-03T08:00:00Z'));
  });

  test('throws on garbage input', () => {
    expect(() => parseFeedXml('this is not valid xml')).toThrow();
  });
});
