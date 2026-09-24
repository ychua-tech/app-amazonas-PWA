import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Estado } from '../../src/components/Estado';
import { ProdutoImagem } from '../../src/components/ProdutoImagem';
import { SeletorCompra } from '../../src/components/SeletorCompra';
import { Botao } from '../../src/components/ui';
import { useCarrinho } from '../../src/context/CarrinhoContext';
import { useCatalogo } from '../../src/context/CatalogoContext';
import { formatarPeso, produtoParaCompravel } from '../../src/data/compravel';
import { getProduto } from '../../src/data/catalogo';
import { brl } from '../../src/lib/format';
import { colors, font, radius, spacing } from '../../src/theme';

export default function ProdutoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { itens, adicionar, totalLinha, totalItens } = useCarrinho();
  const { produtos } = useCatalogo();

  const produto = id ? getProduto(produtos, id) : undefined;

  if (!produto) {
    return (
      <Estado
        icone="cube-outline"
        titulo="Produto não encontrado"
        descricao="Ele pode ter saído do catálogo."
        acao={{ titulo: 'Voltar ao mercado', onPress: () => router.replace('/mercado') }}
      />
    );
  }

  const item = produtoParaCompravel(produto);
  const linhas = itens.filter((l) => l.produtoId === produto.id);
  const modoLabel =
    item.modoVenda === 'peso'
      ? 'Vendido por peso'
      : item.modoVenda === 'unidade_ou_peso'
        ? 'Você escolhe: por unidade ou por peso'
        : 'Vendido por unidade';

  return (
    <>
      <Stack.Screen options={{ title: produto.categoria }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <ProdutoImagem uri={item.imagem} categoria={item.categoria} height={220} />

        <View style={styles.body}>
          {produto.marca && <Text style={styles.marca}>{produto.marca.toUpperCase()}</Text>}
          <Text style={styles.nome}>{produto.nome}</Text>

          <View style={styles.precoRow}>
            <Text style={styles.preco}>{brl(item.preco)}</Text>
            <Text style={styles.unidade}>
              {item.modoVenda === 'peso' ? ' / kg' : ` / ${item.unidade}`}
            </Text>
          </View>

          <View style={styles.modoBox}>
            <Ionicons
              name={item.modoVenda === 'unidade' ? 'cube-outline' : 'scale-outline'}
              size={16}
              color={colors.textMuted}
            />
            <Text style={styles.modoTexto}>{modoLabel}</Text>
          </View>

          {produto.descricao && <Text style={styles.descricao}>{produto.descricao}</Text>}

          <View style={styles.divisor} />

          <SeletorCompra
            item={item}
            onConfirmar={(e) =>
              adicionar(item, e)
            }
          />

          {linhas.length > 0 && (
            <View style={styles.jaNoCarrinho}>
              <Text style={styles.jaTitulo}>Já no carrinho</Text>
              {linhas.map((l) => (
                <View key={l.linhaId} style={styles.jaLinha}>
                  <Text style={styles.jaLinhaTexto}>
                    {l.modo === 'peso'
                      ? `${l.quantidade > 1 ? `${l.quantidade}× ` : ''}${formatarPeso(l.pesoKg ?? 0)}`
                      : `${l.quantidade} ${l.unidade}`}
                  </Text>
                  <Text style={styles.jaLinhaValor}>{brl(totalLinha(l))}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {totalItens > 0 && (
        <View style={[styles.rodape, { paddingBottom: insets.bottom + spacing.md }]}>
          <Botao
            titulo="Ir para o carrinho"
            variante="outline"
            onPress={() => router.push('/carrinho')}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.sm },
  marca: { fontSize: font.sizeXs, color: colors.textSubtle, fontWeight: font.weightBold, letterSpacing: 0.8 },
  nome: { fontSize: font.sizeXl, fontWeight: font.weightBold, color: colors.text },
  precoRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.xs },
  preco: { fontSize: font.size2xl, fontWeight: font.weightBold, color: colors.primary },
  unidade: { fontSize: font.sizeSm, color: colors.textMuted },
  modoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modoTexto: { fontSize: font.sizeSm, color: colors.textMuted },
  descricao: { fontSize: font.sizeSm, color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs },
  divisor: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },

  jaNoCarrinho: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  jaTitulo: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text, marginBottom: spacing.xs },
  jaLinha: { flexDirection: 'row', justifyContent: 'space-between' },
  jaLinhaTexto: { fontSize: font.sizeSm, color: colors.textMuted },
  jaLinhaValor: { fontSize: font.sizeSm, color: colors.text, fontWeight: font.weightMedium },

  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
  },
});
