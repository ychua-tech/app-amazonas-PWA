import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, spacing } from '../theme';
import { Botao } from './ui';

/** Estado vazio ou de erro, com ação opcional de tentar de novo. */
export function Estado({
  icone,
  titulo,
  descricao,
  acao,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao?: string;
  acao?: { titulo: string; onPress: () => void };
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.circulo}>
        <Ionicons name={icone} size={28} color={colors.primary} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      {descricao && <Text style={styles.descricao}>{descricao}</Text>}
      {acao && (
        <Botao
          titulo={acao.titulo}
          variante="outline"
          onPress={acao.onPress}
          style={{ marginTop: spacing.md, alignSelf: 'center', paddingHorizontal: spacing.xl }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, gap: spacing.sm },
  circulo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  titulo: { fontSize: font.sizeLg, fontWeight: font.weightBold, color: colors.text, textAlign: 'center' },
  descricao: { fontSize: font.sizeSm, color: colors.textMuted, textAlign: 'center', maxWidth: 280 },
});
