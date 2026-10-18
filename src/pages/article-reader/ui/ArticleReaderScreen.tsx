import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getArticle, setArticleSaved, type Article } from '@entities/article';
import { formatDate } from '@shared/lib/dates';
import { Button, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';

export interface ArticleReaderScreenProps {
  articleId: number;
}

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

export function ArticleReaderScreen({ articleId }: ArticleReaderScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const row = await getArticle(articleId);
    setArticle(row);
  }, [articleId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch {
        // The article stays null; the error state is rendered below.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onToggleSaved = useCallback(async () => {
    if (!article) return;
    const next = !article.saved;
    setArticle({ ...article, saved: next });
    try {
      await setArticleSaved(article.id, next);
    } catch {
      setArticle(article);
      Alert.alert(t('common.error'));
    }
  }, [article, t]);

  const readerHtml = useMemo(() => {
    if (!article) return null;
    return buildReaderHtml(article, {
      background: theme.colors.background,
      text: theme.colors.text,
      textMuted: theme.colors.textMuted,
    });
  }, [article, theme]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text variant="body">{t('common.error')}</Text>
      </View>
    );
  }

  const hasContent = Boolean(article.contentHtml);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.m, gap: theme.spacing.s }}
      >
        <Text variant="title">{article.title}</Text>
        <Text variant="caption">
          {formatDate(article.publishedAt ?? article.fetchedAt)}
          {article.author ? ` · ${article.author}` : ''}
        </Text>

        <View style={styles.actions}>
          <Button
            label={article.saved ? `★ ${t('reader.saved')}` : t('reader.save')}
            variant={article.saved ? 'secondary' : 'primary'}
            onPress={onToggleSaved}
          />
          {article.url ? (
            <Button
              label={t('reader.openInBrowser')}
              variant="secondary"
              onPress={() => {
                if (article.url) void Linking.openURL(article.url);
              }}
            />
          ) : null}
        </View>

        {hasContent && readerHtml ? (
          <WebView
            originWhitelist={['*']}
            source={{ html: readerHtml, baseUrl: article.url ?? undefined }}
            style={[
              styles.webview,
              {
                backgroundColor: theme.colors.background,
                borderRadius: theme.radii.m,
              },
            ]}
            onShouldStartLoadWithRequest={(request) => {
              // The reader HTML itself loads about:blank; any http(s)
              // navigation is a link tap — hand it to the system browser.
              if (request.url.startsWith('about:')) return true;
              void Linking.openURL(request.url);
              return false;
            }}
          />
        ) : (
          <Text variant="body" style={{ color: theme.colors.textMuted }}>
            {t('reader.contentUnavailable')}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  webview: {
    minHeight: 320,
    flex: 1,
  },
});
