import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFeeds } from '@entities/feed';
import { AddFeedModal } from '@features/add-feed';
import { useRefreshAllFeeds } from '@features/refresh-feeds';
import { Button, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';

export function FeedsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const { data: feeds, loading, reload } = useFeeds();
  const { refreshing, onRefresh } = useRefreshAllFeeds(reload);
  const [addModalVisible, setAddModalVisible] = useState(false);

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.m }]}>
        <Text variant="title">{t('feeds.title')}</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settings.title')}
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          >
            <Text style={{ fontSize: 22 }}>⚙</Text>
          </Pressable>
          <Button
            label={`+ ${t('feeds.addHeader')}`}
            onPress={() => setAddModalVisible(true)}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={theme.colors.primary}
        />
      ) : (
        <FlatList
          data={feeds ?? []}
          keyExtractor={(feed) => String(feed.id)}
          contentContainerStyle={{ padding: theme.spacing.m, gap: theme.spacing.s }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="headline">{t('feeds.emptyTitle')}</Text>
              <Text variant="body" style={styles.emptyHint}>
                {t('feeds.emptyHint')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/feeds/${item.id}`)}
              style={[
                styles.feedItem,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.m,
                  padding: theme.spacing.m,
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
      )}

      <AddFeedModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdded={handleAdded}
      />
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
    paddingTop: 48,
    paddingBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    padding: 8,
  },
  loader: {
    marginTop: 48,
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
  feedItem: {
    borderWidth: 1,
    gap: 4,
  },
});
