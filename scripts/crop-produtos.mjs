/**
 * Recorta a foto de cada produto a partir das páginas do encarte
 * (assets-source/encarte/pagina-N.jpeg, 900x1600) e salva em
 * assets/produtos/<id>.jpg — usado como imagem do produto nos cards.
 *
 * Provisório: são recortes de montagem, alguns pegam texto/tarja.
 * Ideal é trocar por fotos com fundo branco pelo painel admin.
 *
 * Rode: node scripts/crop-produtos.mjs   (gera também _contato.jpg p/ conferência)
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = join(__dirname, '..');
const SRC = join(raiz, 'assets-source', 'encarte');
const OUT = join(raiz, 'assets', 'produtos');
mkdirSync(OUT, { recursive: true });

// [id, pagina, left, top, width, height] em coordenadas 900x1600
const CROPS = [
  // ---- Página 2: Limpeza / Higiene ----
  ['of-101', 2, 16, 702, 255, 230], // OMO
  ['of-102', 2, 320, 680, 265, 250], // Downy
  ['of-103', 2, 605, 655, 285, 278], // Pinho Bril
  ['of-104', 2, 20, 1155, 205, 172], // Limpa Alumínio
  ['of-105', 2, 250, 1198, 190, 158], // Papel Higiênico Mili
  ['of-106', 2, 455, 1165, 215, 172], // Creme Skala
  ['of-107', 2, 690, 1170, 200, 160], // Colgate

  // ---- Página 1: Mercearia / Pet ----
  ['of-108', 1, 30, 562, 250, 190], // Arroz Manosso
  ['of-109', 1, 320, 572, 260, 190], // Feijão Carioca
  ['of-110', 1, 600, 565, 285, 210], // Óleo Concórdia
  ['of-111', 1, 22, 930, 200, 150], // Café Tanserra
  ['of-112', 1, 232, 935, 215, 160], // Rosca Adoralle
  ['of-113', 1, 452, 924, 215, 165], // Macarrão Galo
  ['of-114', 1, 672, 924, 220, 165], // Extrato Fugini
  ['of-115', 1, 15, 1198, 218, 170], // Papel Toalha Mili
  ['of-116', 1, 232, 1200, 215, 168], // Ração Maikao
  ['of-117', 1, 452, 1203, 215, 163], // Sobrecoxa Seara
  ['of-118', 1, 672, 1203, 222, 163], // Coxa Seara

  // ---- Página 4: Açougue ----
  ['of-119', 4, 35, 505, 405, 235], // Acém c/ osso (destaque)
  ['of-120', 4, 15, 760, 215, 125], // Corte Americano
  ['of-121', 4, 455, 755, 220, 135], // Costela Minga
  ['of-122', 4, 12, 905, 220, 140], // Costela Ripa
  ['of-123', 4, 455, 900, 225, 150], // Coxão Mole
  ['of-124', 4, 15, 1060, 215, 135], // Ponta de Peito
  ['of-125', 4, 455, 1055, 225, 145], // Bisteca Suína
  ['of-126', 4, 28, 1225, 415, 245], // Picadinho Suíno (destaque)

  // ---- Página 3: Hortifruti ----
  ['of-127', 3, 38, 510, 385, 225], // Cebola Roxa (destaque)
  ['of-128', 3, 15, 760, 205, 130], // Batata Doce
  ['of-129', 3, 455, 755, 215, 140], // Morango
  ['of-130', 3, 15, 908, 205, 140], // Pera
  ['of-131', 3, 455, 905, 215, 145], // Melão Sapo
  ['of-132', 3, 12, 1060, 210, 145], // Mamão Papaya
  ['of-133', 3, 455, 1058, 215, 145], // Mexerica
  ['of-134', 3, 30, 1230, 405, 235], // Banana Maçã (destaque)
];

const SIZE = 500;

async function main() {
  const paginas = {};
  for (const n of [1, 2, 3, 4]) {
    paginas[n] = sharp(join(SRC, `pagina-${n}.jpeg`));
  }

  const thumbs = [];
  for (const [id, pag, left, top, width, height] of CROPS) {
    const buf = await sharp(join(SRC, `pagina-${pag}.jpeg`))
      .extract({ left, top, width, height })
      .resize(SIZE, SIZE, { fit: 'contain', background: '#ffffff' })
      .jpeg({ quality: 86 })
      .toFile(join(OUT, `${id}.jpg`))
      .then(() => sharp(join(OUT, `${id}.jpg`)).resize(200, 200).toBuffer());
    thumbs.push({ id, buf });
  }
  void paginas;

  // contato: grade 6 col para conferir os recortes (só com --contato)
  if (!process.argv.includes('--contato')) {
    console.log(`${CROPS.length} recortes em assets/produtos/`);
    return;
  }
  const cols = 6;
  const rows = Math.ceil(thumbs.length / cols);
  const composites = thumbs.map((t, i) => ({
    input: t.buf,
    left: (i % cols) * 200,
    top: Math.floor(i / cols) * 200,
  }));
  await sharp({
    create: {
      width: cols * 200,
      height: rows * 200,
      channels: 3,
      background: '#eeeeee',
    },
  })
    .composite(composites)
    .jpeg({ quality: 80 })
    .toFile(join(OUT, '_contato.jpg'));

  console.log(`${CROPS.length} recortes em assets/produtos/ + _contato.jpg`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
