import { StyleSheet, View } from 'react-native';
import { Skeleton } from '@shared/ui';
import { useTheme } from '@shared/theme';

export interface ArticleSkeletonProps {
  /** Render title + metadata lines (used when the real header isn't shown). */
  header?: boolean;
  /** Top inset to clear the collapsible reader header. */
  topPadding?: number;
}

/**
 * Skeleton placeholder for article content. Mirrors the reader's layout:
 * optional title/metadata lines plus a run of body paragraphs.
 */
export function ArticleSkeleton({ header = true, topPadding = 0 }: ArticleSkeletonProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding + theme.spacing.m,
          paddingHorizontal: theme.spacing.m,
          gap: theme.spacing.s,
        },
      ]}
    >
      {header ? (
        <>
          <Skeleton style={{ height: theme.font.title, width: '88%' }} />
          <Skeleton style={{ height: theme.font.title, width: '55%' }} />
          <Skeleton
            style={{
              height: theme.font.caption,
              width: 130,
              marginTop: theme.spacing.xs,
            }}
          />
          <View style={{ height: theme.spacing.s }} />
        </>
      ) : null}
      <Skeleton style={{ height: theme.font.body, width: '100%' }} />
      <Skeleton style={{ height: theme.font.body, width: '93%' }} />
      <Skeleton style={{ height: theme.font.body, width: '98%' }} />
      <Skeleton style={{ height: theme.font.body, width: '70%' }} />
      <View style={{ height: theme.spacing.s }} />
      <Skeleton style={{ height: theme.font.body, width: '100%' }} />
      <Skeleton style={{ height: theme.font.body, width: '88%' }} />
      <Skeleton style={{ height: theme.font.body, width: '95%' }} />
      <Skeleton style={{ height: theme.font.body, width: '55%' }} />
      <View style={{ height: theme.spacing.s }} />
      <Skeleton style={{ height: theme.font.body, width: '100%' }} />
      <Skeleton style={{ height: theme.font.body, width: '84%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
