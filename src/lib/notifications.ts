import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { colors } from '../theme/colors';

const CANAL = 'ofertas';
const TOKEN_KEY = '@amazonas/pushToken';

/** Último Expo push token conhecido deste aparelho (para anexar aos pedidos). */
export async function getPushTokenSalvo(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Como a notificação aparece com o app aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** Cria o canal do Android (ignorado no iOS). Idempotente. */
export async function prepararCanal() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Ofertas e novidades',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colors.primary,
    });
  }
}

/** Garante permissão de notificação. Retorna true se concedida. */
export async function garantirPermissao(): Promise<boolean> {
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  if (!atual.canAskAgain) return false;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.granted;
}

/**
 * Pede permissão e devolve o Expo push token do aparelho.
 * Esse token é o que o backend do supermercado guarda para disparar
 * as ofertas relâmpago.
 */
export async function registrarParaPush(): Promise<string | null> {
  await prepararCanal();

  if (!Device.isDevice) return null; // emulador não recebe push real
  if (!(await garantirPermissao())) return null;

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    AsyncStorage.setItem(TOKEN_KEY, token.data).catch(() => {});
    return token.data;
  } catch {
    return null;
  }
}
