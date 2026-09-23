/**
 * Gera ícone, splash, favicon e o logo de cabeçalho a partir da marca oficial
 * (assets-source/logo-app.png). Sem esse arquivo, cai no coração desenhado.
 * Rode:  npm run gen:assets
 */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'assets');
const SRC = join(__dirname, '..', 'assets-source');
const PUBLIC_ICONS = join(__dirname, '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });
mkdirSync(PUBLIC_ICONS, { recursive: true });

const LARANJA = '#F26522';
const BRANCO = '#FFFFFF';
const LOGO_APP = join(SRC, 'logo-app.png');

// coração clássico centralizado num canvas 100x100 (fallback / monocromático)
const heart = (fill, scale = 0.62) => {
  const s = scale;
  const tx = (100 - 100 * s) / 2;
  const ty = (100 - 92.5 * s) / 2;
  return `<g transform="translate(${tx} ${ty}) scale(${s * 3.125})">
    <path fill="${fill}" d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4
      c0,9.4,9.5,11.9,16,21.2c6.1-9.3,16-12,16-21.2C32,3.8,28.2,0,23.6,0z"/>
  </g>`;
};

// monocromático (tema do Android) — sempre o coração
await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 100 100">${heart('#000000', 0.42)}</svg>`,
  ),
)
  .resize(1024, 1024)
  .png()
  .toFile(join(OUT, 'android-icon-monochrome.png'));

// fundo sólido do adaptive icon
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: LARANJA } })
  .png()
  .toFile(join(OUT, 'android-icon-background.png'));

if (existsSync(LOGO_APP)) {
  // recorta a moldura branca em volta da marca
  const marca = await sharp(LOGO_APP).trim({ threshold: 5 }).png().toBuffer();
  const fit = async (buf, size) =>
    sharp(buf).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

  // ícone iOS: marca preenchendo o quadro sobre laranja (tapa os cantos)
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: LARANJA } })
    .composite([{ input: await fit(marca, 1024), gravity: 'center' }])
    .flatten({ background: LARANJA })
    .png()
    .toFile(join(OUT, 'icon.png'));

  // foreground do Android: marca menor (zona segura), fundo transparente
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await fit(marca, 720), gravity: 'center' }])
    .png()
    .toFile(join(OUT, 'android-icon-foreground.png'));

  // splash: marca centralizada em canvas transparente
  await sharp({ create: { width: 1600, height: 1600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await fit(marca, 1000), gravity: 'center' }])
    .png()
    .toFile(join(OUT, 'splash-icon.png'));

  // favicon
  await sharp({ create: { width: 48, height: 48, channels: 4, background: LARANJA } })
    .composite([{ input: await fit(marca, 48), gravity: 'center' }])
    .png()
    .toFile(join(OUT, 'favicon.png'));

  // logo para usar dentro do app (cabeçalhos)
  await sharp(marca).resize({ height: 320 }).png().toFile(join(OUT, 'logo-header.png'));

  // --- ícones do PWA (public/icons) ---
  // "any": mesma marca preenchendo o quadro sobre laranja do ícone do app
  const pwaAny = await sharp({ create: { width: 512, height: 512, channels: 4, background: LARANJA } })
    .composite([{ input: await fit(marca, 512), gravity: 'center' }])
    .flatten({ background: LARANJA })
    .png()
    .toBuffer();
  await sharp(pwaAny).toFile(join(PUBLIC_ICONS, 'icon-512.png'));
  await sharp(pwaAny).resize(192, 192).png().toFile(join(PUBLIC_ICONS, 'icon-192.png'));
  await sharp(pwaAny).resize(180, 180).png().toFile(join(PUBLIC_ICONS, 'apple-touch-icon.png'));
  // "maskable": marca na zona segura (mesma proporção do foreground do Android)
  // pra não ser cortada quando o SO aplicar a máscara (círculo, squircle etc.)
  await sharp({ create: { width: 512, height: 512, channels: 4, background: LARANJA } })
    .composite([{ input: await fit(marca, 360), gravity: 'center' }])
    .flatten({ background: LARANJA })
    .png()
    .toFile(join(PUBLIC_ICONS, 'icon-maskable-512.png'));

  console.log('assets/ e public/icons/ atualizados a partir de logo-app.png');
} else {
  // fallback: coração desenhado
  const svg = (inner, size, bg) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">${bg ? `<rect width="100" height="100" fill="${bg}"/>` : ''}${inner}</svg>`;
  await sharp(Buffer.from(svg(heart(BRANCO, 0.58), 1024, LARANJA))).resize(1024, 1024).png().toFile(join(OUT, 'icon.png'));
  await sharp(Buffer.from(svg(heart(BRANCO, 0.42), 1024))).resize(1024, 1024).png().toFile(join(OUT, 'android-icon-foreground.png'));
  await sharp(Buffer.from(svg(heart(BRANCO, 0.5), 1024))).resize(1024, 1024).png().toFile(join(OUT, 'splash-icon.png'));
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="${LARANJA}"/>${heart(BRANCO, 0.6)}</svg>`)).resize(48, 48).png().toFile(join(OUT, 'favicon.png'));

  // ícones do PWA (public/icons) — mesmo coração de fallback
  const pwaAnyFallback = Buffer.from(svg(heart(BRANCO, 0.58), 512, LARANJA));
  await sharp(pwaAnyFallback).toFile(join(PUBLIC_ICONS, 'icon-512.png'));
  await sharp(pwaAnyFallback).resize(192, 192).png().toFile(join(PUBLIC_ICONS, 'icon-192.png'));
  await sharp(pwaAnyFallback).resize(180, 180).png().toFile(join(PUBLIC_ICONS, 'apple-touch-icon.png'));
  await sharp(Buffer.from(svg(heart(BRANCO, 0.42), 512, LARANJA))).toFile(join(PUBLIC_ICONS, 'icon-maskable-512.png'));

  console.log('assets/ e public/icons/ atualizados (fallback coração — sem logo-app.png)');
}
