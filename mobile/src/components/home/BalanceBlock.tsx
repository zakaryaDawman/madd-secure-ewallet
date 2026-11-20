import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../icons';
import { splitRM } from '../../utils/money';
import { colors, fonts } from '../../theme';

type Props = {
  balanceSen: number;
  hidden: boolean;
  onToggleHidden: () => void;
};

/** "Total balance" with the eye button and the big amount, cents in grey (design 05). Shows dots when hidden. */
export function BalanceBlock({ balanceSen, hidden, onToggleHidden }: Props) {
  const { main, cents } = splitRM(balanceSen);
  return (
    <View style={styles.block}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}
        onPress={onToggleHidden}
        hitSlop={10}
        style={styles.labelRow}
      >
        <Text style={styles.label}>Total balance</Text>
        <Icon name={hidden ? 'eyeOff' : 'eye'} size={18} color={colors.muted} />
      </Pressable>
      {hidden ? (
        <Text style={styles.amount}>RM ••••••</Text>
      ) : (
        <Text style={styles.amount} accessibilityLabel={`Balance ${main}${cents}`}>
          {main}
          <Text style={styles.cents}>{cents}</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  label: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted },
  amount: { fontFamily: fonts.extrabold, fontSize: 48, letterSpacing: -2, color: colors.ink, fontVariant: ['tabular-nums'] },
  cents: { color: '#9AA6C2' },
});
