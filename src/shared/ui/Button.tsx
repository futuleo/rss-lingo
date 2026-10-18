import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text, type TextProps } from './Text';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  labelVariant?: TextProps['variant'];
}

export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  labelVariant = 'body',
}: ButtonProps) {
  const theme = useTheme();

  const containerStyle: ViewStyle[] = [
    styles.base,
    {
      backgroundColor:
        variant === 'primary' ? theme.colors.primary : theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.m,
      paddingHorizontal: theme.spacing.l,
      paddingVertical: theme.spacing.s + 4,
    },
    ...(variant === 'secondary' ? [styles.secondary] : []),
    ...(disabled ? [styles.disabled] : []),
  ];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
    >
      <Text
        variant={labelVariant}
        style={{
          color: variant === 'primary' ? theme.colors.primaryText : theme.colors.text,
          fontWeight: theme.weight.medium,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
