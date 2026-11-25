import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme';

type Props<Value extends string> = { choices: { value: Value; label: string }[]; value: Value; onChange: (value: Value) => void };

/** A row of chips where one is picked (dark), styled like the History filter chips (design 17). Wraps on small phones. */
export function ChoiceChips<Value extends string>({ choices, value, onChange }: Props<Value>) {
  return (
    <View style={styles.row}>
      {choices.map((choice) => {
        const selected = choice.value === value;
        return (
          <Pressable
            key={choice.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(choice.value)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{choice.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.background },
  chipSelected: { backgroundColor: colors.ink },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  labelSelected: { color: colors.white },
});
