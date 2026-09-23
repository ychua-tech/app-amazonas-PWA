import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../src/context/AdminContext';
import { Botao, Campo } from '../../src/components/ui';
import { colors, font, spacing } from '../../src/theme';

export default function Desbloquear() {
  const router = useRouter();
  const { desbloquear, sair } = useAdmin();
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState(false);

  async function tentar(valor: string) {
    setPin(valor);
    setErro(false);
    if (valor.length === 4) {
      const ok = await desbloquear(valor);
      if (ok) router.replace('/admin');
      else {
        setErro(true);
        setPin('');
      }
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.selo}>
        <Ionicons name="keypad" size={26} color={colors.primary} />
      </View>
      <Text style={styles.titulo}>Digite seu PIN</Text>
      <Text style={styles.sub}>PIN de 4 dígitos do admin.</Text>

      <Campo
        value={pin}
        onChangeText={(t) => tentar(t.replace(/\D/g, '').slice(0, 4))}
        placeholder="0000"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        autoFocus
        style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
      />
      {erro && <Text style={styles.erro}>PIN incorreto. Tente de novo.</Text>}

      <Botao
        titulo="Esqueci o PIN — sair"
        variante="outline"
        onPress={async () => {
          await sair();
          router.replace('/admin/login');
        }}
        style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.xl, alignItems: 'center' },
  selo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  titulo: { fontSize: font.sizeXl, fontWeight: font.weightBold, color: colors.text },
  sub: { fontSize: font.sizeSm, color: colors.textMuted, marginTop: spacing.xs },
  erro: { fontSize: font.sizeXs, color: colors.danger, marginTop: spacing.sm },
});
