import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { listFeeds, type Feed } from '@entities/feed';
import { refreshAllFeeds } from '@features/refresh-feeds';
import { Button, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';

export function FeedsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const rows = await listFeeds();
    setFeeds(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch {
        // The list stays empty; the user can retry the pull-to-refresh.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAllFeeds();
      await load();
    } catch {
      Alert.alert(t('common.error'), t('feeds.refreshAllFailed'));
    } finally {
      setRefreshing(false);
    }
  }, [load, t]);

  const onAdd = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      const { addFeedByUrl } = await import('@features/refresh-feeds');
      await addFeedByUrl(trimmed);
      setUrl('');
      setAddModalVisible(false);
      await load();
    } catch {
      Alert.alert(t('common.error'), t('feeds.addFailed'));
    } finally {
      setAdding(false);
    }
  }, [load, t, url]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.m }]}>
        <Text variant="title">{t('feeds.title')}</Text>
        <Button
          label={`+ ${t('feeds.add')}`}
          onPress={() => setAddModalVisible(true)}
        />
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={theme.colors.primary}
        />
      ) : (
        <FlatList
          data={feeds}
          keyExtractor={(feed) => String(feed.id)}
          contentContainerStyle={{ padding: theme.spacing.m, gap: theme.spacing.s }}
          refreshing={refreshing}
          onRefresh={onRefresh}
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

      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radii.l,
                padding: theme.spacing.l,
                gap: theme.spacing.s,
              },
            ]}
          >
            <Text variant="headline">{t('feeds.addTitle')}</Text>
            <Text variant="caption">{t('feeds.urlLabel')}</Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder={t('feeds.urlPlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.s,
                  color: theme.colors.text,
                  padding: theme.spacing.s,
                },
              ]}
            />
            <View style={styles.modalButtons}>
              <Button
                label={t('common.cancel')}
                variant="secondary"
                onPress={() => setAddModalVisible(false)}
                disabled={adding}
              />
              <Button
                label={adding ? t('common.loading') : t('feeds.add')}
                onPress={onAdd}
                disabled={adding}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    margin: 16,
  },
  input: {
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});
