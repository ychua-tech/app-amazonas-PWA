import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '../src/components/ui';
import { useCarrinho } from '../src/context/CarrinhoContext';
import { useClube } from '../src/context/ClubeContext';
import { usePedidos } from '../src/context/PedidosContext';
import { formasPagamentoPedido, type FormaPagamentoPedido } from '../src/data/loja';
import { brl } from '../src/lib/format';
import { enviarPedidoWhatsApp, type DadosEntrega } from '../src/lib/pedido';
import { colors, font, radius, shadow, spacing } from '../src/theme';

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { itens, subtotal, limpar } = useCarrinho();
  const { socio, cashback, usarCashback } = useClube();
  const { criar } = usePedidos();

  const [nome, setNome] = useState(socio?.nome ?? '');
  const [telefone, setTelefone] = useState(socio?.telefone ?? '');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [referencia, setReferencia] = useState('');
  const [pagamento, setPagamento] = useState<FormaPagamentoPedido>('pix');
  const [trocoPara, setTrocoPara] = useState('');
  const [observacao, setObservacao] = useState('');
  const [usarSaldo, setUsarSaldo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cashbackAplicado = useMemo(
    () => (usarSaldo ? round2(Math.min(cashback, subtotal)) : 0),
    [usarSaldo, cashback, subtotal],
  );
  const total = round2(subtotal - cashbackAplicado);
  const qtdItens = itens.reduce((s, i) => s + i.quantidade, 0);

  const valido = useMemo(
    () => nome.trim().length > 2 && endereco.trim().length > 3 && itens.length > 0,
    [nome, endereco, itens.length],
  );

  async function enviar() {
    if (!valido) return;
    setEnviando(true);
    const dados: DadosEntrega = {
      nome: nome.trim(),
      telefone: telefone.trim() || undefined,
      endereco: endereco.trim(),
      bairro: bairro.trim() || undefined,
      referencia: referencia.trim() || undefined,
      pagamento,
      trocoPara: pagamento === 'dinheiro' && trocoPara.trim() ? trocoPara.trim() : undefined,
      observacao: observacao.trim() || undefined,
      cartaoClube: socio?.cartao,
      cashbackUsado: cashbackAplicado || undefined,
    };
    try {
      const resumo = await criar({
        cliente: {
          nome: dados.nome,
          telefone: dados.telefone,
          endereco: dados.endereco,
          bairro: dados.bairro,
          referencia: dados.referencia,
        },
        pagamento:
          formasPagamentoPedido.find((f) => f.id === pagamento)?.rotulo ?? pagamento,
        trocoPara: dados.trocoPara,
        observacao: dados.observacao,
        itens: itens.map((i) => ({
          nome: i.nome,
          unidade: i.modo === 'peso' ? 'kg' : i.unidade,
          quantidade: i.quantidade,
          precoOferta: i.preco,
          modo: i.modo,
          pesoKg: i.pesoKg,
        })),
        subtotal,
        cashbackUsado: cashbackAplicado || undefined,
      });
      if (cashbackAplicado > 0) {
        await usarCashback(cashbackAplicado, `Usado no pedido ${resumo.codigo}`);
      }
      await enviarPedidoWhatsApp(itens, dados, resumo.codigo);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      limpar();
      router.replace(`/pedido/${resumo.id}`);
    } catch {
      await enviarPedidoWhatsApp(itens, dados);
      limpar();
      router.replace('/');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Finalizar pedido' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: insets.bottom + 150,
            gap: spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Secao titulo="Seus dados" icone="person-outline">
            <Campo label="Nome completo" valor={nome} onChange={setNome} />
            <Campo
              label="Celular (WhatsApp)"
              valor={telefone}
              onChange={setTelefone}
              keyboardType="phone-pad"
            />
          </Secao>

          <Secao titulo="Endereço de entrega" icone="location-outline">
            <Campo label="Rua e número" valor={endereco} onChange={setEndereco} />
            <Campo label="Bairro" valor={bairro} onChange={setBairro} />
            <Campo
              label="Ponto de referência (opcional)"
              valor={referencia}
              onChange={setReferencia}
            />
          </Secao>

          <Secao titulo="Pagamento na entrega" icone="wallet-outline">
            <View style={styles.card}>
              {formasPagamentoPedido.map((f, i) => (
                <Pressable
                  key={f.id}
                  onPress={() => setPagamento(f.id)}
                  style={[styles.radioLinha, i > 0 && styles.linhaBorda]}
                >
                  <Ionicons
                    name={pagamento === f.id ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={pagamento === f.id ? colors.primary : colors.textSubtle}
                  />
                  <Text style={styles.radioTexto}>{f.rotulo}</Text>
                </Pressable>
              ))}
            </View>
            {pagamento === 'dinheiro' && (
              <Campo
                label="Troco para quanto?"
                valor={trocoPara}
                onChange={setTrocoPara}
                keyboardType="number-pad"
                placeholder="Ex: 100,00"
              />
            )}
          </Secao>

          {socio && cashback > 0 && (
            <Secao titulo="Cashback do Clube" icone="cash-outline">
              <View style={styles.cashbackCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cashbackTitulo}>
                    Usar {brl(Math.min(cashback, subtotal))} de saldo
                  </Text>
                  <Text style={styles.cashbackSub}>
                    Você tem {brl(cashback)} disponível. Abate direto no total.
                  </Text>
                </View>
                <Switch
                  value={usarSaldo}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setUsarSaldo(v);
                  }}
                  trackColor={{ false: colors.border, true: colors.cashback }}
                  thumbColor={colors.card}
                />
              </View>
            </Secao>
          )}

          <Secao titulo="Observação (opcional)" icone="chatbubble-ellipses-outline">
            <TextInput
              value={observacao}
              onChangeText={setObservacao}
              placeholder="Ex: banana bem verde, sem sacola plástica..."
              placeholderTextColor={colors.textSubtle}
              multiline
              style={[styles.input, { height: 84, textAlignVertical: 'top', paddingTop: spacing.md }]}
            />
          </Secao>

          {/* Resumo de valores */}
          <View style={styles.card}>
            <LinhaValor label={`Itens (${qtdItens})`} valor={brl(subtotal)} />
            {cashbackAplicado > 0 && (
              <LinhaValor
                label="Cashback do Clube"
                valor={`- ${brl(cashbackAplicado)}`}
                cor={colors.cashback}
              />
            )}
            <View style={[styles.linhaValor, styles.linhaTotal]}>
              <Text style={styles.totalLabel}>Total do pedido</Text>
              <Text style={styles.totalValor}>{brl(total)}</Text>
            </View>
            <Text style={styles.aviso}>
              A taxa de entrega é combinada no WhatsApp. Preços conforme o app,
              conferidos na separação.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.rodape, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.rodapeTotal}>
            <Text style={styles.rodapeLabel}>Total</Text>
            <Text style={styles.rodapeValor}>{brl(total)}</Text>
          </View>
          <Botao
            titulo="Enviar pelo WhatsApp"
            onPress={enviar}
            disabled={!valido}
            carregando={enviando}
            style={{ flex: 1 }}
          />
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

function LinhaValor({
  label,
  valor,
  cor,
}: {
  label: string;
  valor: string;
  cor?: string;
}) {
  return (
    <View style={styles.linhaValor}>
      <Text style={styles.linhaLabel}>{label}</Text>
      <Text style={[styles.linhaVal, cor && { color: cor, fontWeight: font.weightBold }]}>
        {valor}
      </Text>
    </View>
  );
}

function Secao({
  titulo,
  icone,
  children,
}: {
  titulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.secaoHeader}>
        <Ionicons name={icone} size={18} color={colors.primary} />
        <Text style={styles.secaoTitulo}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

function Campo({
  label,
  valor,
  onChange,
  placeholder,
  keyboardType,
}: {
  label: string;
  valor: string;
  onChange: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'phone-pad' | 'number-pad' | 'default';
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  secaoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  secaoTitulo: { fontSize: font.sizeMd, fontWeight: font.weightBold, color: colors.text },
  label: { fontSize: font.sizeSm, color: colors.textMuted, fontWeight: font.weightMedium },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
    fontSize: font.sizeMd,
    color: colors.text,
    backgroundColor: colors.card,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.sm,
  },
  radioLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  linhaBorda: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
  radioTexto: { fontSize: font.sizeSm, color: colors.text },

  cashbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#CDECDB',
    padding: spacing.lg,
  },
  cashbackTitulo: { fontSize: font.sizeMd, fontWeight: font.weightBold, color: '#0B6E4F' },
  cashbackSub: { fontSize: font.sizeXs, color: '#3B8B6E', marginTop: 2 },

  linhaValor: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  linhaLabel: { fontSize: font.sizeSm, color: colors.textMuted },
  linhaVal: { fontSize: font.sizeSm, color: colors.text },
  linhaTotal: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.md },
  totalLabel: { fontSize: font.sizeMd, fontWeight: font.weightBold, color: colors.text },
  totalValor: { fontSize: font.sizeLg, fontWeight: font.weightBold, color: colors.primary },
  aviso: { fontSize: font.sizeXs, color: colors.textSubtle, lineHeight: 17, marginTop: spacing.sm },

  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    ...shadow.lg,
  },
  rodapeTotal: { minWidth: 88 },
  rodapeLabel: { fontSize: font.sizeXs, color: colors.textMuted },
  rodapeValor: { fontSize: font.sizeLg, fontWeight: font.weightBold, color: colors.text },
});
