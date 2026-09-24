import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCarrinho } from '../context/CarrinhoContext';
import { ofertaParaCompravel } from '../data/compravel';
import type { Oferta } from '../data/types';
import { useContagemRegressiva } from '../hooks/useContagemRegressiva';
import { brl, descontoPercent, restanteDeMs, validadeCurta } from '../lib/format';
import { colors, font, radius, shadow, spacing } from '../theme';
import { ProdutoImagem } from './ProdutoImagem';
import { Stepper } from './Stepper';

export function OfertaCard({ oferta }: { oferta: Oferta }) {
  const desc = descontoPercent(oferta.precoNormal, oferta.precoOferta);
  const { restanteMs, encerrada } = useContagemRegressiva(oferta.relampagoFim);
  const { quantidadeDe, adicionar, itens, definirQuantidade } = useCarrinho();
  const item = ofertaParaCompravel(oferta);
  const qtd = quantidadeDe(oferta.id);
  const porPeso = item.modoVenda !== 'unidade';
  const linhaUnidade = itens.find((l) => l.produtoId === oferta.id && l.modo === 'unidade');

  return (
    <Link href={`/oferta/${oferta.id}`} asChild>
      <Pressable
        onPressIn={() => Haptics.selectionAsync()}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      >
        <View style={styles.imgWrap}>
          <ProdutoImagem uri={oferta.imagem} categoria={oferta.categoria} height={148} />
          {desc > 0 && (
            <View style={styles.selo}>
              <Text style={styles.seloTexto}>-{desc}%</Text>
            </View>
          )}
          {oferta.relampago && !encerrada && (
            <View style={styles.relampago}>
              <Ionicons name="flash" size={11} color={colors.onPrimary} />
              <Text style={styles.relampagoTexto}>
                {restanteMs != null ? restanteDeMs(restanteMs) : 'relâmpago'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.categoria}>{oferta.categoria.toUpperCase()}</Text>
          <Text style={styles.nome} numberOfLines={2}>
            {oferta.nome}
          </Text>

          <View style={styles.precoRow}>
            <Text style={styles.precoOferta}>{brl(oferta.precoOferta)}</Text>
            <Text style={styles.unidade}> /{oferta.unidade}</Text>
          </View>
          {desc > 0 && <Text style={styles.precoNormal}>de {brl(oferta.precoNormal)}</Text>}

          {desc > 0 && <Text style={styles.validade}>{validadeCurta(oferta.validade)}</Text>}

          <View style={styles.acao}>
            {porPeso ? (
              <View style={[styles.addBtn, styles.addBtnOutline]}>
                <Ionicons
                  name={qtd > 0 ? 'checkmark' : 'options-outline'}
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.addTexto, { color: colors.primary }]}>
                  {qtd > 0 ? 'No carrinho' : 'Escolher peso'}
                </Text>
              </View>
            ) : qtd === 0 ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  adicionar(item, { modo: 'unidade' });
                }}
                style={({ pressed }) => [styles.addBtn, pressed && { backgroundColor: colors.primaryDark }]}
              >
                <Ionicons name="add" size={18} color={colors.onPrimary} />
                <Text style={styles.addTexto}>Adicionar</Text>
              </Pressable>
            ) : (
              <Stepper
                valor={qtd}
                tamanho="sm"
                onMudar={(n) => linhaUnidade && definirQuantidade(linhaUnidade.linhaId, n)}
              />
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  imgWrap: {
    position: 'relative',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  selo: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    ...shadow.sm,
  },
  seloTexto: {
    color: colors.onPrimary,
    fontWeight: font.weightBold,
    fontSize: font.sizeXs,
  },
  relampago: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryDeep,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  relampagoTexto: {
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: font.weightBold,
  },
  info: { padding: spacing.md, paddingTop: spacing.sm },
  categoria: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: font.weightBold,
    letterSpacing: 0.8,
  },
  nome: {
    color: colors.text,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    lineHeight: 19,
    marginTop: 3,
    minHeight: 38,
  },
  precoRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.sm },
  precoOferta: {
    color: colors.text,
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
  },
  unidade: { color: colors.textMuted, fontSize: font.sizeXs },
  precoNormal: {
    color: colors.textSubtle,
    fontSize: font.sizeXs,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  validade: {
    color: colors.textSubtle,
    fontSize: font.sizeXs,
    marginTop: spacing.sm,
  },
  acao: { marginTop: spacing.md },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 10,
  },
  addBtnOutline: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 8.5,
  },
  addTexto: {
    color: colors.onPrimary,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
  },
});
