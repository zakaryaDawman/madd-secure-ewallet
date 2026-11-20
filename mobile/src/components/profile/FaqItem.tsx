import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons';
import { colors, fonts } from '../../theme';

/** One Help question (design 44). Tap to show or hide the answer. */
export function FaqItem({ question, answer, startOpen = false }: { question: string; answer: string; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <View style={styles.item}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)} style={styles.head}>
        <Text style={styles.question}>{question}</Text>
        {!open && <Icon name="chevronDown" size={20} color={colors.muted} />}
      </Pressable>
      {open && <Text style={styles.answer}>{answer}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#ECEFF7', gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  question: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  answer: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
});
