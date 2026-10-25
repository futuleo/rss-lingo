import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ProviderSettingsScreen } from '@features/manage-providers';
import { Text } from '@shared/ui';
import { useTheme } from '@shared/theme';

export function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.m,
            paddingTop: insets.top + theme.spacing.s,
            paddingBottom: theme.spacing.s,
          },
        ]}
      >
        <Text variant="title">{t('settings.title')}</Text>
      </View>

      <ProviderSettingsScreen />
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
  },
});
