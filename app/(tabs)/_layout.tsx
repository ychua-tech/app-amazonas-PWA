import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs, useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { Logo } from '../../src/components/Logo';
import { useCarrinho } from '../../src/context/CarrinhoContext';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  const { totalItens } = useCarrinho();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.onPrimary,
        headerTitleStyle: { fontWeight: '800' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => (
            <Pressable
              onLongPress={() => router.push('/admin')}
              delayLongPress={800}
              // acesso discreto à administração (pede token)
            >
              <Logo altura={38} />
            </Pressable>
          ),
          headerTitleAlign: 'center',
          tabBarLabel: 'Ofertas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mercado"
        options={{
          title: 'Mercado',
          tabBarLabel: 'Mercado',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="carrinho"
        options={{
          title: 'Meu Carrinho',
          tabBarLabel: 'Carrinho',
          tabBarBadge: totalItens > 0 ? totalItens : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: 11 },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
          headerRight: () => (
            <Link href="/meus-pedidos" asChild>
              <Pressable hitSlop={12} style={{ paddingHorizontal: 16 }}>
                <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 13 }}>
                  Meus pedidos
                </Text>
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="clube"
        options={{
          title: 'Clube Amazonas',
          tabBarLabel: 'Clube',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notificacoes"
        options={{
          title: 'Notificações',
          tabBarLabel: 'Avisos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
