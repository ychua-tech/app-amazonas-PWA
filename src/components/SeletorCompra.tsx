import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatarPeso } from '../data/compravel';
import type { ItemCompravel } from '../data/types';
import { brl } from '../lib/format';
import { colors, font, radius, spacing } from '../theme';
import { Botao } from './ui';

export interface EscolhaCompra {
  modo: 'unidade' | 'peso';
  pesoKg?: number;
  quantidade: number;
  precoUnitario?: number;
  rotuloUnidade?: string;
}

/**
 * Controle para escolher como comprar um item: por unidade ou por peso
 * aproximado, com a quantidade. Mostra o valor estimado.
 */
export function SeletorCompra({
  item,
  onConfirmar,
  rotuloBotao = 'Adicionar ao carrinho',
}: {
  item: ItemCompravel;
  onConfirmar: (e: EscolhaCompra) => void;
  rotuloBotao?: string;
}) {
  const podeUnidade = item.modoVenda !== 'peso';
  const podePeso = item.modoVenda !== 'unidade';

  const [modo, setModo] = useState<'unidade' | 'peso'>(
    podePeso && !podeUnidade ? 'peso' : podePeso && item.modoVenda === 'unidade_ou_peso' ? 'unidade' : podeUnidade ? 'unidade' : 'peso',
  );
  const pesos = item.pesosSugeridos ?? [0.5, 1, 1.5, 2];
  const [pesoKg, setPesoKg] = useState<number>(pesos[Math.min(1, pesos.length - 1)] ?? 1);
  const [pesoCustom, setPesoCustom] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  const pesoFinal = useMemo(() => {
    const c = parseFloat(pesoCustom.replace(',', '.'));
    return pesoCustom && Number.isFinite(c) && c > 0 ? c : pesoKg;
  }, [pesoCustom, pesoKg]);

  // hortifruti "por unidade": preço por unidade ≈ preço/kg × peso médio da unidade
  const precoPorUnidade =
    item.modoVenda === 'unidade_ou_peso' && item.pesoMedioUn
      ? Math.round(item.preco * item.pesoMedioUn * 100) / 100
      : item.preco;

  const estimado =
    modo === 'peso'
      ? item.preco * pesoFinal * quantidade
      : precoPorUnidade * quantidade;

  const rotuloUn =
    item.modoVenda === 'unidade_ou_peso' && item.pesoMedioUn
      ? `un (≈ ${formatarPeso(item.pesoMedioUn)})`
      : item.unidade;

  function confirmar() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirmar({
      modo,
      pesoKg: modo === 'peso' ? Math.round(pesoFinal * 1000) / 1000 : undefined,
      quantidade,
      precoUnitario: modo === 'unidade' ? precoPorUnidade : undefined,
      rotuloUnidade: modo === 'unidade' ? rotuloUn : undefined,
    });
  }

  return (
    <View style={{ gap: spacing.md }}>
      {podeUnidade && podePeso && (
        <View style={styles.tabs}>
          <TabBtn ativo={modo === 'unidade'} onPress={() => setModo('unidade')} texto="Por unidade" />
          <TabBtn ativo={modo === 'peso'} onPress={() => setModo('peso')} texto="Por peso" />
        </View>
      )}

      {modo === 'peso' ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Peso aproximado</Text>
          <View style={styles.chips}>
            {pesos.map((p) => {
              const ativo = !pesoCustom && p === pesoKg;
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    setPesoCustom('');
                    setPesoKg(p);
                  }}
                  style={[styles.chip, ativo && styles.chipAtivo]}
                >
                  <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                    {formatarPeso(p)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={pesoCustom}
            onChangeText={setPesoCustom}
            placeholder="Outro peso — ex.: 0,750"
            placeholderTextColor={colors.textSubtle}
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <Text style={styles.dica}>
            O valor final é ajustado pelo peso real na separação.
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Quantidade</Text>
          <Passos valor={quantidade} onMudar={setQuantidade} />
        </View>
      )}

      {modo === 'peso' && (
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>Quantas porções desse peso</Text>
          <Passos valor={quantidade} onMudar={setQuantidade} />
        </View>
      )}

      <View style={styles.rodape}>
        <View>
          <Text style={styles.estLabel}>
            {modo === 'peso' ? 'Valor estimado' : 'Total'}
          </Text>
          <Text style={styles.estValor}>
            {modo === 'peso' ? '≈ ' : ''}
            {brl(estimado)}
          </Text>
          <Text style={styles.estDetalhe}>
            {modo === 'peso'
              ? `${quantidade > 1 ? `${quantidade}× ` : ''}${formatarPeso(pesoFinal)} · ${brl(item.preco)}/kg`
              : `${quantidade} × ${brl(precoPorUnidade)}${item.modoVenda === 'unidade_ou_peso' ? ' /un aprox.' : ''}`}
          </Text>
        </View>
        <Botao titulo={rotuloBotao} onPress={confirmar} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function TabBtn({
  ativo,
  onPress,
  texto,
}: {
  ativo: boolean;
  onPress: () => void;
  texto: string;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, ativo && styles.tabAtivo]}>
      <Text style={[styles.tabTexto, ativo && styles.tabTextoAtivo]}>{texto}</Text>
    </Pressable>
  );
}

function Passos({ valor, onMudar }: { valor: number; onMudar: (n: number) => void }) {
  return (
    <View style={styles.passos}>
      <Pressable
        onPress={() => onMudar(Math.max(1, valor - 1))}
        style={styles.passoBtn}
        hitSlop={6}
      >
        <Ionicons name="remove" size={20} color={colors.primary} />
      </Pressable>
      <Text style={styles.passoValor}>{valor}</Text>
      <Pressable onPress={() => onMudar(valor + 1)} style={styles.passoBtn} hitSlop={6}>
        <Ionicons name="add" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.pill },
  tabAtivo: { backgroundColor: colors.card, ...{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 } },
  tabTexto: { fontSize: font.sizeSm, color: colors.textMuted, fontWeight: font.weightMedium },
  tabTextoAtivo: { color: colors.text, fontWeight: font.weightBold },

  label: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    height: 40,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipAtivo: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipTexto: { fontSize: font.sizeSm, color: colors.textMuted, fontWeight: font.weightMedium },
  chipTextoAtivo: { color: colors.primaryDark, fontWeight: font.weightBold },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: font.sizeMd,
    color: colors.text,
    backgroundColor: colors.card,
  },
  dica: { fontSize: font.sizeXs, color: colors.textSubtle, lineHeight: 16 },

  passos: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.pill,
  },
  passoBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  passoValor: { minWidth: 36, textAlign: 'center', fontSize: font.sizeMd, fontWeight: font.weightBold, color: colors.text },

  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  estLabel: { fontSize: font.sizeXs, color: colors.textMuted },
  estValor: { fontSize: font.sizeLg, fontWeight: font.weightBold, color: colors.primary },
  estDetalhe: { fontSize: font.sizeXs, color: colors.textSubtle },
});
