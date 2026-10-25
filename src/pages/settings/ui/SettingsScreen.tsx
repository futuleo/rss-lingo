import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProviderSettingsScreen } from '@features/manage-providers';
import { Text } from '@shared/ui';
import { useTheme } from '@shared/theme';

export function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ProviderSettingsScreen
        header={<Text variant="title">{t('settings.title')}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
