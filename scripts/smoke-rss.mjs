// Smoke test for the RSS parser: node scripts/smoke-rss.mjs
// Uses Node's native TypeScript type-stripping to import the parser directly.
const { parseFeedXml } = await import('../src/shared/lib/rss/parser.ts');

// Fixtures intentionally use non-ASCII UTF-8 strings (Finnish/Spanish) and HTML entities.
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>Uutiset ja p&auml;ivitykset</title>
  <link>https://example.org</link>
  <item>
    <guid>post-1</guid>
    <title>Månen &amp; solen</title>
    <link>https://example.org/1</link>
    <dc:creator>Aino Virtanen</dc:creator>
    <pubDate>Tue, 01 Sep 2026 10:00:00 GMT</pubDate>
    <description>Kort <b>nyheter</b></description>
    <content:encoded><![CDATA[<p>Full <em>text</em> &amp; mer</p>]]></content:encoded>
  </item>
  <item>
    <guid>post-2</guid>
    <title>Solución sencilla</title>
    <link>https://example.org/2</link>
    <pubDate>not-a-date</pubDate>
    <description>Sin contenido completo</description>
  </item>
</channel>
</rss>`;

const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Feed</title>
  <link rel="alternate" href="https://example.org"/>
  <link rel="self" href="https://example.org/feed"/>
  <entry>
    <id>urn:uuid:aaa-bbb</id>
    <title>Otsikko &lt;em&gt;merkinnällä&lt;/em&gt;</title>
    <link rel="alternate" href="https://example.org/a"/>
    <author><name>Persona</name></author>
    <updated>2026-09-02T12:00:00Z</updated>
    <summary>Resumen</summary>
    <content type="html">&lt;p&gt;Contenido&lt;/p&gt;</content>
  </entry>
</feed>`;

const rdf = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns="http://purl.org/rss/1.0/"
         xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel rdf:about="https://example.org">
    <title>RDF Feed</title>
    <link>https://example.org</link>
  </channel>
  <item>
    <title>Item &amp;amp; RDF</title>
    <link>https://example.org/rdf-1</link>
    <description>RDF item summary</description>
    <dc:date>2026-09-03T08:00:00Z</dc:date>
  </item>
</rdf:RDF>`;

let failures = 0;
function check(name, cond, actual) {
  if (cond) {
    console.log(`  OK   ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name} — actual: ${JSON.stringify(actual)}`);
  }
}

console.log('RSS 2.0:');
const a = parseFeedXml(rss);
check('feed title decoded', a.title === 'Uutiset ja päivitykset', a.title);
check('2 articles', a.articles.length === 2, a.articles.length);
check(
  'content:encoded wins',
  a.articles[0]?.contentHtml === '<p>Full <em>text</em> &amp; mer</p>',
  a.articles[0]?.contentHtml,
);
check(
  'dc:creator author',
  a.articles[0]?.author === 'Aino Virtanen',
  a.articles[0]?.author,
);
check(
  'pubDate parsed',
  a.articles[0]?.publishedAt === Date.parse('Tue, 01 Sep 2026 10:00:00 GMT'),
  a.articles[0]?.publishedAt,
);
check(
  'bad date → null',
  a.articles[1]?.publishedAt === null,
  a.articles[1]?.publishedAt,
);

console.log('Atom:');
const b = parseFeedXml(atom);
check('1 entry', b.articles.length === 1, b.articles.length);
check(
  'alternate link',
  b.articles[0]?.url === 'https://example.org/a',
  b.articles[0]?.url,
);
check('author name', b.articles[0]?.author === 'Persona', b.articles[0]?.author);
check(
  'published falls back to updated',
  b.articles[0]?.publishedAt === Date.parse('2026-09-02T12:00:00Z'),
  b.articles[0]?.publishedAt,
);

console.log('RDF / RSS 1.0:');
const c = parseFeedXml(rdf);
check('channel title', c.title === 'RDF Feed', c.title);
check('1 item', c.articles.length === 1, c.articles.length);
check(
  'item title decoded once',
  c.articles[0]?.title === 'Item &amp; RDF',
  c.articles[0]?.title,
);
check(
  'item link',
  c.articles[0]?.url === 'https://example.org/rdf-1',
  c.articles[0]?.url,
);
check(
  'dc:date parsed',
  c.articles[0]?.publishedAt === Date.parse('2026-09-03T08:00:00Z'),
  c.articles[0]?.publishedAt,
);

console.log('Garbage input:');
try {
  parseFeedXml('this is not valid xml');
  failures += 1;
  console.error('  FAIL expected parser to throw');
} catch {
  console.log('  OK   parser throws on garbage input');
}

process.exit(failures === 0 ? 0 : 1);
