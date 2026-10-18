import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ProviderSettingsScreen } from '@features/manage-providers';
import { Text } from '@shared/ui';
import { useTheme } from '@shared/theme';

export function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.m,
            paddingTop: 48,
            paddingBottom: theme.spacing.s,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={{ color: theme.colors.primary }}>← {t('settings.back')}</Text>
        </Pressable>
        <Text variant="title">{t('settings.title')}</Text>
        <View style={styles.placeholder} />
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
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 64,
  },
  placeholder: {
    minWidth: 64,
  },
});
