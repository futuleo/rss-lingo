/// <reference types="jest" />
import { segmentize } from '@features/translate-article';

describe('segmentize', () => {
  test('turns paragraphs into text segments', () => {
    const segments = segmentize('<p>First</p><p>Second</p>');

    expect(segments).toEqual([
      { kind: 'text', tag: 'p', text: 'First' },
      { kind: 'text', tag: 'p', text: 'Second' },
    ]);
  });

  test('preserves img and figure as media segments', () => {
    const segments = segmentize(
      '<p>Intro</p><img src="https://example.org/a.jpg" alt="Pic">' +
        '<figure><img src="https://example.org/b.jpg"></figure>',
    );

    expect(segments).toEqual([
      { kind: 'text', tag: 'p', text: 'Intro' },
      { kind: 'media', html: '<img src="https://example.org/a.jpg" alt="Pic">' },
      { kind: 'media', html: '<figure><img src="https://example.org/b.jpg"></figure>' },
    ]);
  });

  test('keeps figcaption as a text segment so it is translated', () => {
    const segments = segmentize(
      '<figure><img src="https://example.org/x.jpg"><figcaption>The caption</figcaption></figure>',
    );

    expect(segments).toEqual([
      { kind: 'media', html: '<img src="https://example.org/x.jpg">' },
      { kind: 'text', tag: 'figcaption', text: 'The caption' },
    ]);
  });

  test('collapses inline markup inside a paragraph to one text segment', () => {
    const segments = segmentize(
      '<p>Hello <a href="https://example.org">world</a></p>',
    );

    expect(segments).toEqual([
      { kind: 'text', tag: 'p', text: 'Hello world' },
    ]);
  });

  test('preserves order across mixed text and media', () => {
    const segments = segmentize(
      '<h2>Title</h2><p>Body</p><img src="https://example.org/m.jpg">' +
        '<blockquote>Quote</blockquote><p>End</p>',
    );

    expect(segments.map((segment) => segment.kind)).toEqual([
      'text',
      'text',
      'media',
      'text',
      'text',
    ]);
  });
});
