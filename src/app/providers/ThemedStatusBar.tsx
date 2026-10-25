import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@shared/theme';

/**
 * Renders the status bar with a text color that follows the manually chosen
 * theme (not the system), so the clock/battery stay readable in dark mode.
 */
export function ThemedStatusBar() {
  const theme = useTheme();
  return <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />;
}
