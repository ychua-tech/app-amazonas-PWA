import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

/** Bloco cinza pulsante para carregamento. */
export function Skeleton({ style }: { style?: ViewStyle }) {
  const opacidade = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacidade, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacidade]);

  return <Animated.View style={[styles.base, { opacity: opacidade }, style]} />;
}

/** Placeholder de um card de oferta. */
export function OfertaCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton style={{ height: 150, borderRadius: 0 }} />
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <Skeleton style={{ width: 90, height: 12 }} />
        <Skeleton style={{ width: '80%', height: 16 }} />
        <Skeleton style={{ width: 120, height: 22 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.border, borderRadius: radius.sm },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
