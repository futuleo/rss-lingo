import {
  Text as RNText,
  StyleSheet,
  type TextProps as RNTextProps,
} from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme';

export type TextVariant = 'title' | 'headline' | 'body' | 'caption';

const variantStyle = (theme: Theme, variant: TextVariant) => {
  switch (variant) {
    case 'title':
      return {
        fontSize: theme.font.title,
        fontWeight: theme.weight.bold,
      };
    case 'headline':
      return {
        fontSize: theme.font.headline,
        fontWeight: theme.weight.semibold,
      };
    case 'caption':
      return { fontSize: theme.font.caption, color: theme.colors.textMuted };
    default:
      return { fontSize: theme.font.body };
  }
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
}

export function Text({ variant = 'body', style, ...rest }: TextProps) {
  const theme = useTheme();
  return (
    <RNText {...rest} style={[styles.base, variantStyle(theme, variant), style]} />
  );
}

const styles = StyleSheet.create({
  base: {},
});
