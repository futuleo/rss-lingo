import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { listArticlesByFeed } from '@entities/article';
import { useFeed } from '@entities/feed';
import { useRefreshFeed } from '@features/refresh-feeds';
import { useAsyncData } from '@shared/lib/hooks';
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

  const load = useCallback(() => listArticlesByFeed(feedId), [feedId]);
  const { data: articles, loading, reload } = useAsyncData(load);
  const { data: feed } = useFeed(feedId);
  const { refreshing, onRefresh } = useRefreshFeed(feedId, reload);

  const handleRefresh = useCallback(async () => {
    try {
      await onRefresh();
    } catch {
      Alert.alert(t('common.error'), t('articles.refreshFailed'));
    }
  }, [onRefresh, t]);

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
          {feed?.title ?? feed?.url ? (
            <View style={[styles.header, { paddingHorizontal: theme.spacing.m }]}>
              <Text variant="title" style={styles.title}>
                {feed?.title ?? feed?.url}
              </Text>
            </View>
          ) : null}
          <FlatList
            data={articles ?? []}
            keyExtractor={(article) => String(article.id)}
            style={styles.list}
            contentContainerStyle={{ padding: theme.spacing.m, gap: theme.spacing.s }}
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
