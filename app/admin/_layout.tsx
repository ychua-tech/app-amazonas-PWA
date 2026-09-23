import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack, useSegments } from 'expo-router';
import { AdminProvider, useAdmin } from '../../src/context/AdminContext';
import { colors } from '../../src/theme';

export default function AdminLayout() {
  return (
    <AdminProvider>
      <Guard />
    </AdminProvider>
  );
}

function Guard() {
  const { carregando, token, bloqueado } = useAdmin();
  const segments = useSegments() as string[];
  const rota = segments[1] ?? 'index'; // ['admin', <rota>]

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!token && rota !== 'login') return <Redirect href="/admin/login" />;
  if (token && bloqueado && rota !== 'desbloquear') return <Redirect href="/admin/desbloquear" />;
  if (token && !bloqueado && (rota === 'login' || rota === 'desbloquear')) {
    return <Redirect href="/admin" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.onPrimary,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Admin' }} />
      <Stack.Screen name="desbloquear" options={{ title: 'Admin', headerBackVisible: false }} />
      <Stack.Screen name="index" options={{ title: 'Administração' }} />
      <Stack.Screen name="pin" options={{ title: 'PIN de acesso' }} />
      <Stack.Screen name="precos" options={{ title: 'Preços' }} />
      <Stack.Screen name="ofertas" options={{ title: 'Ofertas da semana' }} />
      <Stack.Screen name="avisos" options={{ title: 'Aviso de abertura' }} />
      <Stack.Screen name="pedidos" options={{ title: 'Pedidos' }} />
    </Stack>
  );
}
