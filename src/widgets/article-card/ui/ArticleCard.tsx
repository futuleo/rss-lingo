import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@shared/lib/dates';
import { Skeleton, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';
import type { Article } from '@entities/article';

export interface ArticleCardProps {
  article: Article;
  onPress: (article: Article) => void;
  titleOverride?: string | null;
  summaryOverride?: string | null;
  /** Render a skeleton placeholder instead of the article text. */
  loading?: boolean;
}

export function ArticleCard({
  article,
  onPress,
  titleOverride = null,
  summaryOverride = null,
  loading = false,
}: ArticleCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const containerStyle: ViewStyle[] = [
    styles.card,
    {
      paddingVertical: theme.spacing.m,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
  ];

  if (loading) {
    return (
      <View
        accessible
        accessibilityLabel={t('common.loading')}
        style={containerStyle}
      >
        <View style={styles.metaRow}>
          <Skeleton style={{ width: 72, height: theme.font.caption }} />
        </View>
        <Skeleton style={{ height: theme.font.headline, width: '85%' }} />
        <Skeleton style={{ height: theme.font.body, width: '100%' }} />
        <Skeleton style={{ height: theme.font.body, width: '55%' }} />
      </View>
    );
  }

  const dateLabel = formatDate(article.publishedAt ?? article.fetchedAt);
  const title = titleOverride ?? article.title;
  const summary = summaryOverride ?? article.summary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(article)}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
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
