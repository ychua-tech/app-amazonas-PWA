import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useAdmin } from '../../src/context/AdminContext';
import { Botao, Campo } from '../../src/components/ui';
import { colors, font, spacing } from '../../src/theme';

export default function AdminPin() {
  const router = useRouter();
  const { temPin, definirPin, removerPin } = useAdmin();
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (pin.length < 4) {
      setErro('O PIN precisa ter 4 dígitos.');
      return;
    }
    await definirPin(pin);
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>{temPin ? 'Trocar PIN' : 'Criar PIN'}</Text>
      <Text style={styles.sub}>
        O PIN de 4 dígitos é pedido toda vez que você abre o admin neste aparelho.
      </Text>

      <Campo
        rotulo="PIN (4 dígitos)"
        value={pin}
        onChangeText={(t) => {
          setErro(null);
          setPin(t.replace(/\D/g, '').slice(0, 4));
        }}
        placeholder="0000"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        style={{ marginTop: spacing.lg }}
      />
      {erro && <Text style={styles.erro}>{erro}</Text>}

      <Botao titulo="Salvar PIN" onPress={salvar} style={{ marginTop: spacing.lg }} />

      {temPin && (
        <Botao
          titulo="Remover PIN"
          variante="outline"
          onPress={async () => {
            await removerPin();
            router.back();
          }}
          style={{ marginTop: spacing.sm }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xl },
  titulo: { fontSize: font.sizeXl, fontWeight: font.weightBold, color: colors.text },
  sub: { fontSize: font.sizeSm, color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs },
  erro: { fontSize: font.sizeXs, color: colors.danger, marginTop: spacing.sm },
});
