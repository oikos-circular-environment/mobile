# Tech Plan — Epic 13: Migração de auth para better-auth

Ver `epic-brief.md` para o contexto completo. Backend (`api`) já está migrado — ver
`api/src/modules/auth/providers/auth/better-auth/better-auth.ts`, plugins ativos:
`admin`, `anonymous`, `bearer`, `openAPI`, `expo`, `organization`, `basePath: "/auth"`.

## Decisão de arquitetura: Bearer token, não cookie

O doc oficial do better-auth para Expo recomenda `authClient.getCookie()` (assíncrono) +
header `Cookie` manual. Essa API não tem variante síncrona documentada. O app tem 11
pontos (`resolution-card.tsx:70`, `company-picker-bottom-sheet.tsx:156`,
`image-preview-viewer.tsx:11`, `media-thumbnail.tsx:131`, `home-user-card.tsx:52`,
`company-card.tsx:28`, `resolution.tsx:461`, `market/[companyId].tsx:195`,
`market/index.tsx:100`, `profile.tsx:446`, `companies/[companyId]/company.tsx:356`) que
passam headers de auth **de forma síncrona** dentro de JSX
(`<Image source={{ uri, headers }} />`), e a rota cookie exigiria inventar um cache
síncrono paralelo não coberto pela lib.

O backend já resolve isso: plugin `bearer()` está ativo (`better-auth.ts:151`), que
expõe o token de sessão no header de resposta `set-auth-token` em qualquer request que
estabeleça sessão (login, signup), e aceita `Authorization: Bearer <token>` em requests
subsequentes — exatamente o padrão que `oikos-api.ts`/`storage.ts` já implementam hoje
para o JWT antigo. Decisão: manter a arquitetura de Bearer token + SecureStore atual,
só trocando a origem do token. `expoClient` continua no `authClient` (necessário para
fetch/cookie funcionar em React Native e para `useSession`/futuro login social), mas o
axios do SDK gerado (`oikos-api.ts`) não usa o cookie do `authClient` — usa o token
capturado do header `set-auth-token`.

Consequência direta: **nenhum dos 11 call sites de imagem muda** — continuam chamando
`getAuthenticatedImageHeaders()` de forma síncrona, só que a var em memória por trás
passa a ser alimentada pelo token do better-auth em vez do JWT antigo.

## Ordem de execução

1. `package.json` — adicionar `better-auth` e `@better-auth/expo` (`expo-secure-store`
   já é dependência).
2. `src/libs/auth/auth-client.ts` (novo) — client do better-auth.
3. `src/libs/storage.ts` — remover par refresh-token, manter só token de sessão.
4. `src/libs/api/oikos-api.ts` — remover bloco de refresh manual, capturar token do
   `authClient`.
5. `src/contexts/auth-context.tsx` — trocar chamadas de SDK por `authClient`.
6. `src/libs/survey/synthetic-participant.ts` — trocar para plugin `anonymous`.
7. Testes: `auth-flow.test.tsx`, `synthetic-participant.test.ts`.
8. `npx tsc --noEmit` limpo nos 4 arquivos do brief + fluxo manual via `agent-device`.

## Abordagem arquitetural

### 1. `src/libs/auth/auth-client.ts` (novo)

```ts
import { expoClient } from "@better-auth/expo/client";
import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
	baseURL: `${process.env.EXPO_PUBLIC_BASE_URL}/auth`,
	plugins: [
		expoClient({ scheme: "oikos", storagePrefix: "oikos", storage: SecureStore }),
		anonymousClient(),
	],
});
```

`baseURL` inclui `/auth` porque o server usa `basePath: "/auth"` (não o default
`/api/auth`) — doc do better-auth: "If a custom base path other than /api/auth is used,
specify the complete URL". `scheme: "oikos"` casa com `app.config.ts:14`. Plugin
`anonymousClient()` habilita `authClient.signIn.anonymous()` (item 6).

### 2. `src/libs/storage.ts` — remover refresh token

Remove `REFRESH_TOKEN_KEY`, `saveRefreshToken`, `getRefreshToken`,
`removeRefreshToken`; `clearTokens()` só limpa `TOKEN_KEY`. **Migração de limpeza**: no
primeiro boot pós-update, `oikos_refresh_token` fica órfão no SecureStore (nunca mais
lido nem escrito) — adicionar uma chamada solta em `clearTokens()`, ou em um efeito de
boot, para `SecureStore.deleteItemAsync("oikos_refresh_token")` best-effort (não falha
se a chave não existir), evitando lixo permanente no Keychain/Keystore do device.

### 3. `src/libs/api/oikos-api.ts` — Bearer token do better-auth, sem refresh

- `authToken`/`refreshToken` (linhas 30-31) viram só `authToken`.
- Hidratação inicial (linhas 34-40): mantém o fire-and-forget de `getStoredToken()`
  (já é o comportamento atual, fora de escopo consertar a race aqui — só não duplicar
  para uma segunda variável).
- `setRefreshToken`/`getRefreshToken` (linhas 55-66): removidos. Qualquer import deles
  (`auth-context.tsx`, `synthetic-participant.ts`) cai junto na migração desses
  arquivos.
- Response interceptor (linhas 129-204): **todo o bloco de refresh manual
  (`isRefreshing`, `failedQueue`, `processQueue`, o `client.instance.patch("/v1/auth/refresh", ...)`)
  é removido**. Novo comportamento no 401: limpar token local
  (`authToken = null; await clearTokens()`) e chamar `onUnauthenticated?.()` direto,
  sem tentar renovar — better-auth não tem conceito de refresh token separado do
  servidor para o cliente (sessão é de 7 dias, renovada por `session.updateAge` no
  próprio uso, não por endpoint explícito).
- `getAuthenticatedImageHeaders()` (linhas 74-80) **não muda de assinatura** — só o
  valor de `authToken` que injeta nela passa a vir do better-auth.

### 4. `src/contexts/auth-context.tsx`

Import (linhas 1-10): trocar `postV1AuthLogin`, `postV1AuthLogout`,
`postV1UsersRegister` por `import { authClient } from "@/libs/auth/auth-client"`;
mantém `getV1Profiles`, `getV1UsersMe`, `deleteV1UsersMe`,
`patchV1UsersMeCancelDeletion`, `patchV1UsersMeChangePassword` (não mudaram).

- **`signInMutation`** (linhas 117-137): troca o `postV1AuthLogin` por
  ```ts
  const { data, error } = await authClient.signIn.email(
      { email: data.email, password: data.password },
      { onSuccess: ctx => {
          const token = ctx.response.headers.get("set-auth-token");
          if (token) setAuthToken(token);
      }},
  );
  if (error) throw error; // onError já trata AxiosError hoje; ver nota de erro abaixo
  ```
  Resto do fluxo (buscar profile/account, `onSuccess`/`onError` de UI) fica igual.
  **Nota de erro**: `error` do better-auth não é `AxiosError` — é
  `{ code, message, status, statusText }`. O `onError` atual faz
  `switch (error.response?.data.code)`; trocar para checar `error.code` direto
  (código `INVALID_EMAIL_OR_PASSWORD` é o que o better-auth usa por padrão para
  credenciais erradas, confirmar contra o comportamento real do backend antes de
  fechar o ticket).
- **`signUpMutation`** (linhas 178-196): `authClient.signUp.email` exige `name`
  (obrigatório no better-auth core), que o formulário atual de cadastro não coleta —
  hoje o nome só é preenchido depois, na etapa de perfil (`needsProfileCompletion`).
  Decisão: enviar `name: data.email.split("@")[0]` como placeholder, mesma lógica que
  já existe para nome sintético de teste — real fica por conta do preenchimento de
  perfil, sem mudar UX/telas de cadastro. **Verificar** `REQUIRE_EMAIL_VERIFICATION`
  no ambiente alvo (`api/src/env`): se `true`, o signUp não estabelece sessão até
  verificação de email e o redirecionamento atual para `/sign-in` já é o
  comportamento certo; se `false`, o signUp já loga o usuário (sessão criada na hora)
  e o fluxo atual de "vá fazer login" fica redundante — ajustar só se confirmado.
- **`signOut`** (linhas 297-327): troca a chamada manual a `postV1AuthLogout` (com
  header de `Authorization` explícito) por `await authClient.signOut()` — revoga a
  sessão no servidor sem precisar montar header manualmente. Resto (limpar
  `authToken`, `sessionBus.emit()`, navegação/toast condicionados a `!options?.silent`)
  fica igual.
- **`changePasswordMutation`** (linhas 248-295): trocar `patchV1UsersMeChangePassword`
  por `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true })`
  direto — não usar mais o endpoint custom do SDK. Achado: o endpoint
  `/v1/users/me/change-password` hoje é só um wrapper fino que chama
  `auth.api.changePassword` no servidor **sem passar `revokeOtherSessions`**
  (`api/src/modules/auth/providers/auth/better-auth/better-auth-auth-provider.ts:208-220`),
  então o toast atual "Suas outras sessões foram desconectadas"
  (`auth-context.tsx:271-274`) é enganoso — nenhuma sessão é revogada hoje. Chamar o
  client direto com `revokeOtherSessions: true` corrige isso de graça. Remover
  também o bloco `if (data?.token && data?.refreshToken)` (linhas 263-270) — não existe
  mais reemissão de token nesse fluxo. **Fora de escopo mas worth flagging**: o
  endpoint `/v1/users/me/change-password` no repo `api` fica órfão após essa troca —
  candidato a remoção num epic/ticket do lado do backend, não deste. `onError`
  (linhas 276-294) usa o mesmo padrão de `error.response?.data.code` do
  `signInMutation` — mesma troca para `error.code` (nota do item acima), códigos
  `INVALID_CREDENTIALS`/`SAME_PASSWORD` a confirmar contra o nome real que o
  better-auth usa (provavelmente `INVALID_PASSWORD` e algo como
  `NEW_PASSWORD_MUST_BE_DIFFERENT`, checar no ambiente antes de fechar o ticket).
- `requestDeletionMutation`/`cancelDeletionMutation`: sem mudança, endpoints intactos.

### 5. `src/libs/survey/synthetic-participant.ts` — plugin `anonymous`

Backend já tem `anonymous()` ligado (`better-auth.ts:142-150`, campo `is_anonymous` no
schema). Troca recomendada: em vez de `postV1UsersRegister` + `postV1AuthLogin` com
credenciais fake geradas por `faker` (linhas 71-116), usar
`authClient.signIn.anonymous()` — sem email/senha fake, sem lidar com 409 de colisão de
email (linhas 91-103 somem inteiras). Captura do token continua igual ao item 4
(`set-auth-token` no header de resposta do `signIn.anonymous`, plugin `bearer` se aplica
a qualquer endpoint que gere sessão). Resto do fluxo (`resolveSyntheticAddress`,
`putV1Profiles` com nome sintético) não muda.

Requer confirmação de produto/backend antes de fechar o ticket: participantes
`is_anonymous: true` aparecem corretamente nos paineis de moderação/dashboard de
pesquisa do jeito que os sintéticos atuais (usuários "reais" com email
`@participant.invalid`) aparecem hoje? Se não, manter a alternativa de
`authClient.signUp.email` + `authClient.signIn.email` com as mesmas credenciais fake
geradas por `faker` (mesma lógica de 409/retry, só trocando a chamada de SDK por
`authClient`, e passando `name` conforme item 4).

### 6. Testes

- `src/tests/integration/auth/auth-flow.test.tsx`: mockar `authClient.signIn.email` /
  `authClient.signUp.email` / `authClient.signOut` em vez de
  `postV1AuthLogin`/`postV1AuthLogout`.
- `src/tests/unit/survey/synthetic-participant.test.ts`: mockar
  `authClient.signIn.anonymous` (ou `signUp.email`/`signIn.email`, conforme decisão do
  item 5).

## Arquivos-chave

- `package.json`
- `src/libs/auth/auth-client.ts` (novo)
- `src/libs/storage.ts`
- `src/libs/api/oikos-api.ts`
- `src/contexts/auth-context.tsx`
- `src/libs/survey/synthetic-participant.ts`
- `src/tests/integration/auth/auth-flow.test.tsx`
- `src/tests/unit/survey/synthetic-participant.test.ts`

Não tocar: zustand stores (`src/stores/*`) — confirmado que nenhum guarda token ou lê
estado de auth diretamente; `denunciation/companies/complaints/support-store` já
assinam `sessionBus` para reset no logout, os 3 stores de survey guardam estado de
participante anônimo (não de usuário autenticado), sem relação com este epic.

## Riscos / atenção

- **Blast radius**: `oikos-api.ts` é o interceptor global do axios usado por 100% dos
  requests autenticados — qualquer erro no item 3 quebra o app inteiro, não só telas de
  auth. Testar manualmente login, uma tela autenticada qualquer, e logout antes de dar
  como pronto.
- **`error.code` do better-auth** é uma superfície nova e não documentada com certeza
  para este backend — o `switch` de erro em `signInMutation.onError` (linhas 155-175)
  precisa ser validado contra erro real (credenciais erradas) rodando no ambiente, não
  só por leitura de doc.
- **`name` obrigatório no signup**: usar local-part do email como placeholder é a
  decisão deste plano, mas é uma mudança de dado armazenado (better-auth grava
  `user.name`) que não existia antes — confirmar que nenhuma tela exibe esse campo
  hoje assumindo que está vazio/null.
- **Sessão sem refresh**: qualquer client desatualizado com token antigo (JWT do
  sistema anterior) some de sessão no primeiro request pós-deploy — é o comportamento
  esperado (força novo login), mas vale avisar o time antes do rollout já que não tem
  período de transição possível (backend não aceita mais o formato antigo).

## Validação

- `npx tsc --noEmit`: zero erros nos 4 arquivos listados no brief (demais erros de UI
  já existiam antes deste epic, não são critério de aceite aqui).
- `npm test` nos arquivos de auth/survey afetados.
- Fluxo manual via `agent-device`: cadastro → login → tela autenticada (ex.: perfil,
  qualquer imagem autenticada das 11 listadas) → troca de senha → logout → sessão
  expirada (revogar manualmente e confirmar que app desloga sem tentar refresh) →
  fluxo de survey criando participante sintético.
