import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { deleteFeed, useFeeds, type Feed } from '@entities/feed';
import { AddFeedModal } from '@features/add-feed';
import { useRefreshAllFeeds } from '@features/refresh-feeds';
import { useScrollToTop } from '@shared/lib/hooks';
import { Button, EmptyState, ScrollToTopButton, Skeleton, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';

export function FeedsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: feeds, loading, error, reload } = useFeeds();
  const { refreshing, onRefresh } = useRefreshAllFeeds(reload);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const listRef = useRef<FlatList<Feed>>(null);
  const { onScroll, visible, reset } = useScrollToTop();

  const handleScrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    reset();
  }, [reset]);

  const handleAdded = useCallback(async () => {
    try {
      await reload();
    } catch {
      // The list stays empty; the user can retry the pull-to-refresh.
    }
  }, [reload]);

  const handleRefresh = useCallback(async () => {
    try {
      await onRefresh();
    } catch {
      Alert.alert(t('common.error'), t('feeds.refreshAllFailed'));
    }
  }, [onRefresh, t]);

  const handleDeleteFeed = useCallback(
    (feed: Feed) => {
      Alert.alert(
        t('feeds.deleteTitle'),
        t('feeds.deleteMessage', { title: feed.title ?? feed.url }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteFeed(feed.id);
                await reload();
              } catch {
                Alert.alert(t('common.error'), t('feeds.deleteFailed'));
              }
            },
          },
        ],
      );
    },
    [reload, t],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        ref={listRef}
        data={feeds ?? []}
        keyExtractor={(feed) => String(feed.id)}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.m,
          paddingBottom: theme.spacing.m,
        }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + theme.spacing.s }}>
            <View style={styles.headerRow}>
              <Text variant="title">{t('feeds.title')}</Text>
              <Button
                label={`+ ${t('feeds.addHeader')}`}
                onPress={() => setAddModalVisible(true)}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View>
              {Array.from({ length: 5 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.feedItem,
                    {
                      paddingVertical: theme.spacing.m,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <Skeleton style={{ height: theme.font.headline, width: '70%' }} />
                  <Skeleton style={{ height: theme.font.caption, width: '45%' }} />
                </View>
              ))}
            </View>
          ) : error ? (
            <View style={styles.error}>
              <Text
                variant="body"
                style={{ color: theme.colors.danger, textAlign: 'center' }}
              >
                {t('feeds.loadError')}
              </Text>
              <Button label={t('common.retry')} variant="secondary" onPress={reload} />
            </View>
          ) : (
            <EmptyState
              icon="rss"
              title={t('feeds.emptyTitle')}
              hint={t('feeds.emptyHint')}
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/feeds/${item.id}`)}
            onLongPress={() => handleDeleteFeed(item)}
            style={[
              styles.feedItem,
              {
                paddingVertical: theme.spacing.m,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <Text variant="headline">{item.title ?? item.url}</Text>
            <Text variant="caption" numberOfLines={1}>
              {item.url}
            </Text>
          </Pressable>
        )}
      />

      <AddFeedModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdded={handleAdded}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  error: {
    marginTop: 48,
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  feedItem: {
    gap: 4,
  },
});
