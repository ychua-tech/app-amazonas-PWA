import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Estado } from '../../src/components/Estado';
import { Botao } from '../../src/components/ui';
import {
  avancarPedidoLocal,
  FLUXO_PEDIDO,
  getPedido,
  ROTULO_STATUS,
  statusFinal,
  type Pedido,
  type StatusPedido,
} from '../../src/api/pedidos';
import { formatarPeso } from '../../src/data/compravel';
import { loja } from '../../src/data/loja';
import { abrirWhatsApp } from '../../src/lib/contato';
import { brl } from '../../src/lib/format';
import { colors, font, radius, spacing } from '../../src/theme';

const ICONE_STATUS: Record<StatusPedido, keyof typeof Ionicons.glyphMap> = {
  aguardando: 'time-outline',
  aceito: 'checkmark-circle-outline',
  separando: 'basket-outline',
  saiu_entrega: 'bicycle-outline',
  entregue: 'home-outline',
  cancelado: 'close-circle-outline',
};

export default function PedidoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const buscar = useCallback(
    async (modo: 'inicial' | 'refresh' | 'poll') => {
      if (!id) return;
      if (modo === 'refresh') setAtualizando(true);
      const p = await getPedido(id);
      setPedido(p);
      setCarregando(false);
      setAtualizando(false);
    },
    [id],
  );

  useEffect(() => {
    buscar('inicial');
  }, [buscar]);

  // poll enquanto o pedido não terminou
  useEffect(() => {
    if (!pedido || pedido.demo || statusFinal(pedido.status)) return;
    timer.current = setInterval(() => buscar('poll'), 20000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [pedido, buscar]);

  async function avancarDemo() {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const p = await avancarPedidoLocal(id);
    setPedido(p);
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!pedido) {
    return (
      <Estado
        icone="receipt-outline"
        titulo="Pedido não encontrado"
        descricao="Pode ser que ele ainda não tenha sido registrado no sistema."
        acao={{ titulo: 'Voltar ao início', onPress: () => router.replace('/') }}
      />
    );
  }

  const cancelado = pedido.status === 'cancelado';
  const indiceAtual = FLUXO_PEDIDO.indexOf(pedido.status);
  const horaDe = (s: StatusPedido) =>
    pedido.historico.find((h) => h.status === s)?.em;

  return (
    <>
      <Stack.Screen options={{ title: `Pedido ${pedido.codigo}` }} />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => buscar('refresh')}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* topo */}
        <View style={[styles.topo, cancelado && { backgroundColor: colors.danger }]}>
          <Text style={styles.topoLabel}>
            {pedido.demo ? 'Pedido de demonstração' : `Pedido ${pedido.codigo}`}
          </Text>
          <Text style={styles.topoStatus}>{ROTULO_STATUS[pedido.status]}</Text>
          {cancelado && pedido.canceladoMotivo && (
            <Text style={styles.topoMotivo}>{pedido.canceladoMotivo}</Text>
          )}
          {!cancelado && (
            <Text style={styles.topoDica}>
              {pedido.status === 'aguardando'
                ? 'Assim que o mercado confirmar pelo WhatsApp, você acompanha tudo por aqui.'
                : pedido.status === 'saiu_entrega'
                  ? 'Seu pedido está a caminho. Deixe o telefone por perto.'
                  : pedido.status === 'entregue'
                    ? 'Pedido entregue. Bom apetite!'
                    : 'Acompanhe o preparo em tempo real.'}
            </Text>
          )}
        </View>

        {/* linha do tempo */}
        {!cancelado && (
          <View style={styles.timeline}>
            {FLUXO_PEDIDO.map((s, i) => {
              const feito = i <= indiceAtual;
              const atual = i === indiceAtual;
              return (
                <View key={s} style={styles.passo}>
                  <View style={styles.passoEsq}>
                    <View
                      style={[
                        styles.bolinha,
                        feito && styles.bolinhaFeita,
                        atual && styles.bolinhaAtual,
                      ]}
                    >
                      <Ionicons
                        name={feito ? 'checkmark' : ICONE_STATUS[s]}
                        size={14}
                        color={feito ? colors.onPrimary : colors.textMuted}
                      />
                    </View>
                    {i < FLUXO_PEDIDO.length - 1 && (
                      <View style={[styles.traco, feito && styles.tracoFeito]} />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingBottom: spacing.lg }}>
                    <Text style={[styles.passoTitulo, atual && { color: colors.primary }]}>
                      {ROTULO_STATUS[s]}
                    </Text>
                    {horaDe(s) && (
                      <Text style={styles.passoHora}>
                        {new Date(horaDe(s)!).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {pedido.demo && !statusFinal(pedido.status) && (
          <Botao
            titulo="▶ Avançar status (demonstração)"
            variante="outline"
            onPress={avancarDemo}
          />
        )}

        {/* resumo */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Itens</Text>
          {pedido.itens.map((it, i) => {
            const peso = it.modo === 'peso';
            const total = peso
              ? it.precoOferta * (it.pesoKg ?? 0) * it.quantidade
              : it.precoOferta * it.quantidade;
            return (
              <View key={i} style={styles.itemLinha}>
                <Text style={styles.itemNome}>
                  {peso
                    ? `${it.nome} — ${it.quantidade > 1 ? `${it.quantidade}× ` : ''}≈${formatarPeso(it.pesoKg ?? 0)}`
                    : `${it.quantidade}x ${it.nome}`}
                </Text>
                <Text style={styles.itemValor}>
                  {peso ? '≈ ' : ''}
                  {brl(total)}
                </Text>
              </View>
            );
          })}
          {pedido.cashbackUsado ? (
            <>
              <View style={styles.itemLinha}>
                <Text style={styles.itemNome}>Subtotal</Text>
                <Text style={styles.itemValor}>{brl(pedido.subtotal)}</Text>
              </View>
              <View style={styles.itemLinha}>
                <Text style={[styles.itemNome, { color: colors.cashback }]}>
                  Cashback do Clube
                </Text>
                <Text style={[styles.itemValor, { color: colors.cashback, fontWeight: font.weightBold }]}>
                  - {brl(pedido.cashbackUsado)}
                </Text>
              </View>
            </>
          ) : null}
          <View style={[styles.itemLinha, styles.totalLinha]}>
            <Text style={styles.totalLabel}>Total do pedido</Text>
            <Text style={styles.totalValor}>
              {brl(pedido.total ?? pedido.subtotal)}
            </Text>
          </View>
          <Text style={styles.obs}>
            Taxa de entrega combinada no WhatsApp.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Entrega</Text>
          <Text style={styles.entregaTexto}>{pedido.cliente.nome}</Text>
          <Text style={styles.entregaTexto}>
            {pedido.cliente.endereco}
            {pedido.cliente.bairro ? ` — ${pedido.cliente.bairro}` : ''}
          </Text>
          {pedido.cliente.referencia && (
            <Text style={styles.entregaMuted}>Ref.: {pedido.cliente.referencia}</Text>
          )}
          {pedido.pagamento && (
            <Text style={styles.entregaMuted}>
              Pagamento: {pedido.pagamento}
              {pedido.trocoPara ? ` (troco p/ ${pedido.trocoPara})` : ''}
            </Text>
          )}
          {pedido.observacao && (
            <Text style={styles.entregaMuted}>Obs.: {pedido.observacao}</Text>
          )}
        </View>

        <Pressable
          style={styles.whats}
          onPress={() =>
            abrirWhatsApp(
              loja.whatsappPedidos,
              `Olá! Sobre o meu pedido *${pedido.codigo}*:`,
            )
          }
        >
          <Ionicons name="logo-whatsapp" size={20} color={colors.onPrimary} />
          <Text style={styles.whatsTexto}>Falar sobre este pedido</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/meus-pedidos')}>
          <Text style={styles.link}>Ver todos os meus pedidos</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topo: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  topoLabel: { color: colors.onPrimary, opacity: 0.9, fontSize: font.sizeXs, fontWeight: font.weightBold, letterSpacing: 0.5 },
  topoStatus: { color: colors.onPrimary, fontSize: font.sizeXl, fontWeight: font.weightBold },
  topoDica: { color: colors.onPrimary, opacity: 0.95, fontSize: font.sizeSm, marginTop: spacing.xs },
  topoMotivo: { color: colors.onPrimary, fontSize: font.sizeSm, marginTop: spacing.xs },

  timeline: { paddingLeft: spacing.xs },
  passo: { flexDirection: 'row', gap: spacing.md },
  passoEsq: { alignItems: 'center' },
  bolinha: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolinhaFeita: { backgroundColor: colors.success, borderColor: colors.success },
  bolinhaAtual: { backgroundColor: colors.primary, borderColor: colors.primary },
  traco: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  tracoFeito: { backgroundColor: colors.success },
  passoTitulo: { fontSize: font.sizeMd, fontWeight: font.weightBold, color: colors.text, marginTop: 4 },
  passoHora: { fontSize: font.sizeXs, color: colors.textMuted, marginTop: 2 },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardTitulo: { fontSize: font.sizeMd, fontWeight: font.weightBold, color: colors.text, marginBottom: spacing.xs },
  itemLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  itemNome: { fontSize: font.sizeSm, color: colors.text, flex: 1 },
  itemValor: { fontSize: font.sizeSm, color: colors.textMuted },
  totalLinha: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xs, paddingTop: spacing.sm },
  totalLabel: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text },
  totalValor: { fontSize: font.sizeMd, fontWeight: font.weightBold, color: colors.primary },
  obs: { fontSize: font.sizeXs, color: colors.textMuted, marginTop: spacing.xs },
  entregaTexto: { fontSize: font.sizeSm, color: colors.text },
  entregaMuted: { fontSize: font.sizeXs, color: colors.textMuted },

  whats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#25D366',
    height: 50,
    borderRadius: radius.md,
  },
  whatsTexto: { color: colors.onPrimary, fontWeight: font.weightBold, fontSize: font.sizeSm },
  link: { color: colors.primary, fontWeight: font.weightBold, textAlign: 'center', fontSize: font.sizeSm },
});
