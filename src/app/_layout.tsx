import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@shared/theme';
import { initI18n } from '@shared/i18n';
import { DatabaseGate } from './ui/DatabaseGate';

initI18n();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <DatabaseGate>
          <Stack screenOptions={{ headerShown: false }} />
        </DatabaseGate>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
