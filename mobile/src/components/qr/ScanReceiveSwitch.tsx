import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme';

export type QrMode = 'scan' | 'receive';

/** The Scan / Receive switch at the bottom of designs 15 and 16. The selected side is white. */
export function ScanReceiveSwitch({ value, onChange, trackColor }: { value: QrMode; onChange: (mode: QrMode) => void; trackColor: string }) {
  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      {(['scan', 'receive'] as const).map((mode) => {
        const selected = mode === value;
        return (
          <Pressable
            key={mode}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => !selected && onChange(mode)}
            style={[styles.side, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{mode === 'scan' ? 'Scan' : 'Receive'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.pill, padding: 5 },
  side: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: radius.pill },
  selected: { backgroundColor: colors.white },
  label: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  labelSelected: { color: colors.ink },
});
