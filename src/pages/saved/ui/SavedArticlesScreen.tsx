import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { listSavedArticles } from '@entities/article';
import { useAsyncData } from '@shared/lib/hooks';
import { Button, EmptyState, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';
import { ArticleCard } from '@widgets/article-card';

export function SavedArticlesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const load = useCallback(() => listSavedArticles(), []);
  const { data: articles, loading, error, reload } = useAsyncData(load);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.m,
            paddingTop: 48,
            paddingBottom: theme.spacing.s,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('saved.back')}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={{ color: theme.colors.primary }}>← {t('saved.back')}</Text>
        </Pressable>
        <Text variant="title">{t('saved.title')}</Text>
        <View style={styles.placeholder} />
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
          renderItem={({ item }) => (
            <ArticleCard
              article={item}
              onPress={(article) => router.push(`/article/${article.id}`)}
            />
          )}
        />
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
  backButton: {
    minWidth: 64,
  },
  placeholder: {
    minWidth: 64,
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
