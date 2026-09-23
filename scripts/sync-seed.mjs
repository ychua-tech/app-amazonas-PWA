/**
 * Gera server/db.seed.json a partir das sementes do app:
 *  - src/data/ofertas.seed.json  → ofertas de exemplo
 *  - src/data/produtos.seed.json → catálogo do mercado (~243 produtos)
 * O servidor usa esse arquivo como estado inicial do db.json.
 * Rode: node scripts/sync-seed.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = join(__dirname, '..');

const seed = JSON.parse(
  readFileSync(join(raiz, 'src', 'data', 'ofertas.seed.json'), 'utf8'),
);
const catalogo = JSON.parse(
  readFileSync(join(raiz, 'src', 'data', 'produtos.seed.json'), 'utf8'),
);

const emDias = (d) => {
  const dt = new Date();
  dt.setHours(23, 59, 0, 0);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
};
const emHoras = (h) => {
  const dt = new Date();
  dt.setHours(dt.getHours() + h, 0, 0, 0);
  return dt.toISOString();
};

const ofertas = seed.ofertas.map((o) => {
  const out = {
    id: o.id,
    nome: o.nome,
    descricao: o.descricao,
    categoria: o.categoria,
    precoNormal: o.precoNormal,
    precoOferta: o.precoOferta,
    unidade: o.unidade,
    imagem: '',
    validade: emDias(o.perecivel ? 3 : 6),
  };
  if (o.precoClube != null) out.precoClube = o.precoClube;
  if (o.relampago) {
    out.relampago = true;
    out.relampagoFim = emHoras(o.perecivel ? 5 : 8);
  }
  return out;
});

const produtos = (catalogo.produtos ?? []).map((p) => ({
  ...p,
  atualizadoEm: null,
  historicoPreco: [],
}));

const aviso = {
  id: 'horario-funcionamento',
  ativo: true,
  titulo: 'Horário de funcionamento',
  subtitulo: 'O preferido da família juinense está sempre pertinho de você',
  linhas: ['Segunda a sábado: 6h às 20h', 'Domingos: 6h às 12h'],
  rodape: 'Prefere receber em casa? Peça pelo televendas ou monte a lista aqui no app.',
  telefone: '556635662298',
};

writeFileSync(
  join(raiz, 'server', 'db.seed.json'),
  JSON.stringify({ ofertas, produtos, dispositivos: [], aviso, pedidos: [] }, null, 2),
);

console.log(
  `server/db.seed.json atualizado: ${ofertas.length} ofertas, ${produtos.length} produtos + aviso.`,
);
