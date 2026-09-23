import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useInstalarApp } from '../hooks/useInstalarApp';
import { colors, font, radius, spacing } from '../theme';

/**
 * Banner discreto oferecendo instalar o app (PWA) na tela inicial.
 * Some sozinho se não for web, se já estiver instalado, ou depois de dispensado.
 */
export function InstalarAppBanner() {
  const { visivel, modoManualIOS, podeInstalar, instalar, dispensar } = useInstalarApp();
  if (!visivel) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.icone}>
        <Ionicons name={modoManualIOS ? 'share-outline' : 'download-outline'} size={20} color={colors.primary} />
      </View>
      <View style={styles.texto}>
        <Text style={styles.titulo}>Instale o app do Amazonas</Text>
        <Text style={styles.descricao}>
          {modoManualIOS
            ? 'Toque em Compartilhar e depois em "Adicionar à Tela de Início".'
            : 'Acesso mais rápido, direto da tela inicial do seu celular.'}
        </Text>
      </View>
      {podeInstalar && (
        <Pressable style={styles.botao} onPress={instalar} hitSlop={8}>
          <Text style={styles.botaoTexto}>Instalar</Text>
        </Pressable>
      )}
      <Pressable onPress={dispensar} hitSlop={10} style={styles.fechar}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  icone: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { flex: 1, gap: 1 },
  titulo: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text },
  descricao: { fontSize: font.sizeXs, color: colors.textMuted },
  botao: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  botaoTexto: { color: colors.onPrimary, fontSize: font.sizeXs, fontWeight: font.weightBold },
  fechar: { padding: spacing.xs },
});
