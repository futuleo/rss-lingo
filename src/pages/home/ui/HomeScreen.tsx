import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@shared/ui';
import { useTheme } from '@shared/theme';

export function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Text variant="title">{t('app.title')}</Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      <Text variant="caption">{t('home.comingSoon')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  subtitle: {
    textAlign: 'center',
  },
});
