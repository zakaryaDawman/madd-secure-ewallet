import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '../icons';
import { colors, fonts, radius } from '../../theme';

type Action = 'send' | 'receive' | 'scan';

const ACTIONS: { key: Action; label: string; icon: IconName; primary: boolean }[] = [
  { key: 'send', label: 'Send', icon: 'send', primary: true },
  { key: 'receive', label: 'Receive', icon: 'receive', primary: false },
  { key: 'scan', label: 'Scan', icon: 'scan', primary: false },
];

/** The three pill buttons under the balance (design 05): Send (blue), Receive and Scan (light blue). */
export function QuickActions({ onPress }: { onPress: (action: Action) => void }) {
  return (
    <View style={styles.row}>
      {ACTIONS.map((a) => {
        const fg = a.primary ? colors.white : colors.blueDark;
        return (
          <Pressable
            key={a.key}
            accessibilityRole="button"
            onPress={() => onPress(a.key)}
            style={({ pressed }) => [styles.pill, { backgroundColor: a.primary ? colors.blue : colors.tint }, pressed && styles.pressed]}
          >
            <Icon name={a.icon} size={18} color={fg} strokeWidth={2.4} />
            <Text style={[styles.label, { color: fg }]}>{a.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.pill, paddingVertical: 14 },
  pressed: { opacity: 0.85 },
  label: { fontFamily: fonts.bold, fontSize: 15 },
});
