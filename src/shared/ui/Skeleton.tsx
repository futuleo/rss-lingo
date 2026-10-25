import { useEffect, useRef } from 'react';
import {
  Animated,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';

export interface SkeletonProps {
  /** Size and shape overrides; pass width/height here. */
  style?: StyleProp<ViewStyle>;
}

/**
 * A pulsing placeholder block used while content is loading. Size (and any
 * overrides) come from `style` so callers can match the layout they stand in
 * for, preventing layout jumps once the real content arrives.
 */
export function Skeleton({ style }: SkeletonProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.skeleton,
          borderRadius: theme.radii.s,
          opacity,
        },
        style,
      ]}
    />
  );
}
