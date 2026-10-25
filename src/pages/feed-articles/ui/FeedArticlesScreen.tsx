import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { listArticlesByFeed, type Article } from '@entities/article';
import { useFeed } from '@entities/feed';
import { useFeedTitleTranslation, useListTranslation } from '@features/translate-article';
import { useRefreshFeed } from '@features/refresh-feeds';
import { useAsyncData } from '@shared/lib/hooks';
import { Button, EmptyState, SegmentedToggle, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';
import { ArticleCard } from '@widgets/article-card';

export interface FeedArticlesScreenProps {
  feedId: number;
}

type ViewMode = 'original' | 'translation';

const EMPTY_ARTICLES: Article[] = [];

export function FeedArticlesScreen({ feedId }: FeedArticlesScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const load = useCallback(() => listArticlesByFeed(feedId), [feedId]);
  const { data: articles, loading, reload } = useAsyncData(load);
  const { data: feed } = useFeed(feedId);
  const { refreshing, onRefresh } = useRefreshFeed(feedId, reload);

  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const { state: listTranslation, translate } = useListTranslation(
    articles ?? EMPTY_ARTICLES,
  );
  const translatedFeedTitle = useFeedTitleTranslation(
    feed?.title ?? null,
    viewMode === 'translation',
  );
  const displayFeedTitle = translatedFeedTitle ?? feed?.title ?? feed?.url;

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

  const handleRefresh = useCallback(async () => {
    try {
      await onRefresh();
    } catch {
      Alert.alert(t('common.error'), t('articles.refreshFailed'));
    }
  }, [onRefresh, t]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={articles ?? []}
        keyExtractor={(article) => String(article.id)}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { padding: theme.spacing.m, gap: theme.spacing.s },
        ]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View>
            <View style={{ paddingTop: insets.top + theme.spacing.s }}>
              <View style={{ paddingHorizontal: theme.spacing.m }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('reader.back')}
                  onPress={() => router.back()}
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Feather
                    name="chevron-left"
                    size={24}
                    color={theme.colors.primary}
                  />
                </Pressable>
              </View>
              {displayFeedTitle ? (
                <View
                  style={[
                    styles.titleBlock,
                    { paddingHorizontal: theme.spacing.m },
                  ]}
                >
                  <Text variant="title">{displayFeedTitle}</Text>
                </View>
              ) : null}
            </View>

            {!loading ? (
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
                {viewMode === 'translation' &&
                listTranslation.status === 'blocked' ? (
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
                {viewMode === 'translation' &&
                listTranslation.status === 'failed' ? (
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
                      {listTranslation.error?.message ??
                        t('reader.translationFailed')}
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
          ) : (
            <EmptyState
              symbol="📰"
              title={t('articles.emptyTitle')}
              hint={t('articles.emptyHint')}
            />
          )
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
              onPress={(a) => router.push(`/article/${a.id}`)}
            />
          );
        }}
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
  loader: {
    marginTop: 48,
  },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: -8,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  titleBlock: {
    paddingBottom: 8,
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
});
