import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../src/api/http';
import {
  FLUXO_PEDIDO,
  ROTULO_STATUS,
  statusFinal,
  type Pedido,
  type StatusPedido,
} from '../../src/api/pedidos';
import { Estado } from '../../src/components/Estado';
import { useAdmin } from '../../src/context/AdminContext';
import { formatarPeso } from '../../src/data/compravel';
import { brl, tempoAtras } from '../../src/lib/format';
import { avisarStatusWhatsApp } from '../../src/lib/pedido';
import { colors, font, radius, spacing } from '../../src/theme';

const CorStatus: Record<StatusPedido, string> = {
  aguardando: colors.accent,
  aceito: colors.success,
  separando: colors.primary,
  saiu_entrega: colors.primaryDark,
  entregue: colors.textMuted,
  cancelado: colors.danger,
};

function resumoItem(i: Pedido['itens'][number]) {
  if (i.modo === 'peso') {
    return `${i.quantidade > 1 ? `${i.quantidade}× ` : ''}≈${formatarPeso(i.pesoKg ?? 0)} ${i.nome}`;
  }
  return `${i.quantidade}× ${i.nome}`;
}

export default function AdminPedidos() {
  const insets = useSafeAreaInsets();
  const { req } = useAdmin();
  const [lista, setLista] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(
    async (modo: 'inicial' | 'refresh') => {
      modo === 'inicial' ? setCarregando(true) : setAtualizando(true);
      try {
        const dados = await req<Pedido[]>('/admin/pedidos');
        setLista(dados);
        setErro(null);
      } catch (e) {
        setErro(e instanceof ApiError ? e.message : 'Falha ao carregar os pedidos.');
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [req],
  );

  useEffect(() => {
    carregar('inicial');
  }, [carregar]);

  async function mudarStatus(p: Pedido, status: StatusPedido, motivo?: string) {
    try {
      await req(`/admin/pedidos/${p.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, motivo }),
      });
      carregar('refresh');
      // abre o WhatsApp do cliente com o aviso já escrito — a dona só confere e aperta enviar
      await avisarStatusWhatsApp(p, status);
    } catch (e) {
      Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível mudar o status.');
    }
  }

  function confirmarAvanco(p: Pedido) {
    const i = FLUXO_PEDIDO.indexOf(p.status);
    const proximo = i >= 0 && i < FLUXO_PEDIDO.length - 1 ? FLUXO_PEDIDO[i + 1] : null;
    if (!proximo) return;
    Alert.alert('Avançar pedido', `Marcar ${p.codigo} como "${ROTULO_STATUS[proximo]}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => mudarStatus(p, proximo) },
    ]);
  }

  function confirmarCancelamento(p: Pedido) {
    Alert.alert('Cancelar pedido', `Cancelar ${p.codigo}? O cliente é avisado.`, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar pedido', style: 'destructive', onPress: () => mudarStatus(p, 'cancelado') },
    ]);
  }

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (erro && lista.length === 0) {
    return (
      <Estado
        icone="cloud-offline-outline"
        titulo="Sem conexão"
        descricao={erro}
        acao={{ titulo: 'Tentar de novo', onPress: () => carregar('inicial') }}
      />
    );
  }

  return (
    <FlatList
      data={lista}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={() => carregar('refresh')}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <Estado icone="cube-outline" titulo="Nenhum pedido ainda" descricao="Os pedidos feitos pelo app aparecem aqui." />
      }
      renderItem={({ item: p }) => {
        const i = FLUXO_PEDIDO.indexOf(p.status);
        const proximo = i >= 0 && i < FLUXO_PEDIDO.length - 1 ? FLUXO_PEDIDO[i + 1] : null;
        return (
          <View style={styles.card}>
            <View style={styles.topo}>
              <Text style={styles.codigo}>{p.codigo}</Text>
              <View style={[styles.badge, { backgroundColor: CorStatus[p.status] }]}>
                <Text style={styles.badgeTexto}>{ROTULO_STATUS[p.status]}</Text>
              </View>
            </View>
            <Text style={styles.tempo}>{tempoAtras(p.criadoEm)}</Text>

            <Text style={styles.cliente}>
              {p.cliente.nome}
              {p.cliente.telefone ? ` · ${p.cliente.telefone}` : ''}
            </Text>
            <Text style={styles.endereco}>
              {p.cliente.endereco}
              {p.cliente.bairro ? ` · ${p.cliente.bairro}` : ''}
              {p.cliente.referencia ? ` (${p.cliente.referencia})` : ''}
            </Text>

            <View style={styles.itens}>
              {p.itens.map((it, idx) => (
                <Text key={idx} style={styles.item}>• {resumoItem(it)}</Text>
              ))}
            </View>

            <Text style={styles.total}>
              {p.cashbackUsado
                ? `Subtotal ${brl(p.subtotal)} · cashback -${brl(p.cashbackUsado)} · `
                : ''}
              <Text style={{ fontWeight: font.weightBold, color: colors.text }}>
                Total {brl(p.total ?? p.subtotal)}
              </Text>
              {p.pagamento ? ` · ${p.pagamento}` : ' · pagamento a combinar'}
              {p.trocoPara ? ` (troco p/ ${p.trocoPara})` : ''}
            </Text>
            {p.observacao ? <Text style={styles.obs}>Obs: {p.observacao}</Text> : null}

            {!statusFinal(p.status) && (
              <View style={styles.acoes}>
                {proximo && (
                  <Pressable style={styles.btnPrimario} onPress={() => confirmarAvanco(p)}>
                    <Text style={styles.btnPrimarioTexto}>▶ {ROTULO_STATUS[proximo]}</Text>
                  </Pressable>
                )}
                <Pressable style={styles.btnCancelar} onPress={() => confirmarCancelamento(p)}>
                  <Text style={styles.btnCancelarTexto}>Cancelar</Text>
                </Pressable>
              </View>
            )}
            {p.status === 'cancelado' && p.canceladoMotivo ? (
              <Text style={styles.obs}>Motivo: {p.canceladoMotivo}</Text>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 3,
  },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codigo: { fontSize: font.sizeMd, fontWeight: font.weightBold, color: colors.text },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  badgeTexto: { fontSize: 10, fontWeight: font.weightBold, color: colors.onPrimary, textTransform: 'uppercase' },
  tempo: { fontSize: font.sizeXs, color: colors.textSubtle },
  cliente: { fontSize: font.sizeSm, color: colors.text, fontWeight: font.weightMedium, marginTop: spacing.xs },
  endereco: { fontSize: font.sizeXs, color: colors.textMuted },
  itens: { marginTop: spacing.xs, gap: 1 },
  item: { fontSize: font.sizeXs, color: colors.textMuted },
  total: { fontSize: font.sizeXs, color: colors.textMuted, marginTop: spacing.xs },
  obs: { fontSize: font.sizeXs, color: colors.textMuted, fontStyle: 'italic', marginTop: 2 },
  acoes: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btnPrimario: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimarioTexto: { color: colors.onPrimary, fontSize: font.sizeXs, fontWeight: font.weightBold },
  btnCancelar: {
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelarTexto: { color: colors.danger, fontSize: font.sizeXs, fontWeight: font.weightBold },
});
