import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  LINE_HEIGHT_OPTIONS,
  READER_FONT_SIZE_MAX,
  READER_FONT_SIZE_MIN,
  READER_FONTS,
  READER_THEMES,
  readerThemeSwatch,
  resolveReaderPalette,
  type ReaderSettings,
  type ReaderThemeId,
} from '@entities/reader-settings';
import { Text } from '@shared/ui';
import { useTheme } from '@shared/theme';

export interface ReaderSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onChange: (patch: Partial<ReaderSettings>) => void;
}

/**
 * Bottom sheet with the article appearance controls, Apple Books style:
 * text size stepper, font, reading theme, line spacing, and justification.
 */
export function ReaderSettingsSheet({
  visible,
  onClose,
  settings,
  onChange,
}: ReaderSettingsSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const canDecrease = settings.fontSize > READER_FONT_SIZE_MIN;
  const canIncrease = settings.fontSize < READER_FONT_SIZE_MAX;

  // Preview "Aa" scaled with the chosen size so it doubles as a live hint.
  const previewSize = 16 + (settings.fontSize - READER_FONT_SIZE_MIN) / 2;

  const swatchInk = (id: ReaderThemeId) =>
    resolveReaderPalette({ ...settings, themeId: id }, theme).text;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('reader.closeSettings')}
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              paddingBottom: insets.bottom + theme.spacing.m,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingHorizontal: theme.spacing.m, gap: theme.spacing.l },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <Text variant="headline">{t('reader.settings')}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('reader.closeSettings')}
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
              >
                <Feather name="x" size={22} color={theme.colors.textMuted} />
              </Pressable>
            </View>

            <View style={{ gap: theme.spacing.s }}>
              <Text variant="caption">{t('reader.sizeLabel')}</Text>
              <View style={styles.sizeRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('reader.decreaseSize')}
                  disabled={!canDecrease}
                  onPress={() => onChange({ fontSize: settings.fontSize - 1 })}
                  style={({ pressed }) => [
                    styles.sizeButton,
                    { borderColor: theme.colors.border },
                    !canDecrease && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.sizeGlyphSmall}>A</Text>
                </Pressable>
                <View style={styles.sizePreview}>
                  <Text variant="headline" style={{ fontSize: previewSize }}>
                    Aa
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('reader.increaseSize')}
                  disabled={!canIncrease}
                  onPress={() => onChange({ fontSize: settings.fontSize + 1 })}
                  style={({ pressed }) => [
                    styles.sizeButton,
                    { borderColor: theme.colors.border },
                    !canIncrease && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.sizeGlyphLarge}>A</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ gap: theme.spacing.s }}>
              <Text variant="caption">{t('reader.fontLabel')}</Text>
              <View style={styles.wrapRow}>
                {READER_FONTS.map((font) => {
                  const selected = settings.fontId === font.id;
                  return (
                    <Pressable
                      key={font.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => onChange({ fontId: font.id })}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected
                            ? theme.colors.primary
                            : theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selected
                            ? theme.colors.primaryText
                            : theme.colors.text,
                        }}
                      >
                        {t(font.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: theme.spacing.s }}>
              <Text variant="caption">{t('reader.themeLabel')}</Text>
              <View style={styles.themeRow}>
                {READER_THEMES.map((item) => {
                  const selected = settings.themeId === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => onChange({ themeId: item.id })}
                      style={styles.themeOption}
                    >
                      <View
                        style={[
                          styles.swatch,
                          {
                            backgroundColor: readerThemeSwatch(item.id, theme),
                            borderColor: selected
                              ? theme.colors.primary
                              : theme.colors.border,
                            borderWidth: selected ? 3 : 1,
                          },
                        ]}
                      >
                        {selected ? (
                          <Feather name="check" size={18} color={swatchInk(item.id)} />
                        ) : null}
                      </View>
                      <Text
                        variant="caption"
                        style={{
                          color: selected
                            ? theme.colors.primary
                            : theme.colors.textMuted,
                        }}
                      >
                        {t(item.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: theme.spacing.s }}>
              <Text variant="caption">{t('reader.lineHeightLabel')}</Text>
              <View style={styles.wrapRow}>
                {LINE_HEIGHT_OPTIONS.map((option) => {
                  const selected = settings.lineHeightId === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => onChange({ lineHeightId: option.id })}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected
                            ? theme.colors.primary
                            : theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selected
                            ? theme.colors.primaryText
                            : theme.colors.text,
                        }}
                      >
                        {t(option.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.justifyRow}>
              <Text variant="body">{t('reader.justifyLabel')}</Text>
              <Switch
                accessibilityLabel={t('reader.justifyLabel')}
                value={settings.justify}
                onValueChange={(value) => onChange({ justify: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  content: {
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 44,
    height: 44,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sizeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
  },
  sizePreview: {
    minWidth: 64,
    alignItems: 'center',
  },
  sizeGlyphSmall: {
    fontSize: 15,
    lineHeight: 20,
  },
  sizeGlyphLarge: {
    fontSize: 26,
    lineHeight: 32,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOption: {
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  justifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
