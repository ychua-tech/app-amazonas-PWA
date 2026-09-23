import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Estado } from '../../src/components/Estado';
import { ProdutoRow } from '../../src/components/ProdutoRow';
import { useCatalogo } from '../../src/context/CatalogoContext';
import { buscarProdutos } from '../../src/data/catalogo';
import { produtoParaCompravel } from '../../src/data/compravel';
import { CATEGORIAS, type Categoria } from '../../src/data/types';
import { colors, font, radius, shadow, spacing } from '../../src/theme';

const FILTROS: (Categoria | 'Todas')[] = ['Todas', ...CATEGORIAS];

const ICONE_CAT: Record<Categoria, keyof typeof Ionicons.glyphMap> = {
  Hortifruti: 'leaf-outline',
  Açougue: 'restaurant-outline',
  Padaria: 'cafe-outline',
  'Frios e Laticínios': 'snow-outline',
  Mercearia: 'basket-outline',
  Bebidas: 'wine-outline',
  Limpeza: 'sparkles-outline',
  Higiene: 'happy-outline',
  Pet: 'paw-outline',
};

export default function MercadoScreen() {
  const insets = useSafeAreaInsets();
  const { produtos, refresh } = useCatalogo();
  const [termo, setTermo] = useState('');
  const [categoria, setCategoria] = useState<Categoria | 'Todas'>('Todas');
  const [atualizando, setAtualizando] = useState(false);

  const resultados = useMemo(
    () => buscarProdutos(produtos, termo, categoria).map(produtoParaCompravel),
    [produtos, termo, categoria],
  );

  /** Agrupa por categoria, na ordem fixa de CATEGORIAS, escondendo seções vazias. */
  const secoes = useMemo(() => {
    const porCategoria = new Map<Categoria, typeof resultados>();
    for (const item of resultados) {
      const lista = porCategoria.get(item.categoria);
      if (lista) lista.push(item);
      else porCategoria.set(item.categoria, [item]);
    }
    return CATEGORIAS.filter((c) => porCategoria.has(c)).map((cat) => ({
      categoria: cat,
      data: porCategoria.get(cat)!,
    }));
  }, [resultados]);

  const aoAtualizar = async () => {
    setAtualizando(true);
    await refresh();
    setAtualizando(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.buscaWrap}>
        <View style={styles.busca}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={termo}
            onChangeText={setTermo}
            placeholder="Buscar produto ou marca"
            placeholderTextColor={colors.textSubtle}
            style={styles.buscaInput}
            returnKeyType="search"
          />
          {termo.length > 0 && (
            <Pressable onPress={() => setTermo('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={{ flexGrow: 0 }}
      >
        {FILTROS.map((c) => {
          const ativo = c === categoria;
          return (
            <Pressable
              key={c}
              onPress={() => setCategoria(c)}
              style={[styles.chip, ativo && styles.chipAtivo]}
            >
              {c !== 'Todas' && (
                <Ionicons
                  name={ICONE_CAT[c]}
                  size={13}
                  color={ativo ? colors.onPrimary : colors.textMuted}
                />
              )}
              <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionList
        sections={secoes}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <ProdutoRow item={item} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.secaoHeader}>
            <Ionicons name={ICONE_CAT[section.categoria]} size={15} color={colors.primary} />
            <Text style={styles.secaoTitulo}>{section.categoria}</Text>
            <Text style={styles.secaoContagem}>{section.data.length}</Text>
          </View>
        )}
        stickySectionHeadersEnabled
        contentContainerStyle={{
          padding: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.sm,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={aoAtualizar}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <Text style={styles.contador}>
            {resultados.length}{' '}
            {resultados.length === 1 ? 'produto' : 'produtos'}
            {categoria !== 'Todas' ? ` em ${categoria}` : ''}
          </Text>
        }
        ListEmptyComponent={
          <Estado
            icone="search-outline"
            titulo="Nada encontrado"
            descricao={`Não achamos "${termo}". Tente outro nome ou categoria.`}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buscaWrap: { padding: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.background },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 46,
    ...shadow.sm,
  },
  buscaInput: { flex: 1, fontSize: font.sizeMd, color: colors.text },
  chipsRow: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { fontSize: font.sizeXs, color: colors.textMuted, fontWeight: font.weightMedium },
  chipTextoAtivo: { color: colors.onPrimary, fontWeight: font.weightBold },
  contador: { fontSize: font.sizeXs, color: colors.textMuted, marginBottom: spacing.xs },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
  },
  secaoTitulo: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text, flex: 1 },
  secaoContagem: { fontSize: font.sizeXs, color: colors.textSubtle },
});
