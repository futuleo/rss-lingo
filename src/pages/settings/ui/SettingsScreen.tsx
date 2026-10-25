import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProviderSettingsScreen } from '@features/manage-providers';
import { Text } from '@shared/ui';
import {
  useTheme,
  useThemePreference,
  type ThemePreference,
} from '@shared/theme';

const THEME_OPTIONS: { value: ThemePreference; labelKey: string }[] = [
  { value: 'system', labelKey: 'settings.themeSystem' },
  { value: 'light', labelKey: 'settings.themeLight' },
  { value: 'dark', labelKey: 'settings.themeDark' },
];

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
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => setPreference(option.value)}
                      style={[
                        styles.themeChip,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  themeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
});
