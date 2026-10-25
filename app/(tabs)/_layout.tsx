import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shared/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: {
          fontSize: theme.font.caption,
          fontWeight: theme.weight.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.feeds'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="rss" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t('tabs.saved'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="bookmark" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
