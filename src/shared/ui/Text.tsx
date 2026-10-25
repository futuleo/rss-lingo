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
        lineHeight: theme.lineHeight.title,
        fontWeight: theme.weight.bold,
      };
    case 'headline':
      return {
        fontSize: theme.font.headline,
        lineHeight: theme.lineHeight.headline,
        fontWeight: theme.weight.semibold,
      };
    case 'caption':
      return {
        fontSize: theme.font.caption,
        lineHeight: theme.lineHeight.caption,
        color: theme.colors.textMuted,
      };
    default:
      return {
        fontSize: theme.font.body,
        lineHeight: theme.lineHeight.body,
      };
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
