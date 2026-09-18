# Epic Brief — Migração de auth para better-auth

## Resumo

`@oikos-circular-environment/oikos-sdk` foi atualizado de `0.1.0-beta.1` para
`0.1.0-beta.4`. Nessa atualização o backend (`api`) trocou sua implementação de
autenticação própria (v1/v2, par access-token + refresh-token) por
[better-auth](https://better-auth.com), com os plugins `expo`, `bearer`, `admin`,
`anonymous` e `organization` já ligados. O SDK gerado a partir do OpenAPI do backend
perdeu, por consequência, todos os endpoints de login/registro/logout/refresh
(`postV1AuthLogin`, `postV1AuthLogout`, `postV1UsersRegister`) — o app mobile quebra em
build (`tsc --noEmit`) em todo ponto que chamava essas funções. Este epic é a migração
do lado mobile para consumir o novo backend via `better-auth`, mantendo as demais
funcionalidades (perfil, exclusão de conta, troca de senha, imagens autenticadas,
zustand stores) intactas.

## Contexto & Problema

### 1. `tsc --noEmit` quebrado (evidência: `npx tsc --noEmit`)
Quatro arquivos referenciam símbolos que não existem mais no pacote:
- `src/contexts/auth-context.tsx:7-9` — importa `postV1AuthLogin`, `postV1AuthLogout`,
  `postV1UsersRegister`; usados em `signIn`/`signOut`/`signUp` (linhas 117-196, 297-327).
- `src/libs/survey/synthetic-participant.ts:3-4` — mesmas funções, usadas para criar a
  conta sintética de participante de pesquisa (`provisionSyntheticParticipant`).
- `src/tests/integration/auth/auth-flow.test.tsx` e
  `src/tests/unit/survey/synthetic-participant.test.ts` — testam as funções removidas.

Todos os demais erros do `tsc` atual são ruído pré-existente, não relacionado a esta
migração (bottomsheet/checkbox/badge com tipos desatualizados de libs de UI).

### 2. Modelo de sessão mudou de forma incompatível com o código atual
Hoje (`src/libs/api/oikos-api.ts:30-204`) o app guarda um par `authToken`/`refreshToken`
em memória (hidratado de forma assíncrona e sem espera, ver ponto 3), injeta
`Authorization: Bearer <token>` em todo request via interceptor do axios, e no 401 faz
um refresh manual (`PATCH /v1/auth/refresh`) com fila de requests pendentes
(`isRefreshing`/`failedQueue`). O better-auth não tem esse conceito de par
token+refresh-token: a sessão é de vida longa (7 dias por padrão) e renovada via cookie,
sem endpoint de refresh explícito no lado do cliente — no 401 o correto é encerrar a
sessão local, não tentar renová-la.

### 3. Race de hidratação já existente (achado, não introduzido por este epic)
`oikos-api.ts:34-40` lê o token salvo do SecureStore de forma assíncrona e sem aguardar
("fire-and-forget") no carregamento do módulo — requests feitos antes dessa promise
resolver saem sem token. Isso precisa ser resolvido de qualquer forma na migração,
porque o novo client de auth tem o mesmo tipo de necessidade de cache em memória para
uso em headers síncronos (ver ponto 4).

### 4. Imagens autenticadas exigem headers síncronos
11 pontos do app (`resolution-card.tsx:70`, `company-picker-bottom-sheet.tsx:156`,
`image-preview-viewer.tsx:11`, `media-thumbnail.tsx:131`, `home-user-card.tsx:52`,
`company-card.tsx:28`, `resolution.tsx:461`, `market/[companyId].tsx:195`,
`market/index.tsx:100`, `profile.tsx:446`, `companies/[companyId]/company.tsx:356`)
passam `headers: getAuthenticatedImageHeaders()` **de forma síncrona** dentro de JSX
(`<Image source={{ uri, headers }} />`), consumido por `expo-image`. A API documentada
do cliente Expo do better-auth (`authClient.getCookie()`) é assíncrona — não existe
getter síncrono oficial. Qualquer abordagem escolhida precisa preservar um cache em
memória lido de forma síncrona nesses 11 pontos.

## Objetivo / Resultado esperado

- `npx tsc --noEmit` sem nenhum erro relacionado a auth (os 4 arquivos do ponto 1).
- Login, registro, logout, troca de senha e exclusão/cancelamento de exclusão de conta
  continuam funcionando fim a fim contra o backend better-auth.
- Sessão expirada/inválida (401) desloga o usuário localmente sem tentar renovar
  (não existe mais refresh token).
- As 11 imagens autenticadas continuam carregando normalmente, sem regressão de tela
  em branco/erro 401 em cold start.
- Conta sintética de participante de pesquisa (`synthetic-participant.ts`) volta a
  funcionar, aproveitando o plugin `anonymous` já ligado no backend em vez de recriar
  registro com email/senha falsos, se essa for a decisão tomada no tech-plan.
- Nenhuma mudança de comportamento nos zustand stores (`denunciation-store`,
  `companies-store`, `complaints-store`, `support-store`, e os 3 stores de survey) — já
  confirmados limpos (não guardam token, os 4 primeiros já assinam `sessionBus` para
  reset no logout).

## Fora de escopo

- Login social/OAuth (Google, etc.) — backend não tem `socialProviders` configurado
  ainda, plugin `expo()` do servidor cobre o caso mas não há provider ativo.
- Two-factor, passkey, magic link ou qualquer outro plugin de auth do better-auth não
  usado hoje.
- Suporte a múltiplas organizações no app (plugin `organization` do backend é usado
  hoje só para `organization_id` de empresas — os erros de tipo relacionados a
  `organization_id` no `tsc` atual são de outro epic, não deste).
- Redesenho visual de telas de login/cadastro — mudança é só de camada de dados.

## Impacto

- **Usuário**: nenhuma mudança visível esperada no fluxo feliz; sessão passa a durar
  mais tempo sem precisar de refresh silencioso.
- **Pesquisa (survey)**: depende da decisão sobre `synthetic-participant.ts` — se migrar
  para o plugin `anonymous`, o fluxo de provisionamento fica mais simples e um passo
  mais rápido (sem round-trip de registro).
- **Risco de regressão**: alto no curto prazo — é breaking change de baixo nível tocando
  o interceptor global do axios, usado por 100% dos requests autenticados do app.
