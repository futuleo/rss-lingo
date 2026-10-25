import { useMemo } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@shared/theme';
import type { Article } from '@entities/article';
import { decideReaderRequest } from '../lib/decideReaderRequest';

function buildReaderHtml(
  content: string,
  options: {
    background: string;
    text: string;
    textMuted: string;
  },
): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3" />
<style>
  :root { color-scheme: light dark; }
  html, body {
    margin: 0;
    padding: 0;
    background-color: ${options.background};
    color: ${options.text};
    font-size: 17px;
    line-height: 1.6;
    -webkit-text-size-adjust: 100%;
    word-wrap: break-word;
  }
  body { padding: 16px; }
  img { max-width: 100%; height: auto; border-radius: 8px; }
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

export interface ReaderWebViewProps {
  article: Article;
  htmlOverride?: string;
}

export function ReaderWebView({ article, htmlOverride }: ReaderWebViewProps) {
  const theme = useTheme();

  const content = htmlOverride ?? article.contentHtml ?? '';

  const readerHtml = useMemo(() => {
    return buildReaderHtml(content, {
      background: theme.colors.background,
      text: theme.colors.text,
      textMuted: theme.colors.textMuted,
    });
  }, [content, theme]);

  // Restrict the base URL to http(s) so a feed-controlled file:, data:,
  // javascript:, or custom-scheme URL can never become the reader's own
  // in-app document.
  const baseUrl = useMemo(
    () =>
      article.url != null && /^https?:\/\//i.test(article.url)
        ? article.url
        : undefined,
    [article.url],
  );

  if (!content) {
    return null;
  }

  return (
    <WebView
      source={{ html: readerHtml, baseUrl }}
      style={[
        styles.webview,
        {
          backgroundColor: theme.colors.background,
          borderRadius: theme.radii.m,
        },
      ]}
      javaScriptEnabled={false}
      domStorageEnabled={false}
      onShouldStartLoadWithRequest={(request) => {
        // Feed-controlled HTML is untrusted and runs with JavaScript
        // disabled, so keep the reader's own document in-app, open genuine
        // http(s) link taps in the system browser, and block every other
        // scheme from loading at all.
        const decision = decideReaderRequest(request.url, article.url);
        if (decision === 'allow') {
          return true;
        }
        if (decision === 'external') {
          void Linking.openURL(request.url);
        }
        return false;
      }}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
  },
});
