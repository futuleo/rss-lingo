import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Button } from './Button';

export interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedToggleProps<T extends string> {
  options: readonly SegmentedToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * A row of buttons that selects one of several mutually exclusive options.
 * The active option renders as a primary button, the rest as secondary.
 */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedToggleProps<T>) {
  return (
    <View style={[styles.row, style]}>
      {options.map((option) => (
        <Button
          key={option.value}
          label={option.label}
          variant={option.value === value ? 'primary' : 'secondary'}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
