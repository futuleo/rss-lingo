import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface EmptyStateProps {
  symbol: string;
  title: string;
  hint?: string;
}

export function EmptyState({ symbol, title, hint }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.symbol, { color: theme.colors.primary }]}>{symbol}</Text>
      <Text variant="headline">{title}</Text>
      {hint ? (
        <Text variant="body" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 48,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  symbol: {
    fontSize: 40,
    lineHeight: 48,
  },
  hint: {
    textAlign: 'center',
  },
});
