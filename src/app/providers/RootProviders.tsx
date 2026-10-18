import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@shared/theme';
import { initI18n } from '@shared/i18n';
import { DatabaseGate } from '@shared/lib/db';
import type { PropsWithChildren } from 'react';

initI18n();

export function RootProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DatabaseGate>{children}</DatabaseGate>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
