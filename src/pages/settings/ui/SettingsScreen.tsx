import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { ProviderSettingsScreen } from '@features/manage-providers';
import { Text } from '@shared/ui';
import {
  palettes,
  useTheme,
  useThemePreference,
  type ThemePreference,
} from '@shared/theme';

const THEME_OPTIONS: { value: ThemePreference; labelKey: string }[] = [
  { value: 'system', labelKey: 'settings.themeSystem' },
  { value: 'light', labelKey: 'settings.themeLight' },
  { value: 'sepia', labelKey: 'settings.themeSepia' },
  { value: 'dark', labelKey: 'settings.themeDark' },
];

/** Solid swatch background, or `'split'` for the follow-system option. */
function themeSwatch(value: ThemePreference): string | 'split' {
  switch (value) {
    case 'light':
      return palettes.light.background;
    case 'sepia':
      return palettes.sepia.background;
    case 'dark':
      return palettes.dark.background;
    default:
      return 'split';
  }
}

/** Check-mark ink that contrasts with each solid swatch background. */
function themeSwatchInk(value: ThemePreference): string {
  switch (value) {
    case 'light':
      return palettes.light.text;
    case 'sepia':
      return palettes.sepia.text;
    case 'dark':
      return palettes.dark.text;
    default:
      return palettes.light.text;
  }
}

export function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ProviderSettingsScreen
        header={
          <View style={{ gap: theme.spacing.m }}>
            <Text variant="title">{t('settings.title')}</Text>
            <View style={{ gap: theme.spacing.s }}>
              <Text variant="caption">{t('settings.themeLabel')}</Text>
              <View style={styles.themeRow}>
                {THEME_OPTIONS.map((option) => {
                  const selected = preference === option.value;
                  const swatch = themeSwatch(option.value);
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => setPreference(option.value)}
                      style={styles.themeOption}
                    >
                      <View
                        style={[
                          styles.swatch,
                          {
                            backgroundColor: swatch === 'split' ? undefined : swatch,
                            borderColor: selected
                              ? theme.colors.primary
                              : theme.colors.border,
                            borderWidth: selected ? 3 : 1,
                          },
                        ]}
                      >
                        {swatch === 'split' ? (
                          <View style={styles.splitRow}>
                            <View
                              style={[
                                styles.splitHalf,
                                { backgroundColor: palettes.light.background },
                              ]}
                            />
                            <View
                              style={[
                                styles.splitHalf,
                                { backgroundColor: palettes.dark.background },
                              ]}
                            />
                          </View>
                        ) : selected ? (
                          <Feather
                            name="check"
                            size={18}
                            color={themeSwatchInk(option.value)}
                          />
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
                        {t(option.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    overflow: 'hidden',
  },
  splitRow: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  splitHalf: {
    flex: 1,
  },
});
