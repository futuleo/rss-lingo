import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RootProviders } from '@app/providers/RootProviders';

export default function RootLayout() {
  return (
    <RootProviders>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </RootProviders>
  );
}
