# Refresh Token + Image Upload Fix

## 1. Diagnóstico

### 1.1 Mudanças no Backend (API)

Com base no plano em `api/plans/mobile-refresh-token.md` e no git diff do SDK:

| Antes | Depois |
|---|---|
| `POST /v1/users/auth` → `{ token }` | `POST /v1/auth/login` → `{ token, refreshToken }` |
| — | `PATCH /v1/auth/refresh` → `{ refreshToken }` → `{ token, refreshToken }` (rotacionado) |
| `postV1UsersAuth` (nome antigo) | `postV1AuthLogin` (nome novo no SDK) |

O SDK já foi regenerado (`592ad0f` e `af9af94`), mas o `user-context.tsx` ainda usa os nomes/estruturas antigas.

---

## 2. O que precisa mudar

### 2.1 `src/libs/storage.ts` — adicionar refresh token

**Estado atual:** só salva/recupera `authToken` no SecureStore.

```typescript
const TOKEN_KEY = "oikos_auth_token";
const REFRESH_TOKEN_KEY = "oikos_refresh_token";
```

Adicionar:
- `saveRefreshToken(token: string)`
- `getRefreshToken()`
- `removeRefreshToken()`

### 2.2 `src/libs/api/oikos-api.ts` — interceptor de refresh automático

**Estado atual:** só injecta token Bearer no request. Sem tratamento de 401.

**O que adicionar:**

1. **Variável `refreshToken` em memória** + init a partir do SecureStore
2. **Response interceptor** no axios:
   - Se response for `401` E não for a rota de refresh:
     - Tentar `patchV1AuthRefresh({ body: { refreshToken } })`
     - Se sucesso: atualizar `authToken` + `refreshToken` em memória e SecureStore, repetir request original com novo token
     - Se falhar (refresh expirado): limpar tokens, redirecionar para login
3. **Exportar** `setRefreshToken`, `getRefreshToken` (usado pelo context)

### 2.3 `src/contexts/user-context.tsx` — usar nova rota de login

**Estado atual:**
```typescript
import { postV1UsersAuth } from "@/libs/client"; // ❌ rota antiga

// signIn mutation:
const authResponse = await postV1UsersAuth({ ... });
const token = authResponse.data?.token;
// ❌ não captura refreshToken
```

**Mudanças:**
1. Trocar import: `postV1UsersAuth` → `postV1AuthLogin`
2. Capturar `refreshToken` da response:
   ```typescript
   const { token, refreshToken } = authResponse.data;
   setAuthToken(token);
   setRefreshToken(refreshToken); // nova função em oikos-api.ts
   ```
3. `signOut` também limpar refresh token

---

## 3. Diagnóstico: imageMutation em `profile.tsx`

### 3.1 Problema de tipo (TypeScript)

`PutV1ProfilesImagesData` no SDK tem `body?: never` — o body não é tipado.

```typescript
// types.gen.ts
export type PutV1ProfilesImagesData = {
  body?: never;       // ❌ não aceita body
  path?: never;
  query?: never;
  url: "/v1/profiles/images";
};
```

O `Options` do `@hey-api/openapi-ts` intersecta com `Omit<PutV1ProfilesImagesData, "url">`, resultando em `body` tipo `never`. Qualquer valor passado para `body` quebra o typecheck.

**Causa raiz:** O OpenAPI spec do backend não descreve o body do `PUT /v1/profiles/images`, mas a implementação espera multipart/form-data com o campo `image`.

### 3.2 Problema de lógica

```typescript
onSuccess: response => {
    if (response.data?.profile) {               // ❌ response não tem .profile
        updateUserProfile({ profile: response.data.profile });
    }
}
```

O tipo da response é:
```typescript
PutV1ProfilesImagesResponses = {
  200: {
    id: string;
    url: string;
    file_name: string;
    path: string;
    base64: string;
    created_at: Date;
  };
};
```

`response.data?.profile` sempre será `undefined`. A URL da imagem nunca é atualizada no `AuthContext`, então o avatar não reflete a troca.

### 3.3 Correção

Duas opções:

**A) Fazer chamada raw axios (rápida, sem depender do SDK):**

```typescript
import { client } from "@/libs/client/client.gen";

const response = await client.instance.put("/v1/profiles/images", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
const imageData = response.data; // { id, url, file_name, ... }
updateUserProfile({ profile: { ...user?.profile, profile_image: imageData } });
```

**B) Corrigir o OpenAPI spec no backend** para tipar corretamente o body como multipart/form-data com campo `image` e regenerar o SDK.

---

## 4. Plano de Execução

### Etapa 1 — Refresh token: storage

Arquivo: `src/libs/storage.ts`

- [ ] Adicionar `REFRESH_TOKEN_KEY`
- [ ] Implementar `saveRefreshToken`, `getRefreshToken`, `removeRefreshToken`

### Etapa 2 — Refresh token: oikos-api.ts

Arquivo: `src/libs/api/oikos-api.ts`

- [ ] Importar `patchV1AuthRefresh` do SDK
- [ ] Adicionar `refreshToken` em memória + init do SecureStore
- [ ] Implementar `setRefreshToken(token | null)`
- [ ] Implementar `getRefreshToken()`
- [ ] Adicionar response interceptor no axios:
  - Em 401 (exceto rota de refresh): tentar refresh
  - Se refresh OK: atualizar tokens, retry request original
  - Se refresh falha: limpar tudo, redirecionar para sign-in

### Etapa 3 — Refresh token: user-context.tsx

Arquivo: `src/contexts/user-context.tsx`

- [ ] Trocar import `postV1UsersAuth` → `postV1AuthLogin`
- [ ] Capturar `refreshToken` no signIn e salvar via `setRefreshToken`
- [ ] `signOut` limpar refresh token via `setRefreshToken(null)`

### Etapa 4 — Fix image upload (profile.tsx)

Arquivo: `src/app/(tabs)/(home)/profile.tsx`

- [ ] Substituir chamada SDK por chamada raw axios no `imageMutation`
- [ ] Corrigir `onSuccess` para atualizar `updateUserProfile` com a URL da imagem

---

## 5. Fluxo de refresh automático (diagrama)

```
Request autenticado
       │
       ▼
  [axios interceptor]
  Adiciona Bearer token
       │
       ▼
  ┌──────────┐
  │ Servidor  │
  └────┬─────┘
       │
  401? ──Não──→ OK (retorna response)
       │
      Sim
       │
       ▼
  Rota é /auth/refresh? ──Sim──→ Retorna 401 (não tenta refresh)
       │
      Não
       │
       ▼
  Tenta PATCH /v1/auth/refresh
  com refreshToken do SecureStore
       │
  ┌────┴────┐
  │  Status  │
  └────┬────┘
       │
  200 ──→ Atualiza tokens em memória + SecureStore
       │    Re-tenta request original com novo token
       │
  401 ──→ Limpa tokens
       │    Redireciona para /sign-in
       │    Toast "Sessão expirada"
```
