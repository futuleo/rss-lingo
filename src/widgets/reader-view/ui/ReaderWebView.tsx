import { useMemo } from 'react';
import {
  Linking,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
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
    scheme: 'light' | 'dark';
    topPadding: number;
  },
): string {
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
    font-family: Georgia, 'Iowan Old Style', 'Times New Roman', serif;
    font-size: 18px;
    line-height: 1.7;
    -webkit-text-size-adjust: 100%;
    word-wrap: break-word;
  }
  body {
    max-width: 680px;
    margin: 0 auto;
    padding: ${options.topPadding}px 18px 40px;
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

export interface ReaderWebViewProps {
  article: Article;
  htmlOverride?: string;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /**
   * Extra top padding (in CSS px) reserved for an overlaid header. The
   * article text starts below the header instead of behind it.
   */
  topPadding?: number;
}

export function ReaderWebView({
  article,
  htmlOverride,
  onScroll,
  topPadding = 20,
}: ReaderWebViewProps) {
  const theme = useTheme();

  const content = htmlOverride ?? article.contentHtml ?? '';

  const readerHtml = useMemo(() => {
    return buildReaderHtml(content, {
      background: theme.colors.background,
      text: theme.colors.text,
      textMuted: theme.colors.textMuted,
      scheme: theme.scheme,
      topPadding,
    });
  }, [content, theme, topPadding]);

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
      onScroll={onScroll}
      scrollEventThrottle={16}
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
