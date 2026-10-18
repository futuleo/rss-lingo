import { useMemo } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@shared/theme';
import type { Article } from '@entities/article';

function buildReaderHtml(
  article: Article,
  options: {
    background: string;
    text: string;
    textMuted: string;
  },
): string {
  const content = article.contentHtml ?? '';
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
}

export function ReaderWebView({ article }: ReaderWebViewProps) {
  const theme = useTheme();

  const readerHtml = useMemo(() => {
    return buildReaderHtml(article, {
      background: theme.colors.background,
      text: theme.colors.text,
      textMuted: theme.colors.textMuted,
    });
  }, [article, theme]);

  if (!article.contentHtml) {
    return null;
  }

  return (
    <WebView
      source={{ html: readerHtml, baseUrl: article.url ?? undefined }}
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
        // Feed-controlled HTML is untrusted. Keep the injected about:
        // document inside the WebView, open http(s) links in the system
        // browser, and block every other scheme (file:, intent:,
        // javascript:, data:, custom schemes) from loading at all.
        if (request.url.startsWith('about:')) {
          return true;
        }
        if (/^https?:\/\//i.test(request.url)) {
          void Linking.openURL(request.url);
          return false;
        }
        return false;
      }}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    minHeight: 320,
    flex: 1,
  },
});
