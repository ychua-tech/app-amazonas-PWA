import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Armazenamento seguro para segredos do admin (token e PIN).
 * iOS/Android: expo-secure-store (Keychain / Keystore).
 * Web (só em desenvolvimento): cai para AsyncStorage — sem criptografia.
 */
const naWeb = Platform.OS === 'web';

export async function guardar(chave: string, valor: string): Promise<void> {
  if (naWeb) return AsyncStorage.setItem(chave, valor);
  return SecureStore.setItemAsync(chave, valor);
}

export async function ler(chave: string): Promise<string | null> {
  try {
    if (naWeb) return await AsyncStorage.getItem(chave);
    return await SecureStore.getItemAsync(chave);
  } catch {
    return null;
  }
}

export async function apagar(chave: string): Promise<void> {
  if (naWeb) return AsyncStorage.removeItem(chave);
  return SecureStore.deleteItemAsync(chave);
}
