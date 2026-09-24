import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { Expo } from 'expo-server-sdk';
import { db } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3333;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'trocar-este-token';

// Regras da loja — espelham src/data/loja.ts (mudou lá, mude aqui).
const LOJA = {
  /** entrega grátis quando os itens somam isto ou mais (R$); abaixo cobra a taxa */
  entregaGratisAPartirDe: 100,
  taxaEntrega: 10,
  /** bônus do Clube: só no aniversário do sócio, em compras a partir de compraMinima */
  bonusAniversario: { valor: 10, compraMinima: 200 },
  /** Pix pedido ao cliente quando a loja confirma um pedido pago por Pix */
  pix: {
    tipoChave: process.env.PIX_TIPO || 'CNPJ',
    chave: process.env.PIX_CHAVE || '36901718000104',
    favorecido: 'Supermercado Amazonas',
  },
};

const expo = new Expo();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ---------- auth simples do painel ----------
function exigirAdmin(req, res, next) {
  if (req.get('x-admin-token') !== ADMIN_TOKEN) {
    return res.status(401).json({ erro: 'Token de admin inválido' });
  }
  next();
}

async function enviarPush(token, title, body, data) {
  if (!token || !Expo.isExpoPushToken(token)) return;
  try {
    await expo.sendPushNotificationsAsync([
      { to: token, sound: 'default', title, body, data, channelId: 'ofertas', priority: 'high' },
    ]);
  } catch (e) {
    console.error('push falhou:', e.message);
  }
}

// status do pedido, em ordem
const STATUS_PEDIDO = [
  'aguardando', // enviado pelo WhatsApp, mercado ainda não confirmou
  'aceito', // mercado confirmou
  'separando', // montando o pedido
  'saiu_entrega', // a caminho
  'entregue',
];
const PUSH_STATUS = {
  aceito: ['Pedido confirmado ✅', 'Já começamos a preparar o seu pedido.'],
  separando: ['Separando seus itens 🛒', 'Seu pedido está sendo montado agora.'],
  saiu_entrega: ['Saiu para entrega 🛵', 'Seu pedido está a caminho!'],
  entregue: ['Pedido entregue 🎉', 'Obrigado por comprar no Supermercado Amazonas!'],
  cancelado: ['Pedido cancelado', 'Fale com a gente pelo WhatsApp para entender o que houve.'],
};

const round2 = (n) => Math.round(n * 100) / 100;
const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** CNPJ/CPF ganham pontuação na tela; outras chaves (celular, e-mail, aleatória) vão como estão. */
function formatarChavePix(tipo, chave) {
  const d = String(chave).replace(/\D/g, '');
  if (tipo === 'CNPJ' && d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (tipo === 'CPF' && d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return String(chave);
}

/** Pedido pago por Pix? (pedidos antigos não têm pagamentoId — cai no texto) */
const ehPix = (p) => p.pagamentoId === 'pix' || (!p.pagamentoId && /pix/i.test(p.pagamento || ''));

/** O que o cliente/painel enxergam: sem o token de push e, se for Pix, com os dados pra pagar. */
function publico({ pushToken, ...p }) {
  if (!ehPix(p)) return p;
  const { tipoChave, chave, favorecido } = LOJA.pix;
  return {
    ...p,
    pix: { tipoChave, chave, chaveFormatada: formatarChavePix(tipoChave, chave), favorecido, valor: p.total },
  };
}

/** Número > 0 arredondado a centavos, ou null se inválido. */
function precoValido(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** Aplica o preço a um produto e registra no histórico. Retorna o produto. */
function aplicarPreco(produto, { preco }) {
  const agora = new Date().toISOString();
  const novoPreco = precoValido(preco);
  if (novoPreco != null && novoPreco !== produto.preco) {
    produto.historicoPreco = [
      { preco: produto.preco, em: produto.atualizadoEm || agora },
      ...(produto.historicoPreco ?? []),
    ].slice(0, 10);
    produto.preco = novoPreco;
    produto.atualizadoEm = agora;
  }
  return produto;
}

// ---------- API pública (consumida pelo app) ----------
app.get('/ofertas', (_req, res) => {
  const agora = Date.now();
  const ativas = db.data.ofertas.filter((o) => {
    const fim = o.relampago && o.relampagoFim ? o.relampagoFim : o.validade;
    return new Date(fim).getTime() > agora;
  });
  res.json(ativas);
});

app.get('/ofertas/:id', (req, res) => {
  const oferta = db.data.ofertas.find((o) => o.id === req.params.id);
  if (!oferta) return res.status(404).json({ erro: 'Oferta não encontrada' });
  res.json(oferta);
});

app.get('/produtos', (_req, res) => {
  res.json(db.data.produtos);
});

app.get('/produtos/:id', (req, res) => {
  const p = db.data.produtos.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json(p);
});

app.get('/aviso', (_req, res) => {
  const a = db.data.aviso;
  const valido =
    a && a.ativo && (!a.expira || new Date(a.expira).getTime() > Date.now());
  res.json(valido ? a : null);
});

app.post('/devices', (req, res) => {
  const { token, plataforma } = req.body ?? {};
  if (!token || !Expo.isExpoPushToken(token)) {
    return res.status(400).json({ erro: 'Push token inválido' });
  }
  const existente = db.data.dispositivos.find((d) => d.token === token);
  if (!existente) {
    db.data.dispositivos.push({
      token,
      plataforma: plataforma ?? 'expo',
      criadoEm: new Date().toISOString(),
    });
    db.salvar();
  }
  res.json({ ok: true, total: db.data.dispositivos.length });
});

// ---------- Pedidos (app) ----------
app.post('/pedidos', (req, res) => {
  const b = req.body ?? {};
  if (!Array.isArray(b.itens) || b.itens.length === 0 || !b.cliente?.nome) {
    return res.status(400).json({ erro: 'itens e cliente.nome são obrigatórios' });
  }
  const agora = new Date().toISOString();
  const subtotal = round2(Number(b.subtotal) || 0);
  const cashbackUsado = round2(Number(b.cashbackUsado) || 0);
  // a taxa é decidida aqui (não confia no valor que veio do app)
  const taxaEntrega = subtotal >= LOJA.entregaGratisAPartirDe ? 0 : LOJA.taxaEntrega;
  // o bônus só vale no valor combinado e em compra a partir do mínimo; o dia do aniversário é
  // conferido pela loja (o cadastro do Clube é local no aparelho do cliente)
  const bonusAniversario =
    Number(b.bonusAniversario) === LOJA.bonusAniversario.valor && subtotal >= LOJA.bonusAniversario.compraMinima
      ? LOJA.bonusAniversario.valor
      : 0;
  const pedido = {
    id: randomUUID(),
    codigo: 'AMZ-' + Math.floor(1000 + Math.random() * 9000),
    criadoEm: agora,
    status: 'aguardando',
    historico: [{ status: 'aguardando', em: agora }],
    cliente: b.cliente,
    pagamento: b.pagamento ?? null,
    pagamentoId: b.pagamentoId ?? null,
    trocoPara: b.trocoPara ?? null,
    observacao: b.observacao ?? null,
    itens: b.itens,
    subtotal,
    taxaEntrega,
    cashbackUsado,
    bonusAniversario,
    total: Math.max(0, round2(subtotal - cashbackUsado - bonusAniversario + taxaEntrega)),
    pushToken: b.pushToken ?? null,
  };
  db.data.pedidos.unshift(pedido);
  db.salvar();
  res.json({ id: pedido.id, codigo: pedido.codigo, status: pedido.status });
});

app.get('/pedidos/:id', (req, res) => {
  const p = db.data.pedidos.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ erro: 'Pedido não encontrado' });
  res.json(publico(p));
});

// ---------- API do painel admin ----------

/** Valida o token — usado pela tela de login do app. */
app.get('/admin/ping', exigirAdmin, (_req, res) => res.json({ ok: true }));

const CATEGORIAS = [
  'Hortifruti', 'Açougue', 'Padaria', 'Frios e Laticínios', 'Mercearia',
  'Bebidas', 'Limpeza', 'Higiene', 'Pet',
];
const MODOS_VENDA = ['unidade', 'peso', 'unidade_ou_peso'];

app.get('/admin/produtos', exigirAdmin, (_req, res) => {
  res.json(db.data.produtos);
});

/** Cria ou substitui um produto inteiro (upsert por id). */
app.post('/admin/produtos', exigirAdmin, (req, res) => {
  const b = req.body ?? {};
  const preco = precoValido(b.preco);
  if (!b.nome || preco == null) {
    return res.status(400).json({ erro: 'nome e preco (> 0) são obrigatórios' });
  }
  if (b.categoria && !CATEGORIAS.includes(b.categoria)) {
    return res.status(400).json({ erro: 'categoria inválida' });
  }
  const id =
    b.id ||
    `pr-${randomUUID().slice(0, 8)}-${String(b.nome).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 24)}`;
  const agora = new Date().toISOString();
  const produto = {
    id,
    nome: String(b.nome).trim(),
    categoria: b.categoria || 'Mercearia',
    unidade: b.unidade || 'un',
    preco,
    atualizadoEm: agora,
    historicoPreco: [],
  };
  if (b.marca) produto.marca = String(b.marca).trim();
  if (b.modoVenda && MODOS_VENDA.includes(b.modoVenda)) produto.modoVenda = b.modoVenda;

  const i = db.data.produtos.findIndex((p) => p.id === id);
  if (i >= 0) produto.historicoPreco = db.data.produtos[i].historicoPreco ?? [];
  if (i >= 0) db.data.produtos[i] = produto;
  else db.data.produtos.push(produto);
  db.salvar();
  res.json(produto);
});

/** Edição parcial de um produto (preço, dados básicos). */
app.patch('/admin/produtos/:id', exigirAdmin, (req, res) => {
  const produto = db.data.produtos.find((p) => p.id === req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
  const b = req.body ?? {};

  if ('preco' in b && precoValido(b.preco) == null) {
    return res.status(400).json({ erro: 'preco inválido (precisa ser > 0)' });
  }
  if (b.categoria !== undefined && !CATEGORIAS.includes(b.categoria)) {
    return res.status(400).json({ erro: 'categoria inválida' });
  }

  aplicarPreco(produto, b);
  if (typeof b.nome === 'string' && b.nome.trim()) produto.nome = b.nome.trim();
  if (typeof b.unidade === 'string' && b.unidade.trim()) produto.unidade = b.unidade.trim();
  if (b.categoria !== undefined) produto.categoria = b.categoria;
  if (b.marca !== undefined) {
    if (b.marca) produto.marca = String(b.marca).trim();
    else delete produto.marca;
  }
  if (b.modoVenda !== undefined && MODOS_VENDA.includes(b.modoVenda)) {
    produto.modoVenda = b.modoVenda;
  }
  db.salvar();
  res.json(produto);
});

/** Atualização de preços em lote — [{ id, preco }]. */
app.post('/admin/produtos/precos', exigirAdmin, (req, res) => {
  const itens = Array.isArray(req.body) ? req.body : req.body?.itens;
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'envie uma lista [{ id, preco }]' });
  }
  const atualizados = [];
  const ignorados = [];
  for (const item of itens) {
    const produto = db.data.produtos.find((p) => p.id === item?.id);
    if (!produto) { ignorados.push(item?.id ?? null); continue; }
    if ('preco' in item && precoValido(item.preco) == null) { ignorados.push(item.id); continue; }
    aplicarPreco(produto, item);
    atualizados.push(produto.id);
  }
  db.salvar();
  res.json({ ok: true, atualizados, ignorados });
});

app.delete('/admin/produtos/:id', exigirAdmin, (req, res) => {
  const antes = db.data.produtos.length;
  db.data.produtos = db.data.produtos.filter((p) => p.id !== req.params.id);
  db.salvar();
  res.json({ removidos: antes - db.data.produtos.length });
});

app.get('/admin/pedidos', exigirAdmin, (_req, res) => {
  res.json(db.data.pedidos.map(publico));
});

app.post('/admin/pedidos/:id/status', exigirAdmin, async (req, res) => {
  const p = db.data.pedidos.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ erro: 'Pedido não encontrado' });
  const novo = req.body?.status;
  if (novo !== 'cancelado' && !STATUS_PEDIDO.includes(novo)) {
    return res.status(400).json({ erro: 'status inválido' });
  }
  p.status = novo;
  p.historico.push({ status: novo, em: new Date().toISOString() });
  if (novo === 'cancelado' && req.body.motivo) p.canceladoMotivo = req.body.motivo;
  db.salvar();

  const t =
    novo === 'aceito' && ehPix(p)
      ? [
          'Pedido confirmado ✅',
          `Faça o Pix de ${brl(p.total)} e envie o comprovante no WhatsApp pra gente começar a separar.`,
        ]
      : PUSH_STATUS[novo];
  if (t) await enviarPush(p.pushToken, t[0], t[1], { tipo: 'pedido', pedidoId: p.id });

  res.json({ ok: true, status: p.status });
});

app.get('/admin/ofertas', exigirAdmin, (_req, res) => {
  res.json(db.data.ofertas);
});

app.post('/admin/ofertas', exigirAdmin, (req, res) => {
  const o = req.body ?? {};
  if (!o.nome || o.precoNormal == null || o.precoOferta == null) {
    return res.status(400).json({ erro: 'nome, precoNormal e precoOferta são obrigatórios' });
  }
  const oferta = {
    id: o.id || `of-${randomUUID().slice(0, 8)}`,
    nome: o.nome,
    descricao: o.descricao ?? '',
    categoria: o.categoria ?? 'Mercearia',
    precoNormal: Number(o.precoNormal),
    precoOferta: Number(o.precoOferta),
    unidade: o.unidade ?? 'un',
    imagem: o.imagem || '', // vazio = o app usa a foto empacotada (por id) ou o placeholder de categoria
    validade: o.validade || new Date(Date.now() + 7 * 864e5).toISOString(),
    relampago: !!o.relampago,
    relampagoFim: o.relampago ? o.relampagoFim ?? new Date(Date.now() + 6 * 36e5).toISOString() : undefined,
  };
  const i = db.data.ofertas.findIndex((x) => x.id === oferta.id);
  if (i >= 0) db.data.ofertas[i] = oferta;
  else db.data.ofertas.push(oferta);
  db.salvar();
  res.json(oferta);
});

app.get('/admin/aviso', exigirAdmin, (_req, res) => res.json(db.data.aviso));

app.post('/admin/aviso', exigirAdmin, (req, res) => {
  const a = req.body ?? {};
  db.data.aviso = a.titulo
    ? {
        id: a.id || 'aviso',
        ativo: a.ativo !== false,
        titulo: a.titulo,
        subtitulo: a.subtitulo ?? '',
        linhas: Array.isArray(a.linhas)
          ? a.linhas
          : String(a.linhas ?? '')
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
        destaque: a.destaque ?? '',
        rodape: a.rodape ?? '',
        telefone: a.telefone ?? '',
        expira: a.expira || undefined,
      }
    : null;
  db.salvar();
  res.json(db.data.aviso);
});

app.delete('/admin/ofertas/:id', exigirAdmin, (req, res) => {
  const antes = db.data.ofertas.length;
  db.data.ofertas = db.data.ofertas.filter((o) => o.id !== req.params.id);
  db.salvar();
  res.json({ removidas: antes - db.data.ofertas.length });
});

/** Dispara push de oferta relâmpago para todos os aparelhos cadastrados. */
app.post('/admin/relampago', exigirAdmin, async (req, res) => {
  const { ofertaId, titulo, mensagem } = req.body ?? {};
  if (!titulo || !mensagem) {
    return res.status(400).json({ erro: 'titulo e mensagem são obrigatórios' });
  }

  // marca a oferta como relâmpago (se veio um id)
  if (ofertaId) {
    const oferta = db.data.ofertas.find((o) => o.id === ofertaId);
    if (oferta) {
      oferta.relampago = true;
      oferta.relampagoFim =
        req.body.relampagoFim ?? new Date(Date.now() + 6 * 36e5).toISOString();
      db.salvar();
    }
  }

  const mensagens = db.data.dispositivos
    .filter((d) => Expo.isExpoPushToken(d.token))
    .map((d) => ({
      to: d.token,
      sound: 'default',
      title: `⚡ ${titulo}`,
      body: mensagem,
      data: { tipo: 'relampago', ofertaId: ofertaId ?? null },
      channelId: 'ofertas',
      priority: 'high',
    }));

  let enviadas = 0;
  for (const bloco of expo.chunkPushNotifications(mensagens)) {
    try {
      await expo.sendPushNotificationsAsync(bloco);
      enviadas += bloco.length;
    } catch (e) {
      console.error('Falha ao enviar bloco de push:', e.message);
    }
  }
  res.json({ ok: true, enviadas, dispositivos: db.data.dispositivos.length });
});

app.get('/', (_req, res) => res.sendFile(join(__dirname, 'public', 'admin.html')));

app.listen(PORT, () => {
  console.log(`\n  Amazonas API + painel em http://localhost:${PORT}`);
  console.log(`  Admin token: ${ADMIN_TOKEN}\n`);
});
