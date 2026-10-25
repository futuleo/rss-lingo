import { Stack } from 'expo-router';
import { RootProviders } from '@app/providers/RootProviders';
import { ThemedStatusBar } from '@app/providers/ThemedStatusBar';

export default function RootLayout() {
  return (
    <RootProviders>
      <ThemedStatusBar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="feeds/[id]" />
        <Stack.Screen name="article/[id]" />
        <Stack.Screen name="faq" />
      </Stack>
    </RootProviders>
  );
}
