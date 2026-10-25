import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useArticle, useToggleSaved } from '@entities/article';
import { useReaderSettings, type ReaderSettings } from '@entities/reader-settings';
import { useArticleTranslation } from '@features/translate-article';
import { useFullArticle } from '@features/fetch-article-content';
import { formatDate } from '@shared/lib/dates';
import { Button, ScrollToTopButton, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';
import { ReaderSettingsSheet, ReaderWebView } from '@widgets/reader-view';

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
  const {
    state: translationState,
    translate,
    cancel,
    translationKey,
  } = useArticleTranslation(article);
  const fullStatus = useFullArticle(article, setArticle);
  const readerSettings = useReaderSettings();

  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const [scrollY] = useState(() => new Animated.Value(0));
  const [headerHeight, setHeaderHeight] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auto-start translation the first time the user switches to translation
  // view (and only when the translation is genuinely ready, not still
  // loading settings). The guard fires once per entry into translation mode,
  // and again when the target language changes so the article is re-translated
  // into the new language.
  const autoTranslatedKey = useRef<string | null>(null);

  useEffect(() => {
    if (viewMode !== 'translation') {
      autoTranslatedKey.current = null;
      return;
    }
    if (
      autoTranslatedKey.current !== translationKey &&
      translationState.status === 'idle'
    ) {
      autoTranslatedKey.current = translationKey;
      translate();
    }
  }, [viewMode, translationState.status, translate, translationKey]);

  const onToggleSaved = useCallback(async () => {
    if (!article) return;
    await toggleSaved(article, setArticle, {
      onError: () => Alert.alert(t('common.error')),
    });
  }, [article, setArticle, t, toggleSaved]);

  // Collapse the top block in lock-step with the WebView's scroll offset,
  // clamped so it can never move further than its own measured height.
  const translateY = scrollY.interpolate({
    inputRange: [0, Math.max(headerHeight, 1)],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    // Drive the collapse value directly instead of via `Animated.event`:
    // `Animated.event` returns a non-callable object under React Compiler.
    scrollY.setValue(y);
    setScrolled((prev) => {
      const next = y > 120;
      return prev === next ? prev : next;
    });
  };

  // Scroll-to-top remounts the WebView instead of invoking injected
  // JavaScript because the reader disables JS for security (article content
  // is untrusted). A fresh mount re-renders the document from the top.
  const scrollToTop = () => {
    scrollY.setValue(0);
    setScrolled(false);
    setWebViewKey((key) => key + 1);
  };

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
      <Animated.View
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        style={[
          styles.topBlock,
          {
            backgroundColor: theme.colors.background,
            transform: [{ translateY }],
          },
        ]}
      >
        <View
          style={{
            paddingTop: insets.top + theme.spacing.s,
            paddingBottom: theme.spacing.s,
          }}
        >
          <View style={[styles.actionsRow, { paddingHorizontal: theme.spacing.m }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('reader.back')}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Feather name="chevron-left" size={24} color={theme.colors.primary} />
            </Pressable>

            <View style={[styles.actionsRight, { gap: theme.spacing.xs }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('reader.openSettings')}
                onPress={() => setSettingsOpen(true)}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <Text
                  variant="headline"
                  style={{
                    color: theme.colors.primary,
                    fontWeight: theme.weight.semibold,
                  }}
                >
                  Aa
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  article.saved ? t('reader.saved') : t('reader.save')
                }
                onPress={onToggleSaved}
                disabled={saving}
                style={({ pressed }) => [
                  styles.iconButton,
                  saving && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Feather
                  name="bookmark"
                  size={22}
                  color={article.saved ? theme.colors.primary : theme.colors.textMuted}
                />
              </Pressable>
              {article.url ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('reader.openInBrowser')}
                  onPress={() => {
                    if (article.url) void Linking.openURL(article.url);
                  }}
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Feather
                    name="external-link"
                    size={22}
                    color={theme.colors.primary}
                  />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View
            style={{
              paddingHorizontal: theme.spacing.m,
              paddingBottom: theme.spacing.s,
              gap: theme.spacing.xs,
            }}
          >
            <Text variant="title">
              {viewMode === 'translation'
                ? (translationState.title ?? article.title)
                : article.title}
            </Text>
            <Text variant="caption" numberOfLines={1}>
              {formatDate(article.publishedAt ?? article.fetchedAt)}
              {article.author ? ` · ${article.author}` : ''}
            </Text>
          </View>

          <View
            style={[
              styles.toggleRow,
              {
                paddingHorizontal: theme.spacing.m,
                paddingBottom: theme.spacing.s,
                gap: theme.spacing.s,
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
        </View>
      </Animated.View>

      <View style={styles.content}>
        {showTranslation ? (
          <View style={styles.translationContent}>
            <TranslationPanel
              state={translationState}
              onTranslate={translate}
              onCancel={cancel}
              onConfigure={() => router.navigate('/settings')}
              topPadding={headerHeight}
              onScroll={handleScroll}
              webViewKey={webViewKey}
              settings={readerSettings.settings}
            />
          </View>
        ) : fullStatus === 'loading' || headerHeight === 0 ? (
          <View style={[styles.center, styles.fill]}>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="body" style={{ color: theme.colors.textMuted }}>
                {t('reader.loadingFull')}
              </Text>
            </View>
          </View>
        ) : article.contentHtml ? (
          <ReaderWebView
            key={webViewKey}
            article={article}
            topPadding={headerHeight}
            onScroll={handleScroll}
            settings={readerSettings.settings}
          />
        ) : (
          <View style={[styles.center, styles.fill]}>
            <Text variant="body" style={{ color: theme.colors.textMuted }}>
              {t('reader.contentUnavailable')}
            </Text>
          </View>
        )}
      </View>

      <ScrollToTopButton visible={scrolled} onPress={scrollToTop} />

      <ReaderSettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={readerSettings.settings}
        onChange={readerSettings.update}
      />
    </View>
  );
}

interface TranslationPanelProps {
  state: ReturnType<typeof useArticleTranslation>['state'];
  onTranslate: () => void;
  onCancel: () => void;
  onConfigure: () => void;
  topPadding: number;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  webViewKey: number;
  settings: ReaderSettings;
}

function TranslationPanel({
  state,
  onTranslate,
  onCancel,
  onConfigure,
  topPadding,
  onScroll,
  webViewKey,
  settings,
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
        key={webViewKey}
        topPadding={topPadding}
        onScroll={onScroll}
        settings={settings}
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
            marginTop: topPadding,
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
            marginTop: topPadding,
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
            marginTop: topPadding,
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
            marginTop: topPadding,
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
          marginTop: topPadding,
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
  topBlock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    overflow: 'hidden',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: -8,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
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
  translationContent: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
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
