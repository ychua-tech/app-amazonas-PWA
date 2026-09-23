import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Estado } from '../../src/components/Estado';
import { ProdutoImagem } from '../../src/components/ProdutoImagem';
import { SeletorCompra } from '../../src/components/SeletorCompra';
import { Skeleton } from '../../src/components/Skeleton';
import { Botao, Chip } from '../../src/components/ui';
import { useCarrinho } from '../../src/context/CarrinhoContext';
import { useClube } from '../../src/context/ClubeContext';
import { formatarPeso, ofertaParaCompravel } from '../../src/data/compravel';
import { useContagemRegressiva } from '../../src/hooks/useContagemRegressiva';
import { useOferta } from '../../src/hooks/useOfertas';
import { brl, descontoPercent, restanteDeMs, validadeCurta } from '../../src/lib/format';
import { colors, font, radius, spacing } from '../../src/theme';

export default function OfertaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { socio } = useClube();
  const { oferta, carregando } = useOferta(id);
  const { restanteMs, encerrada } = useContagemRegressiva(oferta?.relampagoFim);
  const { itens, adicionar, totalLinha, totalItens } = useCarrinho();

  if (carregando) {
    return (
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Skeleton style={{ height: 240, borderRadius: radius.md }} />
        <Skeleton style={{ width: '70%', height: 24 }} />
        <Skeleton style={{ width: '100%', height: 60 }} />
      </View>
    );
  }

  if (!oferta) {
    return (
      <Estado
        icone="pricetag-outline"
        titulo="Oferta não encontrada"
        descricao="Ela pode ter sido encerrada ou o estoque acabou."
        acao={{ titulo: 'Ver outras ofertas', onPress: () => router.replace('/') }}
      />
    );
  }

  const item = ofertaParaCompravel(oferta);
  const desc = descontoPercent(oferta.precoNormal, oferta.precoOferta);
  const temPrecoClube = oferta.precoClube != null;
  const linhas = itens.filter((l) => l.produtoId === oferta.id);

  return (
    <>
      <Stack.Screen options={{ title: oferta.categoria }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + (totalItens > 0 ? 100 : 24) }}
        keyboardShouldPersistTaps="handled"
      >
        <ProdutoImagem uri={oferta.imagem} categoria={oferta.categoria} height={240} />

        <View style={styles.body}>
          <View style={styles.chips}>
            {desc > 0 && (
              <Chip texto={`-${desc}%`} cor={colors.danger} corTexto={colors.onPrimary} />
            )}
            {oferta.relampago && !encerrada && restanteMs != null && (
              <Chip
                texto={`⚡ ${restanteDeMs(restanteMs)}`}
                cor={colors.primaryDeep}
                corTexto={colors.onPrimary}
              />
            )}
          </View>

          <Text style={styles.nome}>{oferta.nome}</Text>
          <Text style={styles.descricao}>{oferta.descricao}</Text>

          <View style={styles.precoBox}>
            <View style={styles.precoLinha}>
              <Text style={styles.precoAtual}>{brl(oferta.precoOferta)}</Text>
              <Text style={styles.unidade}>
                {item.modoVenda === 'peso' ? ' / kg' : ` / ${oferta.unidade}`}
              </Text>
            </View>
            <Text style={styles.precoNormal}>de {brl(oferta.precoNormal)}</Text>

            {temPrecoClube && (
              <View style={styles.clubeBox}>
                <Ionicons name="heart" size={14} color={colors.primary} />
                <Text style={styles.clubeTexto}>
                  {socio
                    ? `Preço de sócio: ${brl(oferta.precoClube!)}`
                    : `Sócio Clube Amazonas paga ${brl(oferta.precoClube!)}`}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.validade}>
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />{' '}
            {validadeCurta(oferta.validade)}
          </Text>

          <View style={styles.divisor} />

          <SeletorCompra
            item={item}
            onConfirmar={(e) =>
              adicionar(item, e)
            }
          />

          {linhas.length > 0 && (
            <View style={styles.jaBox}>
              <Text style={styles.jaTitulo}>Já no carrinho</Text>
              {linhas.map((l) => (
                <View key={l.linhaId} style={styles.jaLinha}>
                  <Text style={styles.jaTexto}>
                    {l.modo === 'peso'
                      ? `${l.quantidade > 1 ? `${l.quantidade}× ` : ''}${formatarPeso(l.pesoKg ?? 0)}`
                      : `${l.quantidade} ${l.unidade}`}
                  </Text>
                  <Text style={styles.jaValor}>{brl(totalLinha(l))}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.infoLoja}>
            <Ionicons name="storefront-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoLojaTexto}>
              Preço válido nas lojas de Juína. Sujeito a disponibilidade de estoque.
            </Text>
          </View>
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
  chips: { flexDirection: 'row', gap: spacing.sm },
  nome: { fontSize: font.sizeXl, fontWeight: font.weightBold, color: colors.text },
  descricao: { fontSize: font.sizeSm, color: colors.textMuted, lineHeight: 20 },
  precoBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: 2,
  },
  precoLinha: { flexDirection: 'row', alignItems: 'baseline' },
  precoAtual: { fontSize: font.size2xl, fontWeight: font.weightBold, color: colors.primary },
  unidade: { fontSize: font.sizeSm, color: colors.textMuted },
  precoNormal: { fontSize: font.sizeXs, color: colors.textSubtle, textDecorationLine: 'line-through' },
  clubeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  clubeTexto: { flex: 1, fontSize: font.sizeXs, color: colors.primaryDark, fontWeight: font.weightMedium },
  validade: { fontSize: font.sizeXs, color: colors.textSubtle, marginTop: spacing.sm },
  divisor: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  jaBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  jaTitulo: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text, marginBottom: spacing.xs },
  jaLinha: { flexDirection: 'row', justifyContent: 'space-between' },
  jaTexto: { fontSize: font.sizeSm, color: colors.textMuted },
  jaValor: { fontSize: font.sizeSm, color: colors.text, fontWeight: font.weightMedium },
  infoLoja: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginTop: spacing.lg,
  },
  infoLojaTexto: { flex: 1, fontSize: font.sizeXs, color: colors.textSubtle },
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
