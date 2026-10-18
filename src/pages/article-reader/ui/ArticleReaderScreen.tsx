import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useArticle, useToggleSaved } from '@entities/article';
import { formatDate } from '@shared/lib/dates';
import { Button, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';
import { ReaderWebView } from '@widgets/reader-view';

export interface ArticleReaderScreenProps {
  articleId: number;
}

export function ArticleReaderScreen({ articleId }: ArticleReaderScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const { data: article, loading, setData: setArticle } = useArticle(articleId);
  const { saving, toggleSaved } = useToggleSaved();

  const onToggleSaved = useCallback(async () => {
    if (!article) return;
    await toggleSaved(article, setArticle, {
      onError: () => Alert.alert(t('common.error')),
    });
  }, [article, setArticle, t, toggleSaved]);

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
            disabled={saving}
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

        {article.contentHtml ? (
          <ReaderWebView article={article} />
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
});
