import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ApiError } from '../../src/api/http';
import { Estado } from '../../src/components/Estado';
import { useAdmin } from '../../src/context/AdminContext';
import { useCatalogo } from '../../src/context/CatalogoContext';
import { buscarProdutos } from '../../src/data/catalogo';
import { CATEGORIAS, type Categoria, type Produto } from '../../src/data/types';
import { tempoAtras } from '../../src/lib/format';
import { colors, font, radius, spacing } from '../../src/theme';

const FILTROS: (Categoria | 'Todas')[] = ['Todas', ...CATEGORIAS];

/** "5,99" | "5.99" → 5.99 ; vazio/ inválido → null */
function paraNumero(txt: string): number | null {
  const n = Number(txt.replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}
const money = (n?: number) => (n == null ? '' : String(n).replace('.', ','));

type Edicao = { preco?: string };

export default function AdminPrecos() {
  const insets = useSafeAreaInsets();
  const { req } = useAdmin();
  const { refresh: refreshCatalogo } = useCatalogo();

  const [lista, setLista] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [termo, setTermo] = useState('');
  const [categoria, setCategoria] = useState<Categoria | 'Todas'>('Todas');
  const [edicoes, setEdicoes] = useState<Record<string, Edicao>>({});
  const [salvando, setSalvando] = useState(false);
  const [feito, setFeito] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await req<Produto[]>('/admin/produtos');
      setLista(dados);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o catálogo.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(
    () => buscarProdutos(lista, termo, categoria),
    [lista, termo, categoria],
  );

  const pendentes = useMemo(() => {
    const out: { id: string; preco?: number }[] = [];
    for (const p of lista) {
      const e = edicoes[p.id];
      if (!e) continue;
      const linha: { id: string; preco?: number } = { id: p.id };
      let mudou = false;
      if (e.preco !== undefined) {
        const n = paraNumero(e.preco);
        if (n != null && n !== p.preco) { linha.preco = n; mudou = true; }
      }
      if (mudou) out.push(linha);
    }
    return out;
  }, [lista, edicoes]);

  function setEdicao(id: string, campo: keyof Edicao, valor: string) {
    setFeito(null);
    setEdicoes((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  }

  async function salvar() {
    if (pendentes.length === 0) return;
    setSalvando(true);
    setErro(null);
    try {
      await req('/admin/produtos/precos', {
        method: 'POST',
        body: JSON.stringify(pendentes),
      });
      setLista((prev) =>
        prev.map((p) => {
          const alt = pendentes.find((x) => x.id === p.id);
          if (!alt) return p;
          const novo = { ...p };
          if (alt.preco != null) {
            novo.historicoPreco = [{ preco: p.preco, em: p.atualizadoEm ?? new Date().toISOString() }, ...(p.historicoPreco ?? [])].slice(0, 10);
            novo.preco = alt.preco;
            novo.atualizadoEm = new Date().toISOString();
          }
          return novo;
        }),
      );
      setEdicoes({});
      setFeito(`${pendentes.length} ${pendentes.length === 1 ? 'preço atualizado' : 'preços atualizados'}.`);
      refreshCatalogo();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (erro && lista.length === 0) {
    return (
      <Estado
        icone="cloud-offline-outline"
        titulo="Sem conexão com o servidor"
        descricao={erro}
        acao={{ titulo: 'Tentar de novo', onPress: carregar }}
      />
    );
  }

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
              <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtrados}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          padding: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + 120,
          gap: spacing.sm,
        }}
        ListHeaderComponent={
          <Text style={styles.contador}>
            {filtrados.length} {filtrados.length === 1 ? 'produto' : 'produtos'}
          </Text>
        }
        renderItem={({ item }) => {
          const e = edicoes[item.id] ?? {};
          const precoTxt = e.preco ?? money(item.preco);
          const alterado = pendentes.some((x) => x.id === item.id);
          return (
            <View style={[styles.row, alterado && styles.rowAlterado]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome} numberOfLines={2}>
                  {item.nome}
                  {item.marca ? <Text style={styles.marca}> · {item.marca}</Text> : null}
                </Text>
                <Text style={styles.meta}>
                  por {item.unidade}
                  {item.atualizadoEm ? ` · alterado ${tempoAtras(item.atualizadoEm)}` : ''}
                </Text>
              </View>

              <View style={styles.campos}>
                <View style={styles.campoBox}>
                  <Text style={styles.prefixo}>R$</Text>
                  <TextInput
                    value={precoTxt}
                    onChangeText={(t) => setEdicao(item.id, 'preco', t)}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    selectTextOnFocus
                  />
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Estado icone="search-outline" titulo="Nada encontrado" descricao="Tente outro nome ou categoria." />
        }
      />

      {(pendentes.length > 0 || feito || erro) && (
        <View style={[styles.rodape, { paddingBottom: insets.bottom + spacing.md }]}>
          {erro && <Text style={styles.rodapeErro}>{erro}</Text>}
          {feito && pendentes.length === 0 && (
            <Text style={styles.rodapeOk}>
              <Ionicons name="checkmark-circle" size={13} color={colors.success} /> {feito}
            </Text>
          )}
          {pendentes.length > 0 && (
            <Pressable
              style={styles.salvarBtn}
              onPress={salvar}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.salvarTexto}>
                  Salvar {pendentes.length} {pendentes.length === 1 ? 'alteração' : 'alterações'}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buscaWrap: { padding: spacing.lg, paddingBottom: spacing.sm },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 44,
  },
  buscaInput: { flex: 1, fontSize: font.sizeMd, color: colors.text },
  chipsRow: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    height: 32,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { fontSize: font.sizeXs, color: colors.textMuted, fontWeight: font.weightMedium },
  chipTextoAtivo: { color: colors.onPrimary, fontWeight: font.weightBold },
  contador: { fontSize: font.sizeXs, color: colors.textMuted, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  rowAlterado: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  nome: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text, lineHeight: 18 },
  marca: { fontWeight: font.weightRegular, color: colors.textMuted },
  meta: { fontSize: font.sizeXs, color: colors.textMuted, marginTop: 2 },
  campos: { gap: 4, width: 108 },
  campoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    height: 34,
  },
  campoClube: { borderStyle: 'dashed' },
  prefixo: { fontSize: font.sizeXs, color: colors.textMuted, fontWeight: font.weightBold },
  input: { flex: 1, fontSize: font.sizeSm, color: colors.text, fontWeight: font.weightBold, paddingVertical: 0 },
  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  rodapeErro: { fontSize: font.sizeXs, color: colors.danger },
  rodapeOk: { fontSize: font.sizeSm, color: colors.success, fontWeight: font.weightMedium, textAlign: 'center' },
  salvarBtn: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salvarTexto: { color: colors.onPrimary, fontSize: font.sizeMd, fontWeight: font.weightBold },
});
