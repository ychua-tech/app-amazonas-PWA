import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Estado } from '../../src/components/Estado';
import { OfertaCard } from '../../src/components/OfertaCard';
import { OfertaCardSkeleton } from '../../src/components/Skeleton';
import { expirou } from '../../src/api/ofertas';
import { useCatalogo } from '../../src/context/CatalogoContext';
import { produtoParaOfertaSemDesconto } from '../../src/data/compravel';
import type { Categoria } from '../../src/data/types';
import { useOfertas } from '../../src/hooks/useOfertas';
import { colors, font, gradiente, radius, shadow, spacing } from '../../src/theme';

const CATEGORIAS: (Categoria | 'Todas')[] = [
  'Todas',
  'Hortifruti',
  'Açougue',
  'Padaria',
  'Mercearia',
  'Bebidas',
  'Frios e Laticínios',
  'Limpeza',
  'Higiene',
  'Pet',
];

export default function OfertasScreen() {
  const insets = useSafeAreaInsets();
  const { ofertas, carregando, atualizando, erro, refresh } = useOfertas();
  const { produtos: catalogo } = useCatalogo();
  const [filtro, setFiltro] = useState<Categoria | 'Todas'>('Todas');

  const ativas = useMemo(() => ofertas.filter((o) => !expirou(o)), [ofertas]);
  // sem nenhuma promoção rolando: mostra o catálogo (preço normal) pra home nunca ficar vazia
  const semPromocaoAtiva = ativas.length === 0;
  const base = useMemo(
    () => (semPromocaoAtiva ? catalogo.map(produtoParaOfertaSemDesconto) : ativas),
    [semPromocaoAtiva, catalogo, ativas],
  );
  const lista = useMemo(
    () => (filtro === 'Todas' ? base : base.filter((o) => o.categoria === filtro)),
    [base, filtro],
  );
  const relampago = useMemo(() => ativas.filter((o) => o.relampago), [ativas]);

  const padding = {
    padding: spacing.lg,
    paddingBottom: insets.bottom + spacing.xxl,
  };

  if (carregando) {
    return (
      <ScrollView contentContainerStyle={{ ...padding, gap: spacing.md }}>
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ flex: 1, minWidth: '46%' }}>
              <OfertaCardSkeleton />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (erro && ativas.length === 0) {
    return (
      <Estado
        icone="cloud-offline-outline"
        titulo="Sem conexão com as ofertas"
        descricao={erro}
        acao={{ titulo: 'Tentar de novo', onPress: refresh }}
      />
    );
  }

  return (
    <FlatList
      data={lista}
      keyExtractor={(o) => o.id}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      renderItem={({ item }) => (
        <View style={{ width: '48.5%' }}>
          <OfertaCard oferta={item} />
        </View>
      )}
      contentContainerStyle={{ ...padding, gap: spacing.md }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={refresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: spacing.xl, marginBottom: spacing.md }}>
          <Link href="/encarte" asChild>
            <Pressable>
              <LinearGradient
                colors={gradiente.marca}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.encarteBanner}
              >
                <View style={styles.encarteIcone}>
                  <Ionicons name="newspaper" size={20} color={colors.onPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.encarteTitulo}>Encarte completo da semana</Text>
                  <Text style={styles.encarteSub}>
                    Ofertão da Independência · ver todas as páginas
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.onPrimary} />
              </LinearGradient>
            </Pressable>
          </Link>

          {relampago.length > 0 && (
            <View style={{ gap: spacing.sm }}>
              <View style={styles.tituloRow}>
                <View style={[styles.tituloIcone, { backgroundColor: colors.dangerSoft }]}>
                  <Ionicons name="flash" size={15} color={colors.danger} />
                </View>
                <Text style={styles.titulo}>Ofertas relâmpago</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.xs, paddingRight: spacing.lg }}
                style={{ marginHorizontal: -spacing.lg, paddingLeft: spacing.lg }}
              >
                {relampago.map((o) => (
                  <View key={o.id} style={styles.relampagoItem}>
                    <OfertaCard oferta={o} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ gap: spacing.md }}>
            <View style={styles.tituloRow}>
              <View style={[styles.tituloIcone, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="pricetags" size={15} color={colors.primary} />
              </View>
              <Text style={styles.titulo}>
                {semPromocaoAtiva ? 'Nosso catálogo' : 'Ofertas da semana'}
              </Text>
            </View>
            {semPromocaoAtiva && (
              <Text style={styles.subtitulo}>
                Sem promoções ativas no momento — mas dá pra pedir tudo por aqui.
              </Text>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}
              style={{ marginHorizontal: -spacing.lg, paddingLeft: spacing.lg }}
            >
              {CATEGORIAS.map((c) => {
                const ativo = c === filtro;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setFiltro(c)}
                    style={[styles.catChip, ativo && styles.catChipAtivo]}
                  >
                    <Text style={[styles.catTexto, ativo && styles.catTextoAtivo]}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      }
      ListEmptyComponent={
        <Estado
          icone="pricetag-outline"
          titulo="Nenhuma oferta nesta categoria"
          descricao="Puxe a tela para baixo para atualizar ou escolha outra categoria."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tituloRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tituloIcone: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: font.sizeLg, fontWeight: font.weightBold, color: colors.text },
  subtitulo: { fontSize: font.sizeXs, color: colors.textMuted, marginTop: -spacing.xs },
  relampagoItem: { width: 200 },
  catChip: {
    paddingHorizontal: spacing.lg,
    height: 38,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  catTexto: { fontSize: font.sizeSm, color: colors.textMuted, fontWeight: font.weightMedium },
  catTextoAtivo: { color: colors.onPrimary, fontWeight: font.weightBold },
  encarteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.md,
  },
  encarteIcone: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  encarteTitulo: { color: colors.onPrimary, fontSize: font.sizeMd, fontWeight: font.weightBold },
  encarteSub: { color: colors.onPrimary, opacity: 0.9, fontSize: font.sizeXs, marginTop: 1 },
});
