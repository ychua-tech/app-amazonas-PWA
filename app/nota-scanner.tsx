import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '../src/components/ui';
import { useClube } from '../src/context/ClubeContext';
import { brl } from '../src/lib/format';
import { colors, font, radius, spacing } from '../src/theme';

export default function NotaScanner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { registrarNotaFiscal } = useClube();
  const [permissao, pedirPermissao] = useCameraPermissions();
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ numero: string; cashback: number; valor?: number } | null>(null);
  const travado = useRef(false);

  async function aoLerQr(dados: string) {
    if (travado.current || processando || sucesso) return;
    travado.current = true;
    setProcessando(true);
    setErro(null);

    const res = await registrarNotaFiscal(dados);
    if (res.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSucesso({ numero: res.nota.numero, cashback: res.nota.cashback, valor: res.nota.valor });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErro(res.erro);
      setTimeout(() => {
        travado.current = false;
        setErro(null);
      }, 2500);
    }
    setProcessando(false);
  }

  // ---- estados de permissão ----
  if (!permissao) {
    return <View style={styles.centro} />;
  }
  if (!permissao.granted) {
    return (
      <>
        <Stack.Screen options={{ title: 'Escanear nota' }} />
        <View style={styles.centro}>
          <Ionicons name="camera-outline" size={40} color={colors.primary} />
          <Text style={styles.aviso}>
            Precisamos da câmera para ler o QR Code da sua nota fiscal.
          </Text>
          <Botao titulo="Permitir câmera" onPress={pedirPermissao} />
        </View>
      </>
    );
  }

  // ---- sucesso ----
  if (sucesso) {
    return (
      <>
        <Stack.Screen options={{ title: 'Nota registrada', headerBackVisible: false }} />
        <View style={styles.centro}>
          <View style={styles.circuloOk}>
            <Ionicons name="checkmark" size={40} color={colors.onPrimary} />
          </View>
          <Text style={styles.okTitulo}>Nota {sucesso.numero} registrada!</Text>
          <Text style={styles.okTexto}>
            {sucesso.valor ? `Compra de ${brl(sucesso.valor)}. ` : ''}
            {sucesso.cashback > 0
              ? `Você ganhou ${brl(sucesso.cashback)} de cashback no Clube Amazonas.`
              : 'O valor não veio no QR — o cashback desta nota entra depois que a loja confirmar.'}
          </Text>
          <Botao titulo="Voltar ao Clube" onPress={() => router.back()} />
          <Pressable
            onPress={() => {
              setSucesso(null);
              travado.current = false;
            }}
          >
            <Text style={styles.link}>Escanear outra nota</Text>
          </Pressable>
        </View>
      </>
    );
  }

  // ---- câmera ----
  return (
    <>
      <Stack.Screen options={{ title: 'Escanear nota', headerTransparent: true, headerTintColor: '#fff' }} />
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {Platform.OS !== 'web' && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => aoLerQr(data)}
          />
        )}

        <View style={[styles.overlay, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + spacing.xl }]}>
          <Text style={styles.instrucao}>
            Aponte para o QR Code impresso na sua nota fiscal
          </Text>
          <View style={styles.alvo}>
            {processando && <Text style={styles.processando}>Lendo…</Text>}
          </View>
          {erro ? (
            <View style={styles.erroBox}>
              <Ionicons name="alert-circle" size={18} color={colors.onPrimary} />
              <Text style={styles.erroTexto}>{erro}</Text>
            </View>
          ) : (
            <Text style={styles.dica}>
              O QR fica na parte de baixo do cupom, perto da chave de acesso.
            </Text>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  aviso: { fontSize: font.sizeMd, color: colors.text, textAlign: 'center', lineHeight: 22 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  instrucao: {
    color: '#fff',
    fontSize: font.sizeMd,
    fontWeight: font.weightBold,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  alvo: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processando: { color: '#fff', fontWeight: font.weightBold, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 6 },
  dica: { color: '#fff', fontSize: font.sizeSm, textAlign: 'center', opacity: 0.9 },
  erroBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.danger,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  erroTexto: { color: colors.onPrimary, flex: 1, fontSize: font.sizeSm, fontWeight: font.weightMedium },
  circuloOk: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okTitulo: { fontSize: font.sizeXl, fontWeight: font.weightBold, color: colors.text, textAlign: 'center' },
  okTexto: { fontSize: font.sizeSm, color: colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  link: { color: colors.primary, fontWeight: font.weightBold, fontSize: font.sizeSm },
});
