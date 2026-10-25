import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useArticle, useToggleSaved } from '@entities/article';
import { useArticleTranslation } from '@features/translate-article';
import { useFullArticle } from '@features/fetch-article-content';
import { formatDate } from '@shared/lib/dates';
import { Button, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';
import { ReaderWebView } from '@widgets/reader-view';

export interface ArticleReaderScreenProps {
  articleId: number;
}

type ViewMode = 'original' | 'translation';

export function ArticleReaderScreen({ articleId }: ArticleReaderScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const { data: article, loading, setData: setArticle } = useArticle(articleId);
  const { saving, toggleSaved } = useToggleSaved();
  const { state: translationState, translate, cancel } = useArticleTranslation(article);
  const fullStatus = useFullArticle(article, setArticle);

  const [viewMode, setViewMode] = useState<ViewMode>('original');

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

  const showTranslation = viewMode === 'translation';

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

        <View style={styles.toggleRow}>
          <Button
            label={t('reader.original')}
            variant={viewMode === 'original' ? 'primary' : 'secondary'}
            onPress={() => setViewMode('original')}
          />
          <Button
            label={t('reader.translation')}
            variant={viewMode === 'translation' ? 'primary' : 'secondary'}
            onPress={() => setViewMode('translation')}
          />
        </View>

        {showTranslation ? (
          <TranslationPanel
            state={translationState}
            onTranslate={translate}
            onCancel={cancel}
            onConfigure={() => router.push('/settings')}
          />
        ) : fullStatus === 'loading' ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="body" style={{ color: theme.colors.textMuted }}>
              {t('reader.loadingFull')}
            </Text>
          </View>
        ) : article.contentHtml ? (
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

interface TranslationPanelProps {
  state: ReturnType<typeof useArticleTranslation>['state'];
  onTranslate: () => void;
  onCancel: () => void;
  onConfigure: () => void;
}

function TranslationPanel({
  state,
  onTranslate,
  onCancel,
  onConfigure,
}: TranslationPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (state.status === 'ready') {
    return (
      <ReaderWebView
        article={{
          id: 0,
          feedId: 0,
          guid: '',
          url: null,
          title: '',
          author: null,
          summary: null,
          contentHtml: state.text ?? null,
          hasFullContent: true,
          publishedAt: null,
          saved: false,
          fetchedAt: 0,
        }}
        htmlOverride={state.text}
      />
    );
  }

  if (state.status === 'translating') {
    const { done = 0, total = 0 } = state.progress ?? {};
    return (
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            gap: theme.spacing.s,
          },
        ]}
      >
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text variant="body">{t('reader.translating', { done, total })}</Text>
        <Button label={t('reader.cancel')} variant="secondary" onPress={onCancel} />
      </View>
    );
  }

  if (state.status === 'failed') {
    return (
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            gap: theme.spacing.s,
          },
        ]}
      >
        <Text variant="body" style={{ color: theme.colors.danger }}>
          {t('reader.translationFailed')}
        </Text>
        {state.error ? <Text variant="caption">{state.error.message}</Text> : null}
        <Button label={t('common.retry')} variant="primary" onPress={onTranslate} />
      </View>
    );
  }

  if (state.status === 'blocked') {
    return (
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            gap: theme.spacing.s,
          },
        ]}
      >
        <Text variant="body">{t('reader.configureFirst')}</Text>
        <Button label={t('reader.configure')} variant="primary" onPress={onConfigure} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          gap: theme.spacing.s,
        },
      ]}
    >
      <Button label={t('reader.translate')} variant="primary" onPress={onTranslate} />
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
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
});
