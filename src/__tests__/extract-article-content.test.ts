/// <reference types="jest" />
import { extractArticleContent } from '@features/fetch-article-content';

describe('extractArticleContent', () => {
  const bbcLikePage = `<!DOCTYPE html>
<html>
<head>
  <title>Example article</title>
  <style>.nav { display: none; }</style>
</head>
<body>
  <header id="site-header">Site header</header>
  <nav class="navigation">Home News Sport</nav>
  <article class="story-body">
    <div data-component="text-block">
      <p>Scientists have discovered a new way to measure ocean temperatures using
         data collected by thousands of volunteer sailors across the globe.</p>
      <p>The approach, published this week, could help researchers track climate
         change more accurately and cheaply than expensive satellite missions.</p>
    </div>
    <figure>
      <img src="https://example.org/images/ocean.jpg" alt="A sailor taking a measurement at sea">
      <figcaption>Volunteers gather data from their own boats.</figcaption>
    </figure>
    <blockquote>"This is a step change in how we understand the ocean," one researcher said.</blockquote>
    <div data-component="text-block">
      <p>Researchers say the technique is already being trialled in three regions,
         with <a href="javascript:alert(1)">more details online</a> for readers who
         want to take part in the project themselves.</p>
    </div>
  </article>
  <aside class="related">Related stories</aside>
  <footer>Footer</footer>
  <script>window.__bad = 'active';</script>
</body>
</html>`;

  test('extracts the article body and strips boilerplate', () => {
    const output = extractArticleContent(bbcLikePage);

    expect(output).not.toBeNull();

    // Article text is preserved.
    expect(output).toContain('Scientists have discovered');
    expect(output).toContain('step change in how we understand the ocean');
    expect(output).toContain('more details online');

    // Media survives with its attributes.
    expect(output).toContain('<img');
    expect(output).toContain('src="https://example.org/images/ocean.jpg"');
    expect(output).toContain('alt="A sailor taking a measurement at sea"');

    // Boilerplate and active content are gone.
    expect(output).not.toContain('Site header');
    expect(output).not.toContain('Home News Sport');
    expect(output).not.toContain('Related stories');
    expect(output).not.toContain('Footer');
    expect(output).not.toContain('window.__bad');
    expect(output).not.toContain('<script');
    expect(output).not.toContain('<style');
    expect(output).not.toContain('<nav');
    expect(output).not.toContain('<header');
    expect(output).not.toContain('<footer');
    expect(output).not.toContain('<aside');

    // Unsafe href is stripped while the link text is kept.
    expect(output).not.toContain('javascript:');
  });

  test('does not drop content inside a CamelCase "Sidebar" layout wrapper', () => {
    // "ContainerWithSidebarWrapper" is a page layout wrapper, not a sidebar;
    // it must not be removed or the whole article disappears (BBC regression).
    const page = `<!DOCTYPE html><html><body>
      <div class="ContainerWithSidebarWrapper">
        <main id="main-content">
          <article class="ArticleWrapper">
            <p>${'A real article body sentence. '.repeat(12)}</p>
          </article>
        </main>
        <aside class="sidebar">Related</aside>
      </div>
    </body></html>`;

    const output = extractArticleContent(page);

    expect(output).not.toBeNull();
    expect(output).toContain('A real article body sentence.');
    expect(output).not.toContain('Related');
  });

  test('returns null when the page has no meaningful article text', () => {
    expect(extractArticleContent('<!doctype html><html><body><div></div></body></html>')).toBeNull();
    expect(extractArticleContent('')).toBeNull();
    expect(extractArticleContent('<div><span>hi</span></div>')).toBeNull();
  });

  test('resolves lazy-loaded images from srcset using the largest candidate', () => {
    const page = `<!DOCTYPE html><html><body><article>
      <p>${'Some article text. '.repeat(12)}</p>
      <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" srcset="https://example.org/big.jpg 800w, https://example.org/small.jpg 400w" alt="Hero">
    </article></body></html>`;

    const output = extractArticleContent(page);

    expect(output).toContain('src="https://example.org/big.jpg"');
    expect(output).not.toContain('small.jpg');
    expect(output).not.toContain('data:image');
  });

  test('resolves images from data-src when src is unusable', () => {
    const page = `<!DOCTYPE html><html><body><article>
      <p>${'Some article text. '.repeat(12)}</p>
      <img data-src="https://example.org/x.jpg" alt="Lazy">
    </article></body></html>`;

    const output = extractArticleContent(page);

    expect(output).toContain('src="https://example.org/x.jpg"');
  });

  test('keeps a normal image src unchanged', () => {
    const page = `<!DOCTYPE html><html><body><article>
      <p>${'Some article text. '.repeat(12)}</p>
      <img src="https://example.org/a.jpg" alt="Normal">
    </article></body></html>`;

    const output = extractArticleContent(page);

    expect(output).toContain('src="https://example.org/a.jpg"');
  });
});
