import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Aviso } from '../data/types';
import { abrirWhatsApp, formatarTelefone } from '../lib/contato';
import { colors, font, radius, spacing } from '../theme';
import { Logo } from './Logo';
import { Botao } from './ui';

export function AvisoModal({
  aviso,
  visivel,
  onFechar,
}: {
  aviso: Aviso;
  visivel: boolean;
  onFechar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - spacing.lg * 2, 420);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <View style={styles.overlay}>
        <View style={[styles.card, { width: cardWidth }]}>
          {/* faixa verde/amarela — referência à bandeira, como no encarte */}
          <View style={styles.faixa}>
            <View style={[styles.faixaParte, { backgroundColor: '#1E9E4A' }]} />
            <View style={[styles.faixaParte, { backgroundColor: '#F2C300' }]} />
          </View>

          <Pressable onPress={onFechar} hitSlop={12} style={styles.fechar}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>

          <ScrollView
            contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xl, alignItems: 'center' }}
            showsVerticalScrollIndicator={false}
          >
            <Logo altura={64} />
            <Text style={[styles.titulo, { textAlign: 'center', marginTop: spacing.md }]}>
              {aviso.titulo}
            </Text>

            {aviso.subtitulo && <Text style={styles.subtitulo}>{aviso.subtitulo}</Text>}

            <View style={styles.destaqueBox}>
              <Ionicons name="time-outline" size={26} color={colors.primary} />
              <View style={{ flex: 1 }}>
                {aviso.linhas.map((l) => (
                  <Text key={l} style={styles.linha}>
                    {l}
                  </Text>
                ))}
                {aviso.destaque && <Text style={styles.destaque}>{aviso.destaque}</Text>}
              </View>
            </View>

            {aviso.rodape && <Text style={styles.rodape}>{aviso.rodape}</Text>}

            {aviso.telefone && (
              <Pressable
                style={styles.whats}
                onPress={() =>
                  abrirWhatsApp(
                    aviso.telefone!,
                    'Olá! Gostaria de fazer um pedido pelo televendas.',
                  )
                }
              >
                <Ionicons name="logo-whatsapp" size={22} color={colors.onPrimary} />
                <Text style={styles.whatsTexto}>
                  Televendas {formatarTelefone(aviso.telefone)}
                </Text>
              </Pressable>
            )}

            <Botao
              titulo="Ver ofertas da semana"
              variante="outline"
              onPress={onFechar}
              style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
            />
          </ScrollView>

          <View style={{ height: insets.bottom }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    maxHeight: '85%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  faixa: { flexDirection: 'row', height: 6 },
  faixaParte: { flex: 1 },
  fechar: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
  },
  marca: {
    color: colors.primary,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: 1,
  },
  titulo: {
    color: colors.text,
    fontSize: font.sizeXl,
    fontWeight: font.weightBold,
    marginTop: spacing.xs,
  },
  subtitulo: {
    color: colors.textMuted,
    fontSize: font.sizeSm,
    marginTop: spacing.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  destaqueBox: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  linha: { color: colors.primaryDark, fontSize: font.sizeSm, fontWeight: font.weightMedium },
  destaque: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: font.weightBold,
    marginTop: 2,
  },
  rodape: {
    color: colors.textMuted,
    fontSize: font.sizeSm,
    marginTop: spacing.lg,
    lineHeight: 20,
    textAlign: 'center',
  },
  whats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#25D366',
    height: 52,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  whatsTexto: {
    color: colors.onPrimary,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    flexShrink: 1,
  },
});
