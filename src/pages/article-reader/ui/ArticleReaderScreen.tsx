import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useArticle, useToggleSaved } from '@entities/article';
import { useArticleTranslation } from '@features/translate-article';
import { useFullArticle } from '@features/fetch-article-content';
import { formatDate } from '@shared/lib/dates';
import { Button, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';
import { ReaderWebView } from '@widgets/reader-view';

export interface ArticleReaderScreenProps {
  articleId: number;
}

type ViewMode = 'original' | 'translation';

export function ArticleReaderScreen({ articleId }: ArticleReaderScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: article, loading, setData: setArticle } = useArticle(articleId);
  const { saving, toggleSaved } = useToggleSaved();
  const { state: translationState, translate, cancel } = useArticleTranslation(article);
  const fullStatus = useFullArticle(article, setArticle);

  const [viewMode, setViewMode] = useState<ViewMode>('original');

  // Auto-start translation the first time the user switches to translation
  // view (and only when the translation is genuinely ready, not still
  // loading settings). The guard fires once per entry into translation mode.
  const hasAutoTranslated = useRef(false);

  useEffect(() => {
    if (viewMode !== 'translation') {
      hasAutoTranslated.current = false;
      return;
    }
    if (!hasAutoTranslated.current && translationState.status === 'idle') {
      hasAutoTranslated.current = true;
      translate();
    }
  }, [viewMode, translationState.status, translate]);

  const onToggleSaved = useCallback(async () => {
    if (!article) return;
    await toggleSaved(article, setArticle, {
      onError: () => Alert.alert(t('common.error')),
    });
  }, [article, setArticle, t, toggleSaved]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <Text variant="body">{t('common.error')}</Text>
      </View>
    );
  }

  const showTranslation = viewMode === 'translation';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + theme.spacing.s,
            paddingBottom: theme.spacing.s,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('reader.back')}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={{ color: theme.colors.primary }}>← {t('reader.back')}</Text>
        </Pressable>

        <View style={styles.titleBlock}>
          <Text variant="headline" numberOfLines={1}>
            {article.title}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {formatDate(article.publishedAt ?? article.fetchedAt)}
            {article.author ? ` · ${article.author}` : ''}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={article.saved ? t('reader.saved') : t('reader.save')}
            onPress={onToggleSaved}
            disabled={saving}
            style={({ pressed }) => [
              styles.actionButton,
              saving && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={{ color: theme.colors.primary, fontSize: theme.font.headline }}
            >
              {article.saved ? '★' : '☆'}
            </Text>
          </Pressable>
          {article.url ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('reader.openInBrowser')}
              onPress={() => {
                if (article.url) void Linking.openURL(article.url);
              }}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Text
                style={{ color: theme.colors.primary, fontSize: theme.font.headline }}
              >
                ↗
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.toggleRow,
          {
            paddingHorizontal: theme.spacing.m,
            paddingBottom: theme.spacing.s,
          },
        ]}
      >
        <Button
          label={t('reader.original')}
          variant={viewMode === 'original' ? 'primary' : 'secondary'}
          onPress={() => setViewMode('original')}
        />
        <Button
          label={t('reader.translation')}
          variant={viewMode === 'translation' ? 'primary' : 'secondary'}
          onPress={() => setViewMode('translation')}
        />
      </View>

      <View style={styles.content}>
        {showTranslation ? (
          <TranslationPanel
            state={translationState}
            onTranslate={translate}
            onCancel={cancel}
            onConfigure={() => router.push('/settings')}
          />
        ) : fullStatus === 'loading' ? (
          <View style={[styles.center, styles.fill]}>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="body" style={{ color: theme.colors.textMuted }}>
                {t('reader.loadingFull')}
              </Text>
            </View>
          </View>
        ) : article.contentHtml ? (
          <ReaderWebView article={article} />
        ) : (
          <View style={[styles.center, styles.fill]}>
            <Text variant="body" style={{ color: theme.colors.textMuted }}>
              {t('reader.contentUnavailable')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface TranslationPanelProps {
  state: ReturnType<typeof useArticleTranslation>['state'];
  onTranslate: () => void;
  onCancel: () => void;
  onConfigure: () => void;
}

function TranslationPanel({
  state,
  onTranslate,
  onCancel,
  onConfigure,
}: TranslationPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (state.status === 'ready') {
    return (
      <ReaderWebView
        article={{
          id: 0,
          feedId: 0,
          guid: '',
          url: null,
          title: '',
          author: null,
          summary: null,
          contentHtml: state.text ?? null,
          hasFullContent: true,
          publishedAt: null,
          saved: false,
          fetchedAt: 0,
        }}
        htmlOverride={state.text}
      />
    );
  }

  if (state.status === 'translating') {
    const { done = 0, total = 0 } = state.progress ?? {};
    return (
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            gap: theme.spacing.s,
          },
        ]}
      >
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text variant="body">{t('reader.translating', { done, total })}</Text>
        <Button label={t('reader.cancel')} variant="secondary" onPress={onCancel} />
      </View>
    );
  }

  if (state.status === 'failed') {
    return (
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            gap: theme.spacing.s,
          },
        ]}
      >
        <Text variant="body" style={{ color: theme.colors.danger }}>
          {t('reader.translationFailed')}
        </Text>
        {state.error ? <Text variant="caption">{state.error.message}</Text> : null}
        <Button label={t('common.retry')} variant="primary" onPress={onTranslate} />
      </View>
    );
  }

  if (state.status === 'blocked') {
    return (
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            gap: theme.spacing.s,
          },
        ]}
      >
        <Text variant="body">{t('reader.configureFirst')}</Text>
        <Button label={t('reader.configure')} variant="primary" onPress={onConfigure} />
      </View>
    );
  }

  if (state.status === 'loading') {
    return (
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            gap: theme.spacing.s,
          },
        ]}
      >
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          gap: theme.spacing.s,
        },
      ]}
    >
      <Button label={t('reader.translate')} variant="primary" onPress={onTranslate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  backButton: {
    minHeight: 36,
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
});
