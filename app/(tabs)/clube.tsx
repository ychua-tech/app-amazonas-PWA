import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao, Card } from '../../src/components/ui';
import { useClube, type ExtratoItem } from '../../src/context/ClubeContext';
import { loja } from '../../src/data/loja';
import { brl } from '../../src/lib/format';
import { cashbackEmDemonstracao } from '../../src/lib/nfe';
import { colors, font, gradiente, radius, shadow, spacing } from '../../src/theme';

const BENEFICIOS = [
  { icone: 'cash-outline', texto: `${loja.cashbackPercentual}% de cashback em cada nota fiscal, para abater nas próximas compras` },
  { icone: 'pricetag-outline', texto: 'Preço de sócio em centenas de produtos' },
  { icone: 'flash-outline', texto: 'Acesso antecipado às ofertas relâmpago' },
  { icone: 'gift-outline', texto: 'Bônus de boas-vindas e cupom de aniversário' },
] as const;

export default function ClubeScreen() {
  const insets = useSafeAreaInsets();
  const { carregando, socio, cashback, totalGasto, extrato, entrar, sair } = useClube();
  const router = useRouter();

  if (carregando) return null;

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.lg,
        paddingBottom: insets.bottom + spacing.xxl,
        gap: spacing.xl,
      }}
      showsVerticalScrollIndicator={false}
    >
      {socio ? (
        <AreaSocio
          nome={socio.nome}
          cartao={socio.cartao}
          cashback={cashback}
          totalGasto={totalGasto}
          totalNotas={socio.notas.length}
          extrato={extrato}
          onEscanear={() => router.push('/nota-scanner')}
          onCarrinho={() => router.push('/carrinho')}
          onSair={sair}
        />
      ) : (
        <Cadastro onEntrar={entrar} />
      )}

      <View>
        <Text style={styles.secao}>Vantagens do Clube</Text>
        <Card style={{ gap: spacing.lg }}>
          {BENEFICIOS.map((b) => (
            <View key={b.texto} style={styles.beneficioRow}>
              <View style={styles.beneficioIcone}>
                <Ionicons name={b.icone} size={18} color={colors.primary} />
              </View>
              <Text style={styles.beneficioTexto}>{b.texto}</Text>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}

function AreaSocio({
  nome,
  cartao,
  cashback,
  totalGasto,
  totalNotas,
  extrato,
  onEscanear,
  onCarrinho,
  onSair,
}: {
  nome: string;
  cartao: string;
  cashback: number;
  totalGasto: number;
  totalNotas: number;
  extrato: ExtratoItem[];
  onEscanear: () => void;
  onCarrinho: () => void;
  onSair: () => void;
}) {
  return (
    <View style={{ gap: spacing.xl }}>
      {/* Cartão de cashback */}
      <LinearGradient
        colors={gradiente.marca}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cartao}
      >
        <View style={styles.cartaoTopo}>
          <View style={styles.cartaoMarcaRow}>
            <Ionicons name="heart" size={16} color={colors.onPrimary} />
            <Text style={styles.cartaoMarca}>Clube Amazonas</Text>
          </View>
          <Ionicons name="wifi" size={18} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }] }} />
        </View>

        <Text style={styles.cashbackLabel}>Cashback disponível</Text>
        <Text style={styles.cashbackValor}>{brl(cashback)}</Text>

        <View style={styles.cartaoRodape}>
          <View>
            <Text style={styles.cartaoNomeLabel}>SÓCIO</Text>
            <Text style={styles.cartaoNome}>{nome}</Text>
          </View>
          <Text style={styles.cartaoNumero}>{cartao}</Text>
        </View>
      </LinearGradient>

      {/* Como usar */}
      <View style={styles.usarCard}>
        <View style={styles.usarIcone}>
          <Ionicons name="pricetags" size={18} color={colors.cashback} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.usarTitulo}>Como usar seu cashback</Text>
          <Text style={styles.usarTexto}>
            No carrinho, ao finalizar o pedido, ative “Usar cashback” — o valor
            abate direto no total da compra.
          </Text>
        </View>
      </View>

      {cashback > 0 && (
        <Botao titulo="Usar cashback numa compra" onPress={onCarrinho} />
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValor}>{totalNotas}</Text>
          <Text style={styles.statLabel}>notas{'\n'}registradas</Text>
        </View>
        <View style={styles.statDiv} />
        <View style={styles.stat}>
          <Text style={styles.statValor}>{brl(totalGasto)}</Text>
          <Text style={styles.statLabel}>em compras{'\n'}no Clube</Text>
        </View>
      </View>

      {/* Registrar compra */}
      <Card style={{ gap: spacing.sm }}>
        <Text style={styles.escanearTitulo}>Registrar uma compra</Text>
        <Text style={styles.escanearTexto}>
          Escaneie o QR Code da nota fiscal que você recebe no caixa. O cashback
          entra na hora.
        </Text>
        <Botao
          titulo="Escanear nota fiscal"
          onPress={onEscanear}
          style={{ marginTop: spacing.xs }}
        />
        {cashbackEmDemonstracao() && (
          <Text style={styles.demoTexto}>
            Modo demonstração: qualquer nota é aceita até cadastrarmos o CNPJ das lojas.
          </Text>
        )}
      </Card>

      {/* Extrato */}
      {extrato.length > 0 && (
        <View>
          <Text style={styles.secao}>Extrato do cashback</Text>
          <Card style={{ paddingVertical: spacing.xs }}>
            {extrato.slice(0, 12).map((e, i) => {
              const credito = e.valor >= 0;
              return (
                <View key={e.id} style={[styles.extLinha, i > 0 && styles.extBorda]}>
                  <View
                    style={[
                      styles.extIcone,
                      { backgroundColor: credito ? colors.successSoft : colors.surface },
                    ]}
                  >
                    <Ionicons
                      name={credito ? 'arrow-down' : 'arrow-up'}
                      size={14}
                      color={credito ? colors.cashback : colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.extTitulo} numberOfLines={1}>
                      {e.titulo}
                    </Text>
                    <Text style={styles.extData}>
                      {new Date(e.em).toLocaleDateString('pt-BR')}
                      {e.detalhe ? ` · ${e.detalhe}` : ''}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.extValor,
                      { color: credito ? colors.cashback : colors.textMuted },
                    ]}
                  >
                    {credito ? '+ ' : '- '}
                    {brl(Math.abs(e.valor))}
                  </Text>
                </View>
              );
            })}
          </Card>
        </View>
      )}

      <Botao titulo="Sair da conta" variante="outline" onPress={onSair} />
    </View>
  );
}

function Cadastro({
  onEntrar,
}: {
  onEntrar: (d: { nome: string; cpf: string; telefone: string }) => Promise<void>;
}) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [enviando, setEnviando] = useState(false);

  const valido =
    nome.trim().length > 2 &&
    cpf.replace(/\D/g, '').length === 11 &&
    telefone.replace(/\D/g, '').length >= 10;

  async function submit() {
    setEnviando(true);
    try {
      await onEntrar({ nome, cpf, telefone });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={gradiente.marca} style={styles.hero}>
        <View style={styles.heroSelo}>
          <Ionicons name="heart" size={24} color={colors.onPrimary} />
        </View>
        <Text style={styles.heroTitulo}>Entre no Clube Amazonas</Text>
        <Text style={styles.heroSub}>
          É de graça e você ganha {brl(25)} de bônus na hora. A cada nota fiscal
          escaneada, {loja.cashbackPercentual}% viram cashback para as próximas compras.
        </Text>
      </LinearGradient>

      <Card style={{ gap: spacing.md, marginTop: spacing.lg }}>
        <Campo label="Nome completo" valor={nome} onChange={setNome} placeholder="Como no seu documento" />
        <Campo
          label="CPF"
          valor={cpf}
          onChange={setCpf}
          placeholder="000.000.000-00"
          keyboardType="number-pad"
        />
        <Campo
          label="Celular (WhatsApp)"
          valor={telefone}
          onChange={setTelefone}
          placeholder="(66) 90000-0000"
          keyboardType="phone-pad"
        />
        <Botao
          titulo="Criar meu cartão"
          onPress={submit}
          disabled={!valido}
          carregando={enviando}
          style={{ marginTop: spacing.xs }}
        />
        <Text style={styles.termos}>
          Ao continuar você concorda com os termos do programa de fidelidade.
        </Text>
      </Card>
    </KeyboardAvoidingView>
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
  keyboardType?: 'number-pad' | 'phone-pad' | 'default';
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.campoLabel}>{label}</Text>
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
  hero: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.md,
  },
  heroSelo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroTitulo: { color: colors.onPrimary, fontSize: font.sizeXl, fontWeight: font.weightBold, textAlign: 'center' },
  heroSub: { color: colors.onPrimary, opacity: 0.95, textAlign: 'center', fontSize: font.sizeSm, lineHeight: 20 },
  campoLabel: { fontSize: font.sizeSm, fontWeight: font.weightMedium, color: colors.textMuted },
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
  termos: { fontSize: font.sizeXs, color: colors.textSubtle, textAlign: 'center' },

  cartao: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    minHeight: 210,
    justifyContent: 'space-between',
    ...shadow.lg,
  },
  cartaoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cartaoMarcaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cartaoMarca: { color: colors.onPrimary, fontWeight: font.weightBold, fontSize: font.sizeSm, letterSpacing: 0.3 },
  cashbackLabel: { color: colors.onPrimary, opacity: 0.85, fontSize: font.sizeXs, letterSpacing: 0.5, marginTop: spacing.md },
  cashbackValor: { color: colors.onPrimary, fontSize: font.size2xl, fontWeight: font.weightBold, marginTop: 2 },
  cartaoRodape: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.lg },
  cartaoNomeLabel: { color: colors.onPrimary, opacity: 0.7, fontSize: 9, letterSpacing: 1.5, fontWeight: font.weightBold },
  cartaoNome: { color: colors.onPrimary, fontSize: font.sizeMd, fontWeight: font.weightBold, marginTop: 2 },
  cartaoNumero: { color: colors.onPrimary, opacity: 0.85, fontSize: font.sizeXs, letterSpacing: 1 },

  usarCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#CDECDB',
    padding: spacing.lg,
  },
  usarIcone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usarTitulo: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: '#0B6E4F' },
  usarTexto: { fontSize: font.sizeXs, color: '#3B8B6E', lineHeight: 17, marginTop: 2 },

  demoTexto: { fontSize: font.sizeXs, color: colors.textSubtle, fontStyle: 'italic' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.lg },
  statDiv: { width: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  statValor: { fontSize: font.sizeLg, fontWeight: font.weightBold, color: colors.text },
  statLabel: { fontSize: font.sizeXs, color: colors.textMuted, textAlign: 'center', lineHeight: 15 },

  escanearTitulo: { fontSize: font.sizeMd, fontWeight: font.weightBold, color: colors.text },
  escanearTexto: { fontSize: font.sizeSm, color: colors.textMuted, lineHeight: 20 },

  extLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  extBorda: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
  extIcone: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  extTitulo: { fontSize: font.sizeSm, fontWeight: font.weightMedium, color: colors.text },
  extData: { fontSize: font.sizeXs, color: colors.textSubtle, marginTop: 1 },
  extValor: { fontSize: font.sizeSm, fontWeight: font.weightBold },

  secao: {
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  beneficioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  beneficioIcone: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beneficioTexto: { flex: 1, fontSize: font.sizeSm, color: colors.text, lineHeight: 19 },
});
