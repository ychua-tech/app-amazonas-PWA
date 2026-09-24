import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ApiError } from '../../src/api/http';
import { Estado } from '../../src/components/Estado';
import { Botao, Campo } from '../../src/components/ui';
import { useAdmin } from '../../src/context/AdminContext';
import { CATEGORIAS, type Categoria, type Oferta } from '../../src/data/types';
import { brl, descontoPercent } from '../../src/lib/format';
import { colors, font, radius, spacing } from '../../src/theme';

function paraNumero(txt: string): number | null {
  const n = Number(txt.replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}
const money = (n?: number) => (n == null ? '' : String(n).replace('.', ','));
const emDias = (d: number) => {
  const dt = new Date();
  dt.setHours(23, 59, 0, 0);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
};
const emHoras = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

type Form = {
  id?: string;
  nome: string;
  descricao: string;
  categoria: Categoria;
  unidade: string;
  precoNormal: string;
  precoOferta: string;
  imagem: string;
  validadeDias: string;
  relampago: boolean;
  relampagoHoras: string;
};

const VAZIO: Form = {
  nome: '',
  descricao: '',
  categoria: 'Mercearia',
  unidade: 'un',
  precoNormal: '',
  precoOferta: '',
  imagem: '',
  validadeDias: '7',
  relampago: false,
  relampagoHoras: '6',
};

export default function AdminOfertas() {
  const insets = useSafeAreaInsets();
  const { req } = useAdmin();
  const [lista, setLista] = useState<Oferta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  async function carregar() {
    setCarregando(true);
    setErroCarga(null);
    try {
      setLista(await req<Oferta[]>('/admin/ofertas'));
    } catch (e) {
      setErroCarga(e instanceof ApiError ? e.message : 'Falha ao carregar as ofertas.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setMsg(null);
    setForm((f) => ({ ...f, [k]: v }));
  };

  function editar(o: Oferta) {
    setMsg(null);
    setForm({
      id: o.id,
      nome: o.nome,
      descricao: o.descricao ?? '',
      categoria: o.categoria,
      unidade: o.unidade ?? 'un',
      precoNormal: money(o.precoNormal),
      precoOferta: money(o.precoOferta),
      imagem: typeof o.imagem === 'string' ? o.imagem : '',
      validadeDias: '7',
      relampago: !!o.relampago,
      relampagoHoras: '6',
    });
  }

  async function salvar() {
    const precoNormal = paraNumero(form.precoNormal);
    const precoOferta = paraNumero(form.precoOferta);
    if (!form.nome.trim() || precoNormal == null || precoOferta == null) {
      setMsg({ tipo: 'err', texto: 'Preencha nome, preço normal e preço oferta.' });
      return;
    }
    const corpo = {
      id: form.id,
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      categoria: form.categoria,
      unidade: form.unidade.trim() || 'un',
      precoNormal,
      precoOferta,
      imagem: form.imagem.trim(),
      validade: emDias(Number(form.validadeDias) || 7),
      relampago: form.relampago,
      relampagoFim: form.relampago ? emHoras(Number(form.relampagoHoras) || 6) : undefined,
    };
    setSalvando(true);
    try {
      await req('/admin/ofertas', { method: 'POST', body: JSON.stringify(corpo) });
      setForm(VAZIO);
      setMsg({ tipo: 'ok', texto: 'Oferta salva.' });
      carregar();
    } catch (e) {
      setMsg({ tipo: 'err', texto: e instanceof ApiError ? e.message : 'Não foi possível salvar.' });
    } finally {
      setSalvando(false);
    }
  }

  function excluir(o: Oferta) {
    Alert.alert('Excluir oferta', `Remover "${o.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await req(`/admin/ofertas/${o.id}`, { method: 'DELETE' });
            carregar();
          } catch (e) {
            Alert.alert('Erro', e instanceof ApiError ? e.message : 'Falha ao excluir.');
          }
        },
      },
    ]);
  }

  function dispararRelampago(o: Oferta) {
    Alert.alert(
      'Oferta relâmpago',
      `Enviar notificação para todos os aparelhos sobre "${o.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              const r = await req<{ enviadas: number; dispositivos: number }>(
                '/admin/relampago',
                {
                  method: 'POST',
                  body: JSON.stringify({
                    ofertaId: o.id,
                    titulo: o.nome,
                    mensagem: `Agora por ${brl(o.precoOferta)} — corre que é rápido!`,
                  }),
                },
              );
              Alert.alert('Enviado', `Notificação enviada para ${r.enviadas} de ${r.dispositivos} aparelho(s).`);
              carregar();
            } catch (e) {
              Alert.alert('Erro', e instanceof ApiError ? e.message : 'Falha ao enviar.');
            }
          },
        },
      ],
    );
  }

  const desconto = useMemo(() => {
    const n = paraNumero(form.precoNormal);
    const o = paraNumero(form.precoOferta);
    return n && o ? descontoPercent(n, o) : null;
  }, [form.precoNormal, form.precoOferta]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.secao}>{form.id ? 'Editar oferta' : 'Nova oferta'}</Text>

      <Campo rotulo="Nome do produto" value={form.nome} onChangeText={(t) => set('nome', t)} placeholder="Ex: Picanha Bovina Resfriada" />
      <Campo rotulo="Descrição" value={form.descricao} onChangeText={(t) => set('descricao', t)} placeholder="Texto curto que aparece no app" multiline />

      <Text style={styles.rotulo}>Categoria</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {CATEGORIAS.map((c) => {
          const ativo = c === form.categoria;
          return (
            <Pressable key={c} onPress={() => set('categoria', c)} style={[styles.chip, ativo && styles.chipAtivo]}>
              <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.linha}>
        <Campo rotulo="Unidade" value={form.unidade} onChangeText={(t) => set('unidade', t)} placeholder="kg, un, pacote 1kg" style={{ flex: 1 }} />
        <Campo rotulo="Validade (dias)" value={form.validadeDias} onChangeText={(t) => set('validadeDias', t.replace(/\D/g, ''))} keyboardType="number-pad" style={{ width: 120 }} />
      </View>

      <View style={styles.linha}>
        <Campo rotulo="Preço normal" value={form.precoNormal} onChangeText={(t) => set('precoNormal', t)} keyboardType="decimal-pad" placeholder="74,90" style={{ flex: 1 }} />
        <Campo rotulo="Preço oferta" value={form.precoOferta} onChangeText={(t) => set('precoOferta', t)} keyboardType="decimal-pad" placeholder="59,90" style={{ flex: 1 }} />
      </View>
      {desconto != null && <Text style={styles.desconto}>Desconto de {desconto}%</Text>}

      <Campo rotulo="URL da imagem (opcional)" value={form.imagem} onChangeText={(t) => set('imagem', t)} placeholder="https://..." autoCapitalize="none" />

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rotulo}>Oferta relâmpago</Text>
          <Text style={styles.dica}>Aparece no topo com contagem regressiva</Text>
        </View>
        <Switch
          value={form.relampago}
          onValueChange={(v) => set('relampago', v)}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
      {form.relampago && (
        <Campo rotulo="Termina em (horas)" value={form.relampagoHoras} onChangeText={(t) => set('relampagoHoras', t.replace(/\D/g, ''))} keyboardType="number-pad" />
      )}

      {msg && (
        <Text style={[styles.msg, msg.tipo === 'ok' ? styles.msgOk : styles.msgErr]}>{msg.texto}</Text>
      )}
      <View style={styles.linha}>
        <Botao titulo={form.id ? 'Salvar alterações' : 'Criar oferta'} onPress={salvar} carregando={salvando} style={{ flex: 1 }} />
        {form.id && <Botao titulo="Cancelar" variante="outline" onPress={() => setForm(VAZIO)} style={{ flex: 1 }} />}
      </View>

      <View style={styles.divisor} />
      <Text style={styles.secao}>Ofertas publicadas</Text>

      {carregando ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : erroCarga ? (
        <Estado icone="cloud-offline-outline" titulo="Sem conexão" descricao={erroCarga} acao={{ titulo: 'Tentar de novo', onPress: carregar }} />
      ) : lista.length === 0 ? (
        <Text style={styles.dica}>Nenhuma oferta ainda.</Text>
      ) : (
        lista.map((o) => (
          <View key={o.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardNome} numberOfLines={1}>
                {o.relampago ? '⚡ ' : ''}{o.nome}
              </Text>
              <Text style={styles.cardPreco}>
                {brl(o.precoOferta)}{' '}
                <Text style={styles.cardAntigo}>{brl(o.precoNormal)}</Text>
              </Text>
              <Text style={styles.dica}>{o.categoria}</Text>
            </View>
            <View style={{ gap: 4 }}>
              <Pressable style={styles.acao} onPress={() => editar(o)}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={styles.acaoTexto}>Editar</Text>
              </Pressable>
              <Pressable style={styles.acao} onPress={() => dispararRelampago(o)}>
                <Ionicons name="flash-outline" size={16} color={colors.accent} />
                <Text style={[styles.acaoTexto, { color: colors.accent }]}>Push</Text>
              </Pressable>
              <Pressable style={styles.acao} onPress={() => excluir(o)}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={[styles.acaoTexto, { color: colors.danger }]}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  secao: { fontSize: font.sizeLg, fontWeight: font.weightBold, color: colors.text },
  rotulo: { fontSize: font.sizeXs, fontWeight: font.weightBold, color: colors.textMuted },
  dica: { fontSize: font.sizeXs, color: colors.textSubtle },
  linha: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  desconto: { fontSize: font.sizeXs, color: colors.success, fontWeight: font.weightBold },
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
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  msg: { fontSize: font.sizeXs, padding: spacing.sm, borderRadius: radius.sm, overflow: 'hidden' },
  msgOk: { color: colors.success, backgroundColor: colors.successSoft },
  msgErr: { color: colors.danger, backgroundColor: colors.dangerSoft },
  divisor: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardNome: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text },
  cardPreco: { fontSize: font.sizeXs, color: colors.text, marginTop: 2 },
  cardAntigo: { color: colors.textMuted, textDecorationLine: 'line-through' },
  acao: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  acaoTexto: { fontSize: font.sizeXs, color: colors.primary, fontWeight: font.weightBold },
});
