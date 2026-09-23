import { Linking, Platform } from 'react-native';

/** Abre a conversa no WhatsApp; cai no navegador se o app não estiver instalado. */
export async function abrirWhatsApp(telefone: string, mensagem?: string) {
  const num = telefone.replace(/\D/g, '');
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : '';
  const appUrl = `whatsapp://send?phone=${num}${mensagem ? `&text=${encodeURIComponent(mensagem)}` : ''}`;
  const webUrl = `https://wa.me/${num}${texto}`;
  try {
    const podeApp = await Linking.canOpenURL(appUrl);
    await Linking.openURL(podeApp ? appUrl : webUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}

/** Abre o discador com o número. */
export async function ligar(telefone: string) {
  const num = telefone.replace(/\D/g, '');
  const url = Platform.select({ ios: `telprompt:${num}`, default: `tel:${num}` })!;
  try {
    await Linking.openURL(url);
  } catch {
    // sem discador disponível
  }
}

/** Formata "556635662298" -> "(66) 3566-2298" (assume Brasil, fixo ou celular). */
export function formatarTelefone(tel: string): string {
  const d = tel.replace(/\D/g, '').replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tel;
}
