import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '../../src/components/ui';
import { notificacoesIniciais } from '../../src/data/notificacoes';
import type { NotificacaoItem } from '../../src/data/types';
import { tempoAtras } from '../../src/lib/format';
import { simularOfertaRelampago } from '../../src/lib/notifications';
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
  const [itens, setItens] = useState<NotificacaoItem[]>(notificacoesIniciais);
  const [enviandoTeste, setEnviandoTeste] = useState(false);

  const naoLidas = itens.filter((i) => !i.lida).length;

  function abrir(n: NotificacaoItem) {
    setItens((prev) => prev.map((i) => (i.id === n.id ? { ...i, lida: true } : i)));
    if (n.ofertaId) router.push(`/oferta/${n.ofertaId}`);
  }

  function marcarTodas() {
    setItens((prev) => prev.map((i) => ({ ...i, lida: true })));
  }

  async function testarNotificacao() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEnviandoTeste(true);
    const res = await simularOfertaRelampago(
      'Refrigerante Cola 2L',
      'Leve 3 e pague 2 — só nas próximas 2 horas!',
    );
    setEnviandoTeste(false);

    if (res.ok) {
      Alert.alert(
        'Notificação a caminho',
        'Ela aparece em ~2 segundos. Se o app estiver aberto na frente, minimize para ver a notificação na barra.',
      );
    } else if (res.motivo === 'permissao') {
      Alert.alert(
        'Notificações desativadas',
        'Ative as notificações do app nas configurações do celular para receber as ofertas relâmpago.',
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
        ],
      );
    } else {
      Alert.alert(
        'Não foi possível enviar',
        'No Expo Go as notificações têm limitações. Elas funcionam normalmente no app publicado ou num build de desenvolvimento.',
      );
    }
  }

  return (
    <FlatList
      data={itens}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{
        padding: spacing.lg,
        paddingBottom: insets.bottom + spacing.xl,
        gap: spacing.sm,
      }}
      ListHeaderComponent={
        <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
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

          <View style={styles.demoBox}>
            <Text style={styles.demoTitulo}>⚡ Testar oferta relâmpago</Text>
            <Text style={styles.demoTexto}>
              Dispara uma notificação de exemplo em ~2 segundos. Deixe o app em
              segundo plano para ver a notificação chegar. Em produção o disparo
              vem do painel do supermercado.
            </Text>
            <Botao
              titulo={enviandoTeste ? 'Enviando…' : 'Enviar notificação de teste'}
              variante="outline"
              carregando={enviandoTeste}
              onPress={testarNotificacao}
            />
          </View>
        </View>
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
  demoBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  demoTitulo: { fontSize: font.sizeMd, fontWeight: font.weightBold, color: colors.text },
  demoTexto: { fontSize: font.sizeXs, color: colors.textMuted },
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
