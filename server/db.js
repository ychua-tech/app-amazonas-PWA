import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, 'db.json');
const SEED_FILE = join(__dirname, 'db.seed.json');

const SEED = {
  ofertas: [],
  produtos: [], // catálogo do mercado — { id, nome, categoria, unidade, preco, atualizadoEm, historicoPreco }
  dispositivos: [], // { token, plataforma, criadoEm }
  aviso: null, // Aviso de abertura do app (ver POST /admin/aviso)
  pedidos: [], // pedidos feitos pelo app (ver POST /pedidos)
};

/** Estado inicial: db.seed.json (gerado por `npm run sync:seed`) e, se faltar, o SEED vazio. */
function estadoInicial() {
  if (existsSync(SEED_FILE)) {
    try {
      return { ...structuredClone(SEED), ...JSON.parse(readFileSync(SEED_FILE, 'utf8')) };
    } catch {
      // seed corrompido — segue com o SEED vazio
    }
  }
  return structuredClone(SEED);
}

function carregar() {
  if (!existsSync(FILE)) {
    const inicial = estadoInicial();
    writeFileSync(FILE, JSON.stringify(inicial, null, 2));
    return inicial;
  }
  try {
    return { ...structuredClone(SEED), ...JSON.parse(readFileSync(FILE, 'utf8')) };
  } catch {
    return estadoInicial();
  }
}

let dados = carregar();

export const db = {
  get data() {
    return dados;
  },
  salvar() {
    writeFileSync(FILE, JSON.stringify(dados, null, 2));
  },
  recarregar() {
    dados = carregar();
  },
};
