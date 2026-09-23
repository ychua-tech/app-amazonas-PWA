import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../src/context/AdminContext';
import { colors, font, radius, shadow, spacing } from '../../src/theme';

const ITENS: {
  rota: '/admin/precos' | '/admin/ofertas' | '/admin/avisos' | '/admin/pedidos';
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao: string;
}[] = [
  { rota: '/admin/precos', icone: 'pricetag', titulo: 'Preços dos produtos', descricao: 'Ajustar preços do catálogo durante a semana' },
  { rota: '/admin/ofertas', icone: 'megaphone', titulo: 'Ofertas da semana', descricao: 'Criar, editar e disparar ofertas relâmpago' },
  { rota: '/admin/avisos', icone: 'notifications', titulo: 'Aviso de abertura', descricao: 'Mensagem que aparece ao abrir o app' },
  { rota: '/admin/pedidos', icone: 'cube', titulo: 'Pedidos', descricao: 'Acompanhar e mudar o status dos pedidos' },
];

export default function AdminHome() {
  const router = useRouter();
  const { temPin, sair } = useAdmin();

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      {ITENS.map((it) => (
        <Pressable key={it.rota} style={styles.card} onPress={() => router.push(it.rota)}>
          <View style={styles.icone}>
            <Ionicons name={it.icone} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>{it.titulo}</Text>
            <Text style={styles.descricao}>{it.descricao}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </Pressable>
      ))}

      <View style={{ height: spacing.md }} />

      <Pressable style={styles.linha} onPress={() => router.push('/admin/pin')}>
        <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
        <Text style={styles.linhaTexto}>{temPin ? 'Trocar / remover PIN de acesso' : 'Criar PIN de acesso'}</Text>
      </Pressable>

      <Pressable
        style={styles.linha}
        onPress={() =>
          Alert.alert('Sair do admin', 'Vai precisar do token de novo para entrar.', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Sair',
              style: 'destructive',
              onPress: async () => {
                await sair();
                router.replace('/');
              },
            },
          ])
        }
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={[styles.linhaTexto, { color: colors.danger }]}>Sair do admin</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.sm,
  },
  icone: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: font.sizeMd, fontWeight: font.weightBold, color: colors.text },
  descricao: { fontSize: font.sizeXs, color: colors.textMuted, marginTop: 2 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  linhaTexto: { fontSize: font.sizeSm, color: colors.textMuted, fontWeight: font.weightMedium },
});
