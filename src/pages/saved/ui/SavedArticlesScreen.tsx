import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { listSavedArticles, type Article } from '@entities/article';
import { useListTranslation } from '@features/translate-article';
import { useAsyncData } from '@shared/lib/hooks';
import { Button, EmptyState, SegmentedToggle, Text } from '@shared/ui';
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
  const { state: listTranslation, translate } = useListTranslation(
    articles ?? EMPTY_ARTICLES,
  );

  // Auto-start headline translation the first time the user switches to
  // translation view (and only when the translation is genuinely ready to go,
  // not still loading settings). The guard fires once per entry into
  // translation mode.
  const hasAutoTranslated = useRef(false);

  useEffect(() => {
    if (viewMode !== 'translation') {
      hasAutoTranslated.current = false;
      return;
    }
    if (!hasAutoTranslated.current && listTranslation.status === 'idle') {
      hasAutoTranslated.current = true;
      translate();
    }
  }, [viewMode, listTranslation.status, translate]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.m,
            paddingTop: insets.top + theme.spacing.s,
            paddingBottom: theme.spacing.s,
          },
        ]}
      >
        <Text variant="title">{t('saved.title')}</Text>
      </View>

      {loading ? (
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
        <>
          <View
            style={[
              styles.toggleArea,
              {
                paddingHorizontal: theme.spacing.m,
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
          </View>
          <FlatList
            data={articles ?? []}
            keyExtractor={(article) => String(article.id)}
            contentContainerStyle={{ padding: theme.spacing.m, gap: theme.spacing.s }}
            ListEmptyComponent={
              <EmptyState
                symbol="★"
                title={t('saved.emptyTitle')}
                hint={t('saved.emptyHint')}
              />
            }
            renderItem={({ item }) => {
              const meta =
                viewMode === 'translation'
                  ? listTranslation.items[item.id]
                  : undefined;
              return (
                <ArticleCard
                  article={item}
                  titleOverride={meta?.title ?? null}
                  summaryOverride={meta?.summary ?? null}
                  onPress={(article) => router.push(`/article/${article.id}`)}
                />
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
