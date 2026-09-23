# Supermercado Amazonas — App (iOS + Android)

App do Supermercado Amazonas, "o preferido da família juinense". Feito com
**Expo + expo-router + TypeScript**.

## Rodando o app

```bash
npm install
npx expo start
```

Abra no **Expo Go** (Android/iOS) lendo o QR Code, ou pressione `a` / `i` para
emulador.

> `.npmrc` já vem com `legacy-peer-deps=true` por causa de um conflito de peer
> deps do `react-dom` no SDK 57. Use sempre `npx expo install <pkg>` para
> adicionar libs.

### Ligar no servidor (opcional)

Sem configuração o app roda com **dados de exemplo**. Para consumir ofertas
reais, suba o servidor em [`server/`](server/README.md) e crie um `.env` na raiz:

```
EXPO_PUBLIC_API_URL=http://192.168.0.10:3333   # IP da máquina na rede
```

## Escopo da v1 (MVP)

| Aba | Arquivo | O que faz |
|-----|---------|-----------|
| **Ofertas** | [app/(tabs)/index.tsx](app/(tabs)/index.tsx) | Encarte digital: ofertas da semana + faixa de ofertas relâmpago (contador ao vivo), filtro por categoria, pull-to-refresh, skeleton de carregamento |
| **Mercado** | [app/(tabs)/mercado.tsx](app/(tabs)/mercado.tsx) | Catálogo completo (~243 produtos) com busca e filtro por categoria. Item por unidade: `+` rápido. Item por peso: abre o detalhe pra escolher o peso |
| **Carrinho** | [app/(tabs)/carrinho.tsx](app/(tabs)/carrinho.tsx) | "Compre pelo app e receba em casa": monta a lista, ajusta quantidades, subtotal (estimado quando há itens por peso). Vazio = explica o fluxo |
| **Clube** | [app/(tabs)/clube.tsx](app/(tabs)/clube.tsx) | Cadastro (nome/CPF/celular) + cartão digital. Depois o sócio **escaneia o QR Code da nota fiscal** ([app/nota-scanner.tsx](app/nota-scanner.tsx), expo-camera) e acumula pontos; lista de notas registradas |
| **Avisos** | [app/(tabs)/notificacoes.tsx](app/(tabs)/notificacoes.tsx) | Histórico de notificações + botão para testar a oferta relâmpago (notificação local) |

**Aviso de abertura**: ao abrir o app aparece um modal ([src/components/AvisoModal.tsx](src/components/AvisoModal.tsx)) com o **horário de funcionamento** da loja + botão do televendas no WhatsApp. Mostra uma vez por dia; a equipe troca por comunicados de feriado e liga/desliga pelo painel admin (`/admin/aviso`). Padrão em [src/data/aviso.ts](src/data/aviso.ts) — **confirmar o horário real com o cliente**.

### Clube Amazonas — cashback por nota fiscal

Cartão com o **saldo de cashback** ([app/(tabs)/clube.tsx](app/(tabs)/clube.tsx),
gradiente da marca) + **extrato** de todas as movimentações (bônus, notas, usos).
O sócio escaneia o **QR Code da NFC-e** ([app/nota-scanner.tsx](app/nota-scanner.tsx));
[src/lib/nfe.ts](src/lib/nfe.ts) lê a chave de 44 dígitos e o valor `vNF` (só em nota
offline), evita duplicar e credita **`loja.cashbackPercentual`%** de cashback.
Cadastro dá **R$ 25 de bônus de boas-vindas**.

**Usar o cashback:** no [checkout](app/checkout.tsx), a seção "Cashback do Clube"
tem um switch que abate `min(saldo, subtotal)` do total. O uso vira um movimento
negativo no extrato (`ClubeContext.usarCashback`). O total abatido vai no pedido
(`cashbackUsado` / `total`) e na mensagem do WhatsApp.

> Para visualizar a área do sócio com saldo sem cadastrar, rode com
> `EXPO_PUBLIC_DEMO_SOCIO=1` — cria um sócio de exemplo com extrato (só dev).

**Só do Amazonas:** preencher `loja.cnpjs` em [src/data/loja.ts](src/data/loja.ts)
com os CNPJs das lojas. Enquanto vazio, roda em "modo demonstração" (aceita qualquer
nota) — a tela avisa. Valor exato de nota emitida *online* precisa de consulta à
SEFAZ (backend).

Detalhe da oferta: [app/oferta/[id].tsx](app/oferta/[id].tsx) — aplica o preço de
sócio automaticamente quando o cliente está logado no Clube.

### Pedido por WhatsApp + acompanhamento

Carrinho → [app/checkout.tsx](app/checkout.tsx) coleta nome, endereço e forma de
pagamento → cria o pedido (`POST /pedidos`, recebe um **código AMZ-XXXX**) →
abre o WhatsApp da loja com a lista + o código. Carrinho persiste em AsyncStorage;
nenhum pagamento é processado no app.

**Acompanhamento** ([app/pedido/[id].tsx](app/pedido/[id].tsx)): linha do tempo
_aguardando → aceito → separando → saiu para entrega → entregue_. O mercado
atualiza o status no painel (`POST /admin/pedidos/:id/status`); a cada mudança o
app dispara **push** para o aparelho do cliente (`data.pedidoId` abre a tela do
pedido) e a tela faz _poll_ a cada 20s. [app/meus-pedidos.tsx](app/meus-pedidos.tsx)
lista os pedidos (via `PedidosProvider`, AsyncStorage). Sem servidor
(`EXPO_PUBLIC_API_URL` ausente) o pedido é **local/demo** e avança pelo botão
"▶ Avançar status" na própria tela.

Painel: seção **Pedidos** em [server/public/admin.html](server/public/admin.html)
(atualiza sozinha a cada 15s; botões de avançar/cancelar). Abrir com
`?token=SEU_TOKEN` na URL preenche o acesso.

## Estrutura

```
app/                 rotas (expo-router)
app/admin/           área de admin no app (preços, ofertas, avisos, pedidos)
src/
  api/               http, config, ofertas, produtos, pedidos, devices, admin (cache + fallback)
  hooks/             useOfertas, useOferta, useContagemRegressiva, useAviso
  theme/             paleta oficial (Opção 1) + spacing/radius/font
  data/              ofertas/produtos seed (fonte única) + aviso + types
  components/        OfertaCard, ProdutoImagem, AvisoModal, Skeleton, Estado, ui
  context/           Catalogo (catálogo via API), Admin (token+PIN), Carrinho, Clube, Pedidos
  lib/               format (BRL/datas), notifications (push + demo), contato (WhatsApp), cofre (secure-store)
server/              API Express + painel admin web (ver server/README.md)
scripts/             gen-assets.mjs (ícone/splash) · sync-seed.mjs (ofertas + catálogo → servidor)
assets-source/       logo original
```

### Catálogo do mercado (Mercado)

[src/data/produtos.seed.json](src/data/produtos.seed.json) — ~243 produtos das 9
categorias, gerado por `npm run gen:catalogo` ([scripts/gen-catalogo.mjs](scripts/gen-catalogo.mjs),
edite as listas lá). [src/data/catalogo.ts](src/data/catalogo.ts) tem os helpers de
busca/filtro (puros, recebem a lista).

Em runtime o catálogo vem da API ([src/api/produtos.ts](src/api/produtos.ts) →
[CatalogoContext](src/context/CatalogoContext.tsx)): **API → cache local → seed
embarcado**, igual às ofertas. Os preços são ajustados durante a semana pela
**área de admin dentro do app** (`GET /produtos`, `POST /admin/produtos/precos`) —
sem precisar de nova versão.

### Área de admin (só a dona)

Pressão longa (~800ms) no logo da aba **Ofertas** abre `/admin`. Login com o
`ADMIN_TOKEN` do servidor + PIN opcional de 4 dígitos (guardados no
`expo-secure-store`). De lá dá para editar **preços do catálogo**, **ofertas da
semana**, o **aviso de abertura** e acompanhar **pedidos** — o mesmo que o painel
web ([server/public/admin.html](server/public/admin.html)), mas pelo celular.

### Venda por peso

`Produto.modoVenda` = `unidade` | `peso` | `unidade_ou_peso`:
- **peso** (carnes, queijo em peça): [SeletorCompra](src/components/SeletorCompra.tsx)
  com chips de peso aproximado (500 g, 1 kg…) + campo livre + nº de porções. O
  valor é **estimado** ("≈") e ajustado pelo peso real na separação.
- **unidade_ou_peso** (hortifruti solto): o cliente escolhe — "por unidade"
  calcula `preço/kg × peso médio da unidade` ([src/data/compravel.ts](src/data/compravel.ts)).

O carrinho ([CarrinhoContext](src/context/CarrinhoContext.tsx)) trata itens de
unidade e peso na mesma lista; a mensagem do WhatsApp, o pedido e o painel
mostram o peso escolhido.

### Ofertas de exemplo

A fonte única é [src/data/ofertas.seed.json](src/data/ofertas.seed.json) (encarte
"Ofertão da Independência" — 34 produtos reais com preço de/por). O app calcula
as datas de validade na carga para o demo não expirar. Rode
`npm run sync:seed` para propagar as mesmas ofertas para o `server/db.seed.json`.

### Encarte da semana

As 4 páginas do panfleto ficam em `assets/encarte/` e aparecem num visualizador
próprio ([app/encarte.tsx](app/encarte.tsx)), acessível pelo banner no topo da
aba Ofertas. Trocar as imagens a cada campanha em [src/data/encarte.ts](src/data/encarte.ts).

**Fotos dos produtos:** recortadas do encarte por `npm run crop:produtos`
([scripts/crop-produtos.mjs](scripts/crop-produtos.mjs)) — coordenadas por produto,
saída em `assets/produtos/<id>.jpg`, mapeadas em
[src/data/produtoImagens.ts](src/data/produtoImagens.ts). São **provisórias**
(recorte de montagem, alguns pegam um resquício de tarja); o ideal é trocar por
fotos com fundo branco pelo painel admin (campo `imagem` aceita URL).
`npm run crop:produtos --contato` gera uma folha de contato para conferência.

## Fluxo de ofertas

```
Painel admin  ──POST /admin/ofertas──▶  server/db.json
                                             │
App  ──GET /ofertas──────────────────────────┘  (cacheia em AsyncStorage)
     └─ sem EXPO_PUBLIC_API_URL → usa src/data/ofertas.ts (demo)

Oferta relâmpago:
Painel ──POST /admin/relampago──▶ Expo Push API ──▶ aparelhos cadastrados
                                                    (token salvo via POST /devices)
```

## Paleta (Opção 1 — "Fiel à marca")

Definida em [src/theme/colors.ts](src/theme/colors.ts). `primary #F26522`,
`primaryDark #C74E13`, `text #1A1A1A`, `background #FFFDFB`, `surface #F4F1ED`,
`success #2E9E5B`, `danger #E5322D` (relâmpago), `accent #FFB020` (selo sócio).

## Assets

Ícone, splash, favicon e logo de cabeçalho são gerados da marca oficial
(`assets-source/logo-app.png`, PNG com fundo transparente):

```bash
npm run gen:assets
```

A **tela de abertura** ([app.json](app.json) → `expo-splash-screen`) mostra a logo
sobre fundo laranja `#F26522` enquanto o app carrega; [app/_layout.tsx](app/_layout.tsx)
segura a splash até o `ClubeProvider` terminar de carregar. O componente
[src/components/Logo.tsx](src/components/Logo.tsx) renderiza a mesma marca no header
da aba Ofertas e no modal de aviso. Fotos de produto: `npm run crop:produtos`.

## Checks

```bash
npm run typecheck
npx expo-doctor
```

## Pendências para virar produto

- [ ] Logo oficial (ícone, splash, wordmark no app)
- [ ] Trocar `server/db.json` por Postgres; auth do painel além do token
- [ ] Integração real do Clube Amazonas (API do PDV / fidelidade)
- [ ] `eas.json` + `projectId` para build de loja e push de produção
- [ ] Lista de compras persistente, busca de produtos, checkout
