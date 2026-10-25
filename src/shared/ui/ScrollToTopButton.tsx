import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme';

export interface ScrollToTopButtonProps {
  visible: boolean;
  onPress: () => void;
  /**
   * Extra bottom offset for the safe area. Full-screen (stack) screens rely
   * on the device safe-area inset by default. Tab screens already sit above
   * the tab bar, so they pass `0`.
   */
  bottomInset?: number;
}

/**
 * Floating scroll-to-top affordance shown over long, scrollable surfaces.
 * Rendered absolutely in the bottom-right corner above the safe area.
 */
export function ScrollToTopButton({
  visible,
  onPress,
  bottomInset,
}: ScrollToTopButtonProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.scrollToTop')}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.full,
          right: theme.spacing.m,
          bottom: (bottomInset ?? insets.bottom) + theme.spacing.m,
        },
        pressed && styles.pressed,
      ]}
    >
      <Feather name="arrow-up" size={20} color={theme.colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
