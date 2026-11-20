import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { InboxTab } from '../../api/notifications';
import { colors, fonts } from '../../theme';

type Props = { tab: InboxTab; securityCount: number; onChange: (tab: InboxTab) => void };

/** The All / "Security · 3" switch at the top of the Inbox (designs 18 and 32). The count is unread security items. */
export function InboxSwitch({ tab, securityCount, onChange }: Props) {
  const options: { value: InboxTab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'security', label: securityCount > 0 ? `Security · ${securityCount}` : 'Security' },
  ];
  return (
    <View style={styles.track}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === o.value }}
          onPress={() => onChange(o.value)}
          style={[styles.option, tab === o.value && styles.selected]}
        >
          <Text style={[styles.label, tab === o.value && styles.selectedLabel]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 999, padding: 5 },
  option: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 999 },
  selected: { backgroundColor: colors.white, shadowColor: colors.ink, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  label: { fontFamily: fonts.bold, fontSize: 16, color: colors.muted },
  selectedLabel: { color: colors.ink },
});
