import { useCallback, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const DEFAULT_THRESHOLD = 120;

/**
 * Tracks a scrollable surface's vertical offset and reports whether the
 * scroll-to-top affordance should be visible. Screens attach the returned
 * `onScroll` handler to their FlatList / ScrollView / WebView.
 */
export function useScrollToTop(threshold: number = DEFAULT_THRESHOLD) {
  const [visible, setVisible] = useState(false);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      setVisible((prev) => {
        const next = y > threshold;
        return prev === next ? prev : next;
      });
    },
    [threshold],
  );

  const reset = useCallback(() => setVisible(false), []);

  return { onScroll, visible, reset };
}
