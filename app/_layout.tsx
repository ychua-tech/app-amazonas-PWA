import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registrarDispositivo } from '../src/api/devices';
import { AvisoModal } from '../src/components/AvisoModal';
import { InstalarAppBanner } from '../src/components/InstalarAppBanner';
import { CarrinhoProvider } from '../src/context/CarrinhoContext';
import { CatalogoProvider } from '../src/context/CatalogoContext';
import { ClubeProvider, useClube } from '../src/context/ClubeContext';
import { PedidosProvider } from '../src/context/PedidosContext';
import { useAviso } from '../src/hooks/useAviso';
import { registrarParaPush } from '../src/lib/notifications';
import { colors } from '../src/theme';

// mantém a tela de abertura (logo) enquanto o app carrega
SplashScreen.preventAutoHideAsync().catch(() => {});
// rede de segurança: nunca deixa a splash travada
setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 4000);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CatalogoProvider>
        <ClubeProvider>
          <CarrinhoProvider>
            <PedidosProvider>
              <Conteudo />
            </PedidosProvider>
          </CarrinhoProvider>
        </ClubeProvider>
      </CatalogoProvider>
    </SafeAreaProvider>
  );
}

function Conteudo() {
  const router = useRouter();
  const { carregando } = useClube();
  const { aviso, visivel, fechar } = useAviso();

  useEffect(() => {
    if (!carregando) SplashScreen.hideAsync().catch(() => {});
  }, [carregando]);

  useEffect(() => {
    // PWA: registra o service worker (cache de assets + funcionamento offline básico)
    if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    const registrar = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    };
    window.addEventListener('load', registrar);
    return () => window.removeEventListener('load', registrar);
  }, []);

  useEffect(() => {
    // pede permissão de push e manda o token pro backend
    registrarParaPush()
      .then((token) => {
        if (token) return registrarDispositivo(token);
      })
      .catch(() => {});

    // toque na notificação → abre a oferta ou o pedido relacionado
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data ?? {};
      if (typeof data.pedidoId === 'string') router.push(`/pedido/${data.pedidoId}`);
      else if (typeof data.ofertaId === 'string') router.push(`/oferta/${data.ofertaId}`);
    });
    return () => sub.remove();
  }, [router]);

  return (
    <>
      <StatusBar style="light" />
      <InstalarAppBanner />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.onPrimary,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="oferta/[id]" options={{ title: 'Oferta', presentation: 'card' }} />
        <Stack.Screen name="produto/[id]" options={{ title: 'Produto', presentation: 'card' }} />
        <Stack.Screen name="checkout" options={{ presentation: 'card' }} />
        <Stack.Screen name="pedido/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="meus-pedidos" options={{ presentation: 'card' }} />
        <Stack.Screen name="encarte" options={{ presentation: 'card' }} />
        <Stack.Screen name="nota-scanner" options={{ presentation: 'card' }} />
      </Stack>
      {aviso && <AvisoModal aviso={aviso} visivel={visivel} onFechar={fechar} />}
    </>
  );
}
