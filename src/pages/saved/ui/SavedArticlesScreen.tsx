import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { listSavedArticles, type Article } from '@entities/article';
import { useListTranslation } from '@features/translate-article';
import { useAsyncData, useScrollToTop } from '@shared/lib/hooks';
import {
  Button,
  EmptyState,
  ScrollToTopButton,
  SegmentedToggle,
  Text,
} from '@shared/ui';
import { useTheme } from '@shared/theme';
import { ArticleCard } from '@widgets/article-card';

type ViewMode = 'original' | 'translation';

const EMPTY_ARTICLES: Article[] = [];

export function SavedArticlesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const load = useCallback(() => listSavedArticles(), []);
  const { data: articles, loading, error, reload } = useAsyncData(load);

  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const { state: listTranslation, translate, translationKey } = useListTranslation(
    articles ?? EMPTY_ARTICLES,
  );

  const listRef = useRef<FlatList<Article>>(null);
  const { onScroll, visible, reset } = useScrollToTop();

  // Show skeleton placeholders while a translation is still being prepared or
  // is in flight, instead of silently showing the original text.
  const isTranslationPending =
    listTranslation.status === 'loading' ||
    listTranslation.status === 'idle' ||
    listTranslation.status === 'translating';

  const handleScrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    reset();
  }, [reset]);

  // Auto-start headline translation the first time the user switches to
  // translation view (and only when the translation is genuinely ready to go,
  // not still loading settings). The guard fires once per entry into
  // translation mode, and again when the target language changes so headlines
  // are re-translated into the new language.
  const autoTranslatedKey = useRef<string | null>(null);

  useEffect(() => {
    if (viewMode !== 'translation') {
      autoTranslatedKey.current = null;
      return;
    }
    if (
      autoTranslatedKey.current !== translationKey &&
      listTranslation.status === 'idle'
    ) {
      autoTranslatedKey.current = translationKey;
      translate();
    }
  }, [viewMode, listTranslation.status, translate, translationKey]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        ref={listRef}
        data={articles ?? []}
        keyExtractor={(article) => String(article.id)}
        style={styles.list}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: theme.spacing.m,
            paddingBottom: theme.spacing.m,
          },
        ]}
        ListHeaderComponent={
          <View>
            <View
              style={[
                styles.header,
                {
                  paddingTop: insets.top + theme.spacing.s,
                  paddingBottom: theme.spacing.s,
                },
              ]}
            >
              <Text variant="title">{t('saved.title')}</Text>
            </View>

            {!loading && !error ? (
              <View
                style={[
                  styles.toggleArea,
                  {
                    paddingBottom: theme.spacing.s,
                  },
                ]}
              >
                <SegmentedToggle
                  options={[
                    { value: 'original', label: t('reader.original') },
                    { value: 'translation', label: t('reader.translation') },
                  ]}
                  value={viewMode}
                  onChange={setViewMode}
                />
                {listTranslation.status === 'translating' ? (
                  <Text variant="caption">
                    {t('articles.translatingHeadlines', {
                      done: listTranslation.progress?.done ?? 0,
                      total: listTranslation.progress?.total ?? 0,
                    })}
                  </Text>
                ) : null}
                {viewMode === 'translation' && listTranslation.status === 'blocked' ? (
                  <View
                    style={[
                      styles.banner,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text variant="caption" style={styles.bannerText}>
                      {t('reader.configureFirst')}
                    </Text>
                    <Button
                      label={t('reader.configure')}
                      variant="secondary"
                      labelVariant="caption"
                      onPress={() => router.navigate('/settings')}
                    />
                  </View>
                ) : null}
                {viewMode === 'translation' && listTranslation.status === 'failed' ? (
                  <View
                    style={[
                      styles.banner,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text variant="caption" style={styles.bannerText}>
                      {listTranslation.error?.message ?? t('reader.translationFailed')}
                    </Text>
                    <Button
                      label={t('common.retry')}
                      variant="secondary"
                      labelVariant="caption"
                      onPress={translate}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              style={styles.loader}
              size="large"
              color={theme.colors.primary}
            />
          ) : error ? (
            <View style={styles.error}>
              <Text
                variant="body"
                style={{ color: theme.colors.danger, textAlign: 'center' }}
              >
                {t('saved.loadError')}
              </Text>
              <Button label={t('common.retry')} variant="secondary" onPress={reload} />
            </View>
          ) : (
            <EmptyState
              icon="bookmark"
              title={t('saved.emptyTitle')}
              hint={t('saved.emptyHint')}
            />
          )
        }
        renderItem={({ item }) => {
          const meta =
            viewMode === 'translation' ? listTranslation.items[item.id] : undefined;
          return (
            <ArticleCard
              article={item}
              titleOverride={meta?.title ?? null}
              summaryOverride={meta?.summary ?? null}
              loading={viewMode === 'translation' && !meta && isTranslationPending}
              onPress={(article) => router.push(`/article/${article.id}`)}
            />
          );
        }}
      />

      <ScrollToTopButton
        visible={visible}
        onPress={handleScrollToTop}
        bottomInset={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleArea: {
    gap: 8,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerText: {
    flex: 1,
  },
  loader: {
    marginTop: 48,
  },
  error: {
    marginTop: 48,
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
});
