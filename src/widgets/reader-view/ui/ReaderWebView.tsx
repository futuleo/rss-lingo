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
import {
  DEFAULT_READER_SETTINGS,
  LINE_HEIGHT_OPTIONS,
  READER_FONTS,
  resolveReaderPalette,
  type ReaderSettings,
} from '@entities/reader-settings';
import { buildReaderHtml } from '../lib/buildReaderHtml';
import { decideReaderRequest } from '../lib/decideReaderRequest';

export interface ReaderWebViewProps {
  article: Article;
  htmlOverride?: string;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /**
   * Extra top padding (in CSS px) reserved for an overlaid header. The
   * article text starts below the header instead of behind it.
   */
  topPadding?: number;
  /** Reading appearance settings; defaults to the app's built-in defaults. */
  settings?: ReaderSettings;
}

export function ReaderWebView({
  article,
  htmlOverride,
  onScroll,
  topPadding = 20,
  settings = DEFAULT_READER_SETTINGS,
}: ReaderWebViewProps) {
  const theme = useTheme();

  const content = htmlOverride ?? article.contentHtml ?? '';

  const palette = resolveReaderPalette(settings, theme);
  const font =
    READER_FONTS.find((item) => item.id === settings.fontId) ?? READER_FONTS[0]!;
  const lineHeight =
    LINE_HEIGHT_OPTIONS.find((item) => item.id === settings.lineHeightId) ??
    LINE_HEIGHT_OPTIONS[1]!;

  const readerHtml = useMemo(() => {
    return buildReaderHtml(content, {
      background: palette.background,
      text: palette.text,
      textMuted: palette.textMuted,
      scheme: palette.scheme,
      topPadding,
      fontFamily: font.family,
      fontSize: settings.fontSize,
      lineHeight: lineHeight.value,
      justify: settings.justify,
    });
  }, [
    content,
    palette.background,
    palette.text,
    palette.textMuted,
    palette.scheme,
    topPadding,
    font.family,
    settings.fontSize,
    lineHeight.value,
    settings.justify,
  ]);

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
          backgroundColor: palette.background,
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
