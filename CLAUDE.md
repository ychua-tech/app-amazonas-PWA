@AGENTS.md

# App Supermercado Amazonas

App iOS + Android do Supermercado Amazonas (Juína/MT). Expo SDK 57 + expo-router + TypeScript.
API + painel admin em `server/` (Express, JSON file).

## Convenções

- Código e textos de UI em **português (pt-BR)**.
- Cores **sempre** via `src/theme` (paleta Opção 1). Nunca hex solto nos componentes.
- Telas consomem dados via hooks (`src/hooks`), nunca importam mocks direto.
  A camada `src/api` decide entre API real / cache / mock.
- Adicionar libs com `npx expo install`, nunca `npm install <pkg>` direto (exceto devDeps como sharp).
- `.npmrc` tem `legacy-peer-deps=true` — necessário no SDK 57, não remover.
- Ao ligar backend novo, manter as assinaturas de `src/data/types.ts`.

## Escopo atual (v1)

5 abas: **Ofertas da semana** · **Mercado** (catálogo completo `app/(tabs)/mercado.tsx` — busca + categorias, ~243 produtos) · **Carrinho** ("compre pelo app e receba em casa" — pedido vai pro WhatsApp, sem pagamento online, cashback abate no total) · **Clube Amazonas** (cadastro + escanear QR da nota fiscal → cashback) · **Avisos**.
Extras: encarte (`app/encarte.tsx`), aviso de abertura (`AvisoModal`), acompanhamento de pedido (`app/pedido/[id].tsx`).

**Área de admin** (`app/admin/`, só a dona): acesso escondido por pressão longa (~800ms) no logo da aba Ofertas. Login com `ADMIN_TOKEN` (validado em `GET /admin/ping`) + PIN opcional de 4 dígitos, guardados no `expo-secure-store` (`src/context/AdminContext.tsx`, `src/lib/cofre.ts`). Telas: preços do catálogo (`precos.tsx`, salva em lote via `POST /admin/produtos/precos` e chama `useCatalogo().refresh()`), ofertas, aviso e pedidos. Chamadas autenticadas via `useAdmin().req()` → `src/api/admin.ts`.

## Venda por peso

`Produto.modoVenda`: `unidade` | `peso` | `unidade_ou_peso`. Item por peso → `SeletorCompra` (chips de peso aproximado + peso custom + porções). Hortifruti `unidade_ou_peso` → toggle unidade/peso; "por unidade" usa `preco/kg × pesoMedioUn`. Carrinho: `ItemCarrinho` unificado (`modo`, `pesoKg`, `linhaId`); helpers em `src/data/compravel.ts`. Valores por peso são estimados ("≈"), ajustados na separação.

Fora do escopo: pagamento online, entrega rastreada por GPS.

## Assets

Ícone/splash/favicon/logo de cabeçalho gerados de `assets-source/logo-app.png` por `npm run gen:assets` (scripts/gen-assets.mjs, sharp). O mesmo script também gera os ícones do PWA em `public/icons/` (192, 512, maskable, apple-touch-icon). Fotos de produto recortadas do encarte por `npm run crop:produtos`. Tudo provisório até arte oficial.

## PWA (web)

`web.output` é `single` (SPA client-only) — o catálogo/carrinho/admin dependem de API + AsyncStorage/SecureStore em runtime, então **não** usar `static`/SSG sem repensar isso.

- `public/` é copiado literal pro build web (`npx expo export --platform web`); é onde moram os arquivos que o app não processa via import.
- `public/index.html` sobrescreve o template padrão do Expo (ele procura esse arquivo antes do interno) — é onde ficam `<link rel="manifest">`, `apple-touch-icon` e as metas `apple-mobile-web-app-*`. Mantém os placeholders `%LANG_ISO_CODE%`/`%WEB_TITLE%` e o `<div id="root">`.
- `theme-color`/`description`/`lang` do manifest **e** do `<head>` vêm de `app.json` → `expo.web.{themeColor,description,lang}` (injetados no HTML no build) — mudou a marca ou o texto? edita lá, não em dois lugares.
- `public/manifest.json`: nome, ícones, `display: standalone`. Ícones vêm do `gen:assets` (não editar os PNGs à mão).
- `public/sw.js`: service worker mínimo, escrito à mão (sem Workbox). Só intercepta GET same-origin; API/checkout/admin (POST/PATCH/DELETE ou outra origem) sempre vai direto pra rede. Navegação = network-first (evita tela presa em versão velha); assets estáticos = stale-while-revalidate. Registrado em `app/_layout.tsx` (`Platform.OS === 'web'`).
- Pra testar localmente: `npx expo export --platform web --output-dir dist && npx serve dist` (o `expo start --web` também serve `public/`, mas o service worker só é interessante testar num build exportado).

## Dados

Ofertas: `src/data/ofertas.seed.json` → `npm run sync:seed` propaga p/ `server/db.seed.json` (agora inclui o catálogo também).
Catálogo do mercado: `src/data/produtos.seed.json` gerado por `npm run gen:catalogo` (edite as listas em `scripts/gen-catalogo.mjs`). `src/data/catalogo.ts` = helpers puros de busca/filtro (recebem a lista). Em runtime o catálogo vem da API (`src/api/produtos.ts` → `CatalogoContext`): API → cache AsyncStorage → seed embarcado, igual às ofertas. Preços são editados pela área de admin — no app (`app/admin/precos.tsx`) ou no painel web (`server/public/admin.html`, card "Preços do catálogo") — via `PATCH`/`POST /admin/produtos*`, nunca mais por release.
`imagem` é `string | number` (URL da API ou require de asset).
`server/db.json` é semeado automático de `server/db.seed.json` na 1ª execução (sem `cp` manual).

## Checks antes de entregar

```bash
npm run typecheck
npx expo-doctor
npx expo export --platform android --output-dir <tmp>   # pega erro de import/bundle
npx expo export --platform web --output-dir <tmp>        # confere o index.html/manifest/sw do PWA
```

Servidor: `cd server && npm run dev` (painel em http://localhost:3333).
