import { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiError } from '../../src/api/http';
import { useAdmin } from '../../src/context/AdminContext';
import { Botao, Campo } from '../../src/components/ui';
import { API_ATIVA } from '../../src/api/config';
import { colors, font, radius, spacing } from '../../src/theme';

export default function AdminLogin() {
  const router = useRouter();
  const { entrar, definirPin } = useAdmin();
  const [token, setToken] = useState('');
  const [pin, setPin] = useState('');
  const [fase, setFase] = useState<'token' | 'pin'>('token');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function validar() {
    setErro(null);
    setOcupado(true);
    try {
      await entrar(token);
      setFase('pin');
    } catch (e) {
      if (e instanceof ApiError) setErro(e.message);
      else setErro(`Não foi possível entrar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setOcupado(false);
    }
  }

  async function salvarPin() {
    if (pin.length < 4) {
      setErro('O PIN precisa ter 4 dígitos.');
      return;
    }
    setOcupado(true);
    await definirPin(pin);
    router.replace('/admin');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.selo}>
          <Ionicons name="lock-closed" size={26} color={colors.primary} />
        </View>

        {fase === 'token' ? (
          <>
            <Text style={styles.titulo}>Acesso restrito</Text>
            <Text style={styles.sub}>
              Esta área é só para a administração do supermercado. Informe o token
              definido no servidor (variável ADMIN_TOKEN).
            </Text>

            {!API_ATIVA && (
              <Text style={styles.avisoErro}>
                O app está em modo demo (sem servidor). Configure EXPO_PUBLIC_API_URL
                para usar o admin.
              </Text>
            )}

            <Campo
              rotulo="Token de administrador"
              value={token}
              onChangeText={setToken}
              placeholder="cole o token aqui"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={{ marginTop: spacing.md }}
            />
            {erro && <Text style={styles.avisoErro}>{erro}</Text>}
            <Botao
              titulo="Entrar"
              onPress={validar}
              carregando={ocupado}
              disabled={!token.trim() || !API_ATIVA}
              style={{ marginTop: spacing.lg }}
            />
          </>
        ) : (
          <>
            <Text style={styles.titulo}>Criar um PIN</Text>
            <Text style={styles.sub}>
              Um PIN de 4 dígitos pede sua confirmação toda vez que abrir o admin.
              É opcional — você pode pular.
            </Text>
            <Campo
              rotulo="PIN (4 dígitos)"
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              style={{ marginTop: spacing.md }}
            />
            {erro && <Text style={styles.avisoErro}>{erro}</Text>}
            <Botao
              titulo="Salvar PIN"
              onPress={salvarPin}
              carregando={ocupado}
              style={{ marginTop: spacing.lg }}
            />
            <Botao
              titulo="Pular por agora"
              variante="outline"
              onPress={() => router.replace('/admin')}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xl, gap: spacing.xs },
  selo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  titulo: { fontSize: font.sizeXl, fontWeight: font.weightBold, color: colors.text },
  sub: { fontSize: font.sizeSm, color: colors.textMuted, lineHeight: 20, marginTop: spacing.xs },
  avisoErro: {
    fontSize: font.sizeXs,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
});
