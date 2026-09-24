# Amazonas — API + Painel de ofertas

Servidor Node/Express que:

- serve as **ofertas** para o app (`GET /ofertas`);
- guarda os **push tokens** dos aparelhos (`POST /devices`);
- oferece um **painel web** (`/`) para a equipe do supermercado publicar
  ofertas, ajustar **preços do catálogo**, o aviso de abertura, os pedidos e
  disparar **ofertas relâmpago** (push via Expo).

Também serve o **catálogo do mercado** (`GET /produtos`) e deixa a dona editar
preços pelas rotas `/admin/produtos*` — tanto pela área de admin dentro do app
quanto pelo card **"Preços do catálogo"** no painel web.

Persistência: arquivo `db.json`. Na primeira execução ele é criado a partir de
`db.seed.json` (gerado por `npm run sync:seed` na raiz do projeto — ofertas +
catálogo + aviso). Simples de propósito — dá para trocar por um banco de verdade
depois sem mudar os endpoints.

## Rodar local

```bash
npm run sync:seed         # na raiz: gera server/db.seed.json (ofertas + catálogo + aviso)
cd server
npm install
cp .env.example .env      # edite o ADMIN_TOKEN
npm run dev               # cria db.json a partir de db.seed.json na 1ª execução
```

- Painel: http://localhost:3333
- API: http://localhost:3333/ofertas

## Ligar o app no servidor

Na raiz do projeto (não em `server/`), crie um `.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.0.10:3333
```

Use o **IP da máquina na rede** (não `localhost`) para o celular enxergar.
Reinicie o `npx expo start`. Sem esse `.env`, o app roda com dados de exemplo.

## Endpoints

| Método | Rota | Auth | Uso |
|---|---|---|---|
| GET | `/ofertas` | — | lista ofertas ativas (app) |
| GET | `/ofertas/:id` | — | uma oferta |
| GET | `/produtos` | — | catálogo completo do mercado (app) |
| GET | `/produtos/:id` | — | um produto |
| POST | `/devices` | — | `{ token, plataforma }` — registra aparelho |
| GET | `/admin/ping` | token | valida o token (login do app) |
| GET | `/admin/produtos` | token | lista o catálogo |
| POST | `/admin/produtos` | token | cria/edita um produto (upsert por `id`) |
| PATCH | `/admin/produtos/:id` | token | edição parcial (`preco`, `nome`, `categoria`, ...) |
| POST | `/admin/produtos/precos` | token | `[{ id, preco }]` — preços em lote |
| DELETE | `/admin/produtos/:id` | token | remove produto |
| GET | `/admin/ofertas` | token | lista tudo (painel) |
| POST | `/admin/ofertas` | token | cria/edita oferta |
| DELETE | `/admin/ofertas/:id` | token | remove oferta |
| POST | `/admin/relampago` | token | `{ ofertaId?, titulo, mensagem }` — dispara push |
| POST | `/pedidos` | — | app cria pedido; retorna `{ id, codigo, status }` |
| GET | `/pedidos/:id` | — | status + histórico de um pedido (app acompanha) |
| GET | `/admin/pedidos` | token | lista os pedidos (painel) |
| POST | `/admin/pedidos/:id/status` | token | `{ status, motivo? }` — muda status e notifica o cliente |

Auth: header `x-admin-token: <ADMIN_TOKEN>` (ou `?token=` na URL do painel).
Status do pedido: `aguardando → aceito → separando → saiu_entrega → entregue` (ou `cancelado`).

## Publicar (sugestão)

Qualquer PaaS Node serve: Render, Railway, Fly.io. Defina `ADMIN_TOKEN` e
`PORT` nas variáveis de ambiente. Para produção real, troque `db.json` por
Postgres e adicione HTTPS (o PaaS já dá).
