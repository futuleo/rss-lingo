import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@shared/lib/dates';
import { Text } from '@shared/ui';
import { useTheme } from '@shared/theme';
import type { Article } from '@entities/article';

export interface ArticleCardProps {
  article: Article;
  onPress: (article: Article) => void;
  titleOverride?: string | null;
  summaryOverride?: string | null;
}

export function ArticleCard({
  article,
  onPress,
  titleOverride = null,
  summaryOverride = null,
}: ArticleCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const dateLabel = formatDate(article.publishedAt ?? article.fetchedAt);
  const title = titleOverride ?? article.title;
  const summary = summaryOverride ?? article.summary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(article)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.m,
          padding: theme.spacing.m,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.metaRow}>
        <Text variant="caption">{dateLabel}</Text>
        {article.saved ? (
          <Text variant="caption" style={{ color: theme.colors.primary }}>
            ★ {t('reader.saved')}
          </Text>
        ) : null}
      </View>
      <Text variant="headline">{title}</Text>
      {summary ? (
        <Text variant="body" numberOfLines={2} style={styles.summary}>
          {summary}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    gap: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summary: {
    marginTop: 2,
  },
});
