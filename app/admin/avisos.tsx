import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../src/api/http';
import { Botao, Campo } from '../../src/components/ui';
import { useAdmin } from '../../src/context/AdminContext';
import type { Aviso } from '../../src/data/types';
import { colors, font, radius, spacing } from '../../src/theme';

const emDias = (d: number) => {
  const dt = new Date();
  dt.setHours(23, 59, 0, 0);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
};

export default function AdminAvisos() {
  const insets = useSafeAreaInsets();
  const { req } = useAdmin();
  const [carregando, setCarregando] = useState(true);
  const [ativo, setAtivo] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [linhas, setLinhas] = useState('');
  const [destaque, setDestaque] = useState('');
  const [rodape, setRodape] = useState('');
  const [telefone, setTelefone] = useState('');
  const [expiraDias, setExpiraDias] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const a = await req<Aviso | null>('/admin/aviso');
        if (a) {
          setAtivo(a.ativo !== false);
          setTitulo(a.titulo ?? '');
          setSubtitulo(a.subtitulo ?? '');
          setLinhas((a.linhas ?? []).join('\n'));
          setDestaque(a.destaque ?? '');
          setRodape(a.rodape ?? '');
          setTelefone(a.telefone ?? '');
        }
      } catch {
        // deixa o formulário em branco
      } finally {
        setCarregando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    const corpo = {
      ativo,
      titulo: titulo.trim(),
      subtitulo: subtitulo.trim(),
      linhas: linhas.split('\n').map((s) => s.trim()).filter(Boolean),
      destaque: destaque.trim(),
      rodape: rodape.trim(),
      telefone: telefone.replace(/\D/g, ''),
      expira: expiraDias ? emDias(Number(expiraDias) || 0) : undefined,
    };
    try {
      await req('/admin/aviso', { method: 'POST', body: JSON.stringify(corpo) });
      setMsg({
        tipo: 'ok',
        texto: corpo.titulo ? 'Aviso salvo. Aparece na próxima abertura do app.' : 'Aviso desativado.',
      });
    } catch (e) {
      setMsg({ tipo: 'err', texto: e instanceof ApiError ? e.message : 'Não foi possível salvar.' });
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.dica}>
        Mensagem que aparece uma vez por dia ao abrir o app (ex.: horário especial de
        feriado). Deixe o título vazio e salve para desativar.
      </Text>

      <View style={styles.switchRow}>
        <Text style={styles.rotulo}>Aviso ativo</Text>
        <Switch value={ativo} onValueChange={setAtivo} trackColor={{ true: colors.primary, false: colors.border }} />
      </View>

      <Campo rotulo="Título" value={titulo} onChangeText={setTitulo} placeholder="Feriado da Independência" />
      <Campo rotulo="Subtítulo" value={subtitulo} onChangeText={setSubtitulo} placeholder="Neste feriado o horário é especial" />
      <Campo rotulo="Linhas (uma por linha)" value={linhas} onChangeText={setLinhas} placeholder={'Segunda 07/09\nDas 6h às 12h'} multiline />
      <Campo rotulo="Destaque (texto grande)" value={destaque} onChangeText={setDestaque} placeholder="DAS 6H ÀS 12H" />
      <Campo rotulo="Rodapé" value={rodape} onChangeText={setRodape} placeholder="Antecipe as compras ou peça pelo televendas." />
      <View style={styles.linha}>
        <Campo rotulo="Televendas (só números)" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" placeholder="5566..." style={{ flex: 1 }} />
        <Campo rotulo="Expira (dias)" value={expiraDias} onChangeText={(t) => setExpiraDias(t.replace(/\D/g, ''))} keyboardType="number-pad" style={{ width: 110 }} />
      </View>

      {msg && <Text style={[styles.msg, msg.tipo === 'ok' ? styles.msgOk : styles.msgErr]}>{msg.texto}</Text>}
      <Botao titulo="Salvar aviso" onPress={salvar} carregando={salvando} style={{ marginTop: spacing.xs }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dica: { fontSize: font.sizeXs, color: colors.textMuted, lineHeight: 18 },
  rotulo: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text },
  linha: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  msg: { fontSize: font.sizeXs, padding: spacing.sm, borderRadius: radius.sm, overflow: 'hidden' },
  msgOk: { color: colors.success, backgroundColor: colors.successSoft },
  msgErr: { color: colors.danger, backgroundColor: colors.dangerSoft },
});
