import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Estado } from '../src/components/Estado';
import {
  getPedido,
  ROTULO_STATUS,
  statusFinal,
  type PedidoResumo,
  type StatusPedido,
} from '../src/api/pedidos';
import { usePedidos } from '../src/context/PedidosContext';
import { brl } from '../src/lib/format';
import { colors, font, radius, spacing } from '../src/theme';

const COR_STATUS: Record<StatusPedido, string> = {
  aguardando: colors.accent,
  aceito: colors.success,
  separando: colors.primary,
  saiu_entrega: '#1E40AF',
  entregue: colors.textMuted,
  cancelado: colors.danger,
};

export default function MeusPedidos() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { pedidos, recarregar } = usePedidos();

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  if (pedidos.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'Meus pedidos' }} />
        <Estado
          icone="receipt-outline"
          titulo="Você ainda não fez pedidos"
          descricao="Monte a lista no carrinho e finalize pelo WhatsApp. Seus pedidos aparecem aqui para acompanhar."
          acao={{ titulo: 'Ver ofertas', onPress: () => router.replace('/') }}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Meus pedidos' }} />
      <FlatList
        data={pedidos}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.md,
        }}
        renderItem={({ item }) => (
          <PedidoRow resumo={item} onPress={() => router.push(`/pedido/${item.id}`)} />
        )}
      />
    </>
  );
}

function PedidoRow({
  resumo,
  onPress,
}: {
  resumo: PedidoResumo;
  onPress: () => void;
}) {
  const [status, setStatus] = useState<StatusPedido | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let vivo = true;
    getPedido(resumo.id).then((p) => {
      if (vivo && p) {
        setStatus(p.status);
        setTotal(p.subtotal);
      }
    });
    return () => {
      vivo = false;
    };
  }, [resumo.id]);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.icone}>
        <Ionicons name="receipt-outline" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.codigo}>{resumo.codigo}</Text>
        <Text style={styles.data}>
          {new Date(resumo.criadoEm).toLocaleDateString('pt-BR')}
          {total != null ? ` · ${brl(total)}` : ''}
        </Text>
      </View>
      {status && (
        <View
          style={[
            styles.badge,
            { backgroundColor: statusFinal(status) ? colors.surface : COR_STATUS[status] },
          ]}
        >
          <Text
            style={[
              styles.badgeTexto,
              { color: statusFinal(status) ? colors.textMuted : colors.onPrimary },
            ]}
          >
            {ROTULO_STATUS[status]}
          </Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  icone: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codigo: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text },
  data: { fontSize: font.sizeXs, color: colors.textMuted },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  badgeTexto: { fontSize: 10, fontWeight: font.weightBold },
});
