import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProdutoImagem } from '../../src/components/ProdutoImagem';
import { Stepper } from '../../src/components/Stepper';
import { Botao } from '../../src/components/ui';
import { useCarrinho } from '../../src/context/CarrinhoContext';
import { formatarPeso } from '../../src/data/compravel';
import { brl } from '../../src/lib/format';
import { colors, font, gradiente, radius, shadow, spacing } from '../../src/theme';

const PASSOS = [
  { icone: 'basket-outline', texto: 'Escolha os produtos aqui no app' },
  { icone: 'chatbubbles-outline', texto: 'Finalize e sua lista vai pro WhatsApp do mercado' },
  { icone: 'home-outline', texto: 'A gente confirma, separa e entrega na sua casa' },
] as const;

export default function CarrinhoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { itens, subtotal, totalItens, totalLinha, definirQuantidade, remover } =
    useCarrinho();

  if (itens.length === 0) {
    return (
      <FlatList
        data={[]}
        renderItem={() => null}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <LinearGradient colors={gradiente.marca} style={styles.hero}>
              <View style={styles.heroSelo}>
                <Ionicons name="cart" size={26} color={colors.onPrimary} />
              </View>
              <Text style={styles.heroTitulo}>Compre pelo app e receba em casa</Text>
              <Text style={styles.heroSub}>
                Sem taxa de app. Monte a lista, finalize e o pedido chega pra gente
                na hora pelo WhatsApp.
              </Text>
            </LinearGradient>

            <View style={{ gap: spacing.md }}>
              {PASSOS.map((p, i) => (
                <View key={p.texto} style={styles.passo}>
                  <View style={styles.passoNum}>
                    <Text style={styles.passoNumTexto}>{i + 1}</Text>
                  </View>
                  <Ionicons name={p.icone} size={20} color={colors.primary} />
                  <Text style={styles.passoTexto}>{p.texto}</Text>
                </View>
              ))}
            </View>

            <Botao titulo="Explorar o mercado" onPress={() => router.push('/mercado')} />
            <Botao
              titulo="Acompanhar meus pedidos"
              variante="outline"
              onPress={() => router.push('/meus-pedidos')}
            />

            <Text style={styles.obs}>
              Pagamento na entrega: Pix, dinheiro ou cartão na maquininha.
            </Text>
          </View>
        }
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={itens}
        keyExtractor={(i) => i.linhaId}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: 190,
          gap: spacing.sm,
        }}
        ListHeaderComponent={
          <Text style={styles.contador}>
            {totalItens} {totalItens === 1 ? 'item' : 'itens'} no carrinho
          </Text>
        }
        renderItem={({ item }) => {
          const peso = item.modo === 'peso';
          return (
            <View style={styles.item}>
              <ProdutoImagem
                uri={item.imagem}
                categoria={item.categoria}
                height={60}
                width={60}
                radius={radius.md}
                iconeTamanho={22}
              />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.itemNome} numberOfLines={2}>
                  {item.nome}
                </Text>
                <Text style={styles.itemPreco}>
                  {peso
                    ? `≈ ${formatarPeso(item.pesoKg ?? 0)} · ${brl(item.preco)}/kg`
                    : `${brl(item.preco)} / ${item.unidade}`}
                </Text>
                <View style={styles.itemBaixo}>
                  <Stepper
                    valor={item.quantidade}
                    tamanho="sm"
                    onMudar={(n) => definirQuantidade(item.linhaId, n)}
                  />
                  <Text style={styles.itemTotal}>
                    {peso ? '≈ ' : ''}
                    {brl(totalLinha(item))}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => remover(item.linhaId)} hitSlop={8}>
                <Ionicons name="close" size={18} color={colors.textSubtle} />
              </Pressable>
            </View>
          );
        }}
        ListFooterComponent={
          <Text style={styles.rodapeObs}>
            Itens por peso têm valor estimado — o total é ajustado pelo peso real
            na separação. Taxa de entrega combinada no WhatsApp.
          </Text>
        }
      />

      <View style={[styles.barra, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.barraLinha}>
          <Text style={styles.barraLabel}>Subtotal estimado</Text>
          <Text style={styles.barraValor}>{brl(subtotal)}</Text>
        </View>
        <Botao
          titulo="Finalizar pedido"
          onPress={() => router.push('/checkout')}
        />
      </View>
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
  heroTitulo: {
    color: colors.onPrimary,
    fontSize: font.sizeXl,
    fontWeight: font.weightBold,
    textAlign: 'center',
  },
  heroSub: { color: colors.onPrimary, opacity: 0.95, textAlign: 'center', fontSize: font.sizeSm, lineHeight: 20 },
  passo: {
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
  passoNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passoNumTexto: { color: colors.primaryDark, fontWeight: font.weightBold, fontSize: font.sizeXs },
  passoTexto: { flex: 1, fontSize: font.sizeSm, color: colors.text },
  obs: { fontSize: font.sizeXs, color: colors.textMuted, textAlign: 'center' },

  contador: { fontSize: font.sizeSm, color: colors.textMuted, marginBottom: spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    ...shadow.sm,
  },
  itemNome: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.text },
  itemPreco: { fontSize: font.sizeXs, color: colors.textMuted },
  itemBaixo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  itemTotal: { fontSize: font.sizeSm, fontWeight: font.weightBold, color: colors.primary },
  rodapeObs: {
    fontSize: font.sizeXs,
    color: colors.textSubtle,
    marginTop: spacing.md,
    lineHeight: 17,
  },
  barra: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.lg,
  },
  barraLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  barraLabel: { fontSize: font.sizeSm, color: colors.textMuted },
  barraValor: { fontSize: font.sizeLg, fontWeight: font.weightBold, color: colors.text },
});
