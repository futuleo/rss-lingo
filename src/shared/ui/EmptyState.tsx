import { StyleSheet, View } from 'react-native';
import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface EmptyStateProps {
  icon: ComponentProps<typeof Feather>['name'];
  title: string;
  hint?: string;
}

export function EmptyState({ icon, title, hint }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Feather name={icon} size={40} color={theme.colors.textMuted} />
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
  hint: {
    textAlign: 'center',
  },
});
