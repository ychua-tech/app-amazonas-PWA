import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCarrinho } from '../context/CarrinhoContext';
import type { ItemCompravel } from '../data/types';
import { brl } from '../lib/format';
import { colors, font, radius, spacing } from '../theme';
import { ProdutoImagem } from './ProdutoImagem';
import { Stepper } from './Stepper';

/** Linha de produto do catálogo. Unidade: +/- rápido. Peso: abre o detalhe. */
export function ProdutoRow({ item }: { item: ItemCompravel }) {
  const router = useRouter();
  const { quantidadeDe, adicionar, itens, definirQuantidade } = useCarrinho();
  const qtd = quantidadeDe(item.id);
  const porPeso = item.modoVenda !== 'unidade';

  const linhaUnidade = itens.find(
    (l) => l.produtoId === item.id && l.modo === 'unidade',
  );

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/produto/${item.id}`)}
    >
      <ProdutoImagem
        uri={item.imagem}
        categoria={item.categoria}
        height={64}
        width={64}
        radius={radius.md}
        iconeTamanho={24}
      />

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.nome} numberOfLines={2}>
          {item.nome}
        </Text>
        <View style={styles.precoRow}>
          <Text style={styles.preco}>{brl(item.preco)}</Text>
          <Text style={styles.unidade}>
            {porPeso && item.modoVenda === 'peso' ? ' /kg' : ` / ${item.unidade}`}
          </Text>
        </View>
        {item.precoClube != null && (
          <Text style={styles.socio}>Sócio {brl(item.precoClube)}</Text>
        )}
      </View>

      {porPeso ? (
        <Pressable
          onPress={() => router.push(`/produto/${item.id}`)}
          style={styles.escolherBtn}
          hitSlop={6}
        >
          <Ionicons name="options-outline" size={16} color={colors.primary} />
          <Text style={styles.escolherTexto}>{qtd > 0 ? 'No carrinho' : 'Escolher'}</Text>
        </Pressable>
      ) : qtd === 0 ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            adicionar(item, { modo: 'unidade' });
          }}
          style={styles.addBtn}
          hitSlop={6}
        >
          <Ionicons name="add" size={22} color={colors.onPrimary} />
        </Pressable>
      ) : (
        <Stepper
          valor={qtd}
          tamanho="sm"
          onMudar={(n) =>
            linhaUnidade && definirQuantidade(linhaUnidade.linhaId, n)
          }
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  nome: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text, lineHeight: 18 },
  precoRow: { flexDirection: 'row', alignItems: 'baseline' },
  preco: { fontSize: font.sizeMd, fontWeight: font.weightBold, color: colors.text },
  unidade: { fontSize: font.sizeXs, color: colors.textMuted },
  socio: { fontSize: font.sizeXs, color: colors.primaryDark, fontWeight: font.weightBold },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escolherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 38,
  },
  escolherTexto: { fontSize: font.sizeXs, color: colors.primary, fontWeight: font.weightBold },
});
