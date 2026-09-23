import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius } from '../theme';

export function Stepper({
  valor,
  onMudar,
  tamanho = 'md',
}: {
  valor: number;
  onMudar: (novo: number) => void;
  tamanho?: 'sm' | 'md';
}) {
  const sm = tamanho === 'sm';
  const btn = sm ? 30 : 38;
  const alterar = (delta: number) => {
    Haptics.selectionAsync();
    onMudar(Math.max(0, valor + delta));
  };

  return (
    <View style={[styles.wrap, { height: btn }]}>
      <Pressable
        onPress={() => alterar(-1)}
        style={[styles.btn, { width: btn, height: btn }]}
        hitSlop={6}
      >
        <Ionicons
          name={valor <= 1 ? 'trash-outline' : 'remove'}
          size={sm ? 15 : 18}
          color={colors.primary}
        />
      </Pressable>
      <Text style={[styles.valor, sm && { fontSize: font.sizeSm, minWidth: 22 }]}>
        {valor}
      </Text>
      <Pressable
        onPress={() => alterar(1)}
        style={[styles.btn, { width: btn, height: btn }]}
        hitSlop={6}
      >
        <Ionicons name="add" size={sm ? 15 : 18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
  },
  btn: { alignItems: 'center', justifyContent: 'center' },
  valor: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: font.sizeMd,
    fontWeight: font.weightBold,
    color: colors.text,
  },
});
