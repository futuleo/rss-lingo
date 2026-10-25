export interface ReaderHtmlOptions {
  background: string;
  text: string;
  textMuted: string;
  scheme: 'light' | 'dark';
  topPadding: number;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  justify: boolean;
}

/**
 * Builds the standalone reader document from feed-provided (untrusted)
 * content. The content is rendered with JavaScript disabled, so typography
 * lives entirely in this style block and changes only when the reader
 * settings change.
 */
export function buildReaderHtml(content: string, options: ReaderHtmlOptions): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3" />
<style>
  :root { color-scheme: ${options.scheme}; }
  html, body {
    margin: 0;
    padding: 0;
    background-color: ${options.background};
    color: ${options.text};
    font-family: ${options.fontFamily};
    font-size: ${options.fontSize}px;
    line-height: ${options.lineHeight};
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    word-wrap: break-word;
  }
  body {
    max-width: 680px;
    margin: 0 auto;
    padding: ${options.topPadding}px 18px 40px;
    text-align: ${options.justify ? 'justify' : 'left'};
  }
  h1, h2, h3 {
    line-height: 1.3;
    font-weight: 600;
    margin-top: 1.4em;
  }
  img { max-width: 100%; height: auto; border-radius: 10px; }
  a { color: ${options.text}; }
  pre, code { white-space: pre-wrap; word-wrap: break-word; }
  blockquote {
    margin: 12px 0;
    padding-left: 12px;
    border-left: 3px solid ${options.textMuted};
    color: ${options.textMuted};
  }
</style>
</head>
<body>${content}</body>
</html>`;
}
