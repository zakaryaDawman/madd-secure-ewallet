import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, fonts } from '../../theme';

const LINE = 48;
const STAGGER = 110;

/**
 * Big headline whose words slide up one by one, then a marker sweeps under the last word (welcome tips, option C).
 * Plays again whenever `words` changes (a new tip).
 */
export function KineticWords({ words }: { words: string[] }) {
  const [rise] = useState(() => words.map(() => new Animated.Value(0)));
  const [marker] = useState(() => new Animated.Value(0));

  // Each word rises in turn, then the marker grows from the left under the last word.
  useEffect(() => {
    const show = Animated.sequence([
      Animated.stagger(STAGGER, rise.map((v) => Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }))),
      Animated.timing(marker, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    show.start();
    return () => show.stop();
  }, [rise, marker]);

  return (
    <View>
      {words.map((word, i) => {
        const last = i === words.length - 1;
        return (
          <View key={`${word}-${i}`} style={styles.line}>
            <Animated.View style={{ transform: [{ translateY: rise[i].interpolate({ inputRange: [0, 1], outputRange: [LINE, 0] }) }] }}>
              {last && <Animated.View style={[styles.marker, { transform: [{ scaleX: marker }] }]} />}
              <Animated.Text style={styles.word}>{word}</Animated.Text>
            </Animated.View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { height: LINE, overflow: 'hidden', alignItems: 'flex-start' },
  word: { fontFamily: fonts.extrabold, fontSize: 44, lineHeight: LINE, letterSpacing: -1.6, color: colors.white },
  marker: { position: 'absolute', left: -4, right: -4, bottom: 6, height: 14, backgroundColor: colors.highlight, opacity: 0.75, transformOrigin: 'left' },
});
