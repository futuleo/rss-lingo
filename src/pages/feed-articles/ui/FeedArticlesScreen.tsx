import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { listArticlesByFeed, type Article } from '@entities/article';
import { listFeeds } from '@entities/feed';
import { refreshFeed } from '@features/refresh-feeds';
import { Text } from '@shared/ui';
import { useTheme } from '@shared/theme';
import { ArticleCard } from '@widgets/article-card';

export interface FeedArticlesScreenProps {
  feedId: number;
}

export function FeedArticlesScreen({ feedId }: FeedArticlesScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [feedTitle, setFeedTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await listArticlesByFeed(feedId);
    setArticles(rows);
  }, [feedId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const feeds = await listFeeds();
        const feed = feeds.find((f) => f.id === feedId);
        if (!cancelled) setFeedTitle(feed?.title ?? feed?.url ?? null);
      } catch {
        // Title is cosmetic; the article list still loads below.
      }
      load()
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    })();
    return () => {
      cancelled = true;
    };
  }, [feedId, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const feeds = await listFeeds();
      const feed = feeds.find((f) => f.id === feedId);
      if (feed) await refreshFeed(feed);
      await load();
    } catch {
      // Keep the previous list; the user can retry the pull-to-refresh.
    } finally {
      setRefreshing(false);
    }
  }, [feedId, load]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={theme.colors.primary}
        />
      ) : (
        <>
          {feedTitle ? (
            <View style={[styles.header, { paddingHorizontal: theme.spacing.m }]}>
              <Text variant="title" style={styles.title}>
                {feedTitle}
              </Text>
            </View>
          ) : null}
          <FlatList
            data={articles}
            keyExtractor={(article) => String(article.id)}
            style={styles.list}
            contentContainerStyle={{ padding: theme.spacing.m, gap: theme.spacing.s }}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text variant="headline">{t('articles.emptyTitle')}</Text>
                <Text variant="body" style={styles.emptyHint}>
                  {t('articles.emptyHint')}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ArticleCard
                article={item}
                onPress={(a) => router.push(`/article/${a.id}`)}
              />
            )}
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
  loader: {
    marginTop: 48,
  },
  header: {
    paddingBottom: 8,
    paddingTop: 48,
  },
  title: {
    flexShrink: 1,
  },
  list: {
    flex: 1,
  },
  empty: {
    marginTop: 48,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyHint: {
    textAlign: 'center',
  },
});
