import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Estado } from '../../src/components/Estado';
import type { NotificacaoItem } from '../../src/data/types';
import { tempoAtras } from '../../src/lib/format';
import { colors, font, radius, spacing } from '../../src/theme';

const ICONE: Record<NotificacaoItem['tipo'], keyof typeof Ionicons.glyphMap> = {
  relampago: 'flash',
  oferta: 'pricetag',
  clube: 'heart',
  pedido: 'bag-check',
};
const COR: Record<NotificacaoItem['tipo'], string> = {
  relampago: colors.danger,
  oferta: colors.primary,
  clube: colors.accent,
  pedido: colors.success,
};

export default function NotificacoesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [itens, setItens] = useState<NotificacaoItem[]>([]);

  const naoLidas = itens.filter((i) => !i.lida).length;

  function abrir(n: NotificacaoItem) {
    setItens((prev) => prev.map((i) => (i.id === n.id ? { ...i, lida: true } : i)));
    if (n.ofertaId) router.push(`/oferta/${n.ofertaId}`);
  }

  function marcarTodas() {
    setItens((prev) => prev.map((i) => ({ ...i, lida: true })));
  }

  return (
    <FlatList
      data={itens}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{
        padding: spacing.lg,
        paddingBottom: insets.bottom + spacing.xl,
        gap: spacing.sm,
        flexGrow: 1,
      }}
      ListHeaderComponent={
        itens.length > 0 ? (
          <View style={styles.headerRow}>
            <Text style={styles.contador}>
              {naoLidas > 0 ? `${naoLidas} não lida(s)` : 'Tudo em dia'}
            </Text>
            {naoLidas > 0 && (
              <Pressable onPress={marcarTodas}>
                <Text style={styles.link}>Marcar todas como lidas</Text>
              </Pressable>
            )}
          </View>
        ) : null
      }
      ListEmptyComponent={
        <Estado
          icone="notifications-outline"
          titulo="Nenhum aviso ainda"
          descricao="Ofertas relâmpago e novidades do Supermercado Amazonas aparecem aqui."
        />
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => abrir(item)}
          style={[styles.item, !item.lida && styles.itemNaoLida]}
        >
          <View style={[styles.itemIcone, { backgroundColor: COR[item.tipo] }]}>
            <Ionicons name={ICONE[item.tipo]} size={16} color={colors.onPrimary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.itemTitulo}>{item.titulo}</Text>
            <Text style={styles.itemMsg}>{item.mensagem}</Text>
            <Text style={styles.itemData}>{tempoAtras(item.data)}</Text>
          </View>
          {!item.lida && <View style={styles.dot} />}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contador: { fontSize: font.sizeSm, color: colors.textMuted, fontWeight: font.weightMedium },
  link: { fontSize: font.sizeSm, color: colors.primary, fontWeight: font.weightBold },
  item: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  itemNaoLida: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  itemIcone: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitulo: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text },
  itemMsg: { fontSize: font.sizeSm, color: colors.textMuted },
  itemData: { fontSize: font.sizeXs, color: colors.textMuted, marginTop: 2 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
});
