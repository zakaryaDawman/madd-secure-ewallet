import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { RecentRecipient } from '../../api/recipients';
import { PersonAvatar } from '../PersonAvatar';
import { colors, fonts } from '../../theme';

/** Horizontal row of people the user paid recently (design 06), each a big avatar with a first name. */
export function RecentRecipients({ people, onPick }: { people: RecentRecipient[]; onPick: (person: RecentRecipient) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {people.map((p) => (
        <Pressable key={p.phone} accessibilityRole="button" accessibilityLabel={`Send to ${p.firstName}`} onPress={() => onPick(p)} style={styles.item}>
          <PersonAvatar name={p.maskedName.replace(/\*/g, '')} size={58} />
          <Text style={styles.name} numberOfLines={1}>{p.firstName}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 18 },
  item: { alignItems: 'center', gap: 8, width: 62 },
  name: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
});
