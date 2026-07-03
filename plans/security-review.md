# Plano: Segurança — Oikos Mobile

## Contexto

Após análise completa do codebase, foram identificadas vulnerabilidades em 4 camadas:
credenciais e chaves de API expostas, falhas na camada de autenticação e rede,
rotas sem proteção de autenticação, e problemas de qualidade/exposição em logging e inputs.
O plano está organizado por prioridade de risco real, não de complexidade de implementação.

---

## Fase 1 — Credenciais & Chaves (Crítico — fazer antes do próximo build)

### 1.1 Restringir Google Maps API Key no Google Cloud Console
**Não é mudança de código — é configuração externa.**

- Acessar console.cloud.google.com → APIs & Services → Credentials → chave `AIzaSyCf...`
- Adicionar restrição **Android**: package `com.oikos` + SHA-1 da keystore EAS
  - Obter SHA-1: `eas credentials --platform android`
- Adicionar restrição **iOS**: bundle identifier `com.oikos`
- Habilitar apenas as APIs usadas: Maps SDK for Android, Maps SDK for iOS, Places API, Geocoding API
- Definir cota diária de requisições como proteção contra abuso

### 1.2 Mover credenciais de store para EAS Secrets
**Arquivos afetados:** `eas.json`, `docs/`

Os arquivos `docs/oikos-circular-economy-76798dd51e52.json` (Google Service Account)
e `docs/AuthKey_WH824CT5G7.p8` (Apple API Key) existem em disco. O ideal é que
o EAS os leia de secrets remotos, não de arquivos locais.

```bash
eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT_KEY \
  --type file --value ./docs/oikos-circular-economy-76798dd51e52.json

eas secret:create --scope project --name ASC_API_KEY \
  --type file --value ./docs/AuthKey_WH824CT5G7.p8
```

Depois atualizar `eas.json`:
```json
"android": {
  "serviceAccountKeyPath": "/run/secrets/GOOGLE_SERVICE_ACCOUNT_KEY",
  "track": "alpha"
},
"ios": {
  "ascAppId": "6786017565",
  "ascApiKeyPath": "/run/secrets/ASC_API_KEY",
  "ascApiKeyIssuerId": "4c9b4692-ac79-43ae-b954-21bac9566bec",
  "ascApiKeyId": "WH824CT5G7"
}
```
> Verificar na docs do EAS o path exato onde secrets de arquivo ficam disponíveis durante o submit.

### 1.3 Separar ADMIN credentials do .env mobile
**Arquivo afetado:** `.env`

`ADMIN_USERNAME` e `ADMIN_PASSWORD` são usados apenas em `openapi-ts.config.ts`
(geração do SDK — nunca entram no bundle). Devem sair do `.env` e ir para um
`.env.openapi` separado (gitignored).

Criar `.env.openapi`:
```
ADMIN_USERNAME="oikos-admin"
ADMIN_PASSWORD="!Oikos@Adm1n#2026"
```

Atualizar `openapi-ts.config.ts` para ler de `.env.openapi` e atualizar `package.json`:
```json
"generate:api": "dotenv -e .env.openapi -- openapi-ts"
```

Adicionar ao `.gitignore`: `.env.openapi`
Remover `ADMIN_USERNAME` e `ADMIN_PASSWORD` do `.env`.

---

## Fase 2 — Auth & Rede (Alto)

### 2.1 Corrigir race condition na inicialização do token
**Arquivo:** `src/libs/api/oikos-api.ts` (linhas 29–33) + `src/contexts/auth-context.tsx` (linha 83)

**Problema:** `getStoredToken()` é chamado com `.then()` sem await tracking.
`auth-context.tsx` lê `getAuthToken()` sincronamente antes das promises resolverem.

**Correção:** Substituir o carregamento especulativo por uma promise rastreável:

```ts
// oikos-api.ts
let authToken: string | null = null;
let refreshToken: string | null = null;

export const tokenLoadPromise = Promise.all([
  getStoredToken().then(t => { if (t) authToken = t; }),
  getStoredRefreshToken().then(t => { if (t) refreshToken = t; }),
]);
```

Em `auth-context.tsx`, na função `loadStorageData`:
```ts
await tokenLoadPromise; // aguarda antes de checar
const tokenValue = getAuthToken();
```

### 2.2 Adicionar timeout nos clientes HTTP
**Arquivos:** `src/libs/api/oikos-api.ts` (linha 22), `src/libs/api/brasil-api.ts`

```ts
// oikos-api.ts
client.setConfig({ baseURL, throwOnError: true, timeout: 30_000 });

// brasil-api.ts
export const brasil_api = axios.create({ baseURL, timeout: 10_000 });
```

### 2.3 Mover @expo/ngrok para devDependencies
**Arquivo:** `package.json` (linha 22)

```bash
npm install --save-dev @expo/ngrok
```

Remove do `dependencies`, adiciona em `devDependencies`. Nunca deve entrar no bundle de produção.

### 2.4 Remover @googlemaps/google-maps-services-js
**Arquivo:** `package.json` (linha 25)

Não referenciado em nenhum arquivo `src/`. É o SDK server-side Node.js (não React Native).

```bash
npm uninstall @googlemaps/google-maps-services-js
```

---

## Fase 3 — Rotas & Inputs (Médio)

### 3.1 Adicionar Stack.Protected nas rotas de complaint creation
**Arquivo:** `src/app/(tabs)/complaints/(create)/_layout.tsx`

Atualmente só `profile` tem `Stack.Protected`. As rotas de criação de denúncia
são acessíveis via deep link sem autenticação validada ao nível do router.

```tsx
// src/app/(tabs)/complaints/(create)/_layout.tsx
import { useAuth } from "@/contexts/auth-context";

export default function ComplaintsCreateStackLayout() {
  const { isAuthenticated } = useAuth();
  return (
    <Stack.Protected guard={isAuthenticated}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="camera" options={{ headerShown: false }} />
      <Stack.Screen name="preview" options={{ ... }} />
    </Stack.Protected>
  );
}
```

Aplicar o mesmo em `src/app/(tabs)/complaints/list.tsx` se tiver layout próprio.

### 3.2 Adicionar Zod validation nos JSON.parse da resolution
**Arquivo:** `src/app/(tabs)/complaints/resolution.tsx` (linhas 120, 128)

```ts
const CompanySchema = z.object({ id: z.string(), name: z.string() /* ... */ });
const AttachmentSchema = z.array(z.object({ id: z.string(), url: z.string() }));

const company = CompanySchema.parse(JSON.parse(resolutionDraft.companyJson));
const attachments = AttachmentSchema.parse(JSON.parse(resolutionDraft.attachmentsJson));
```

### 3.3 Sanitizar mensagens de erro expostas ao usuário
**Arquivo:** `src/components/google-places-input.tsx` (linhas 56–60)

```ts
onFail={error => {
  console.error("[GooglePlaces] internal error:", error);
  setApiError("Serviço de busca de endereços indisponível. Tente novamente.");
}}
```

### 3.4 Validar formato de parâmetros de deep link
**Arquivos:** `resolution.tsx:88`, `market/[companyId].tsx:54`, `companies/[companyId]/index.tsx:41`

```ts
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!UUID_REGEX.test(id)) {
  router.replace("/");
  return;
}
```

### 3.5 Remover dados sensíveis dos logs de auth
**Arquivo:** `src/contexts/auth-context.tsx` (linhas 89, 142, 159, 180)

```ts
// Substituir console.error(error) por:
console.error("[Auth] sign-in failed:", (error as AxiosError)?.response?.status);
```

Idem para `src/app/(tabs)/(home)/profile.tsx:346`.

---

## Fase 4 — Permissões & Qualidade (Baixo)

### 4.1 Ajustar permissão de localização iOS
**Arquivo:** `app.config.ts` (linhas 58–60)

Remover `locationAlwaysAndWhenInUsePermission` se background location não for usada
em produção neste momento. Manter apenas `locationWhenInUsePermission`.

### 4.2 Corrigir memory leak no sessionBus
**Arquivo:** `src/app/_layout.tsx` (linha 26)

```ts
useEffect(() => {
  return sessionBus.subscribe(() => queryClient.resetQueries());
}, [queryClient]);
```

### 4.3 Adicionar complexidade mínima de senha
**Arquivos:** `src/app/(tabs)/(home)/sign-in.tsx:37`, `src/app/(tabs)/(home)/sign-up.tsx:33`

```ts
password: z.string()
  .min(8, "Mínimo 8 caracteres.")
  .regex(/[A-Z]/, "Precisa ter ao menos uma letra maiúscula.")
  .regex(/[0-9]/, "Precisa ter ao menos um número.")
```

---

## Fora do Escopo Agora (Roadmap futuro)

| Item | Motivo do adiamento |
|---|---|
| Certificate pinning | Incompatível com EAS Update OTA (atualizações JS falhariam) |
| SecureStore `keychainAccessible` | Risco de bloquear usuários com dispositivos sem PIN |
| Monitorar pacotes alpha (gluestack, nativewind) | Aguardar stable release |

---

## Achados completos por severidade

| Severidade | Achado | Arquivo |
|---|---|---|
| CRÍTICO | Admin password em `.env` | `.env:4-5` |
| CRÍTICO | Google API key baked no bundle JS | `reverse-geocode.ts:1`, `google-places-input.tsx:15` |
| ALTO | Sem timeout nos clientes HTTP | `oikos-api.ts:22`, `brasil-api.ts` |
| ALTO | Race condition no carregamento do token | `oikos-api.ts:29-33`, `auth-context.tsx:83` |
| ALTO | `@expo/ngrok` em production deps | `package.json:22` |
| MÉDIO | Sem `Stack.Protected` nas rotas de complaint | `complaints/(create)/_layout.tsx` |
| MÉDIO | `JSON.parse` sem Zod na resolution | `resolution.tsx:120,128` |
| MÉDIO | Erro raw da API Google exibido ao usuário | `google-places-input.tsx:56-60` |
| MÉDIO | Params de deep link sem validação de formato | `resolution.tsx:88`, `[companyId].tsx:54` |
| MÉDIO | AxiosError logado com dados sensíveis | `auth-context.tsx:89,142,159,180` |
| MÉDIO | `usesCleartextTraffic=true` em debug builds | `android/.../debug/AndroidManifest.xml:6` |
| MÉDIO | `android:allowBackup=true` no manifest | `android/.../main/AndroidManifest.xml` |
| BAIXO | `locationAlwaysAndWhenInUsePermission` muito amplo | `app.config.ts:58-60` |
| BAIXO | Memory leak no `sessionBus.subscribe` | `src/app/_layout.tsx:26` |
| BAIXO | Senha sem regra de complexidade | `sign-in.tsx:37`, `sign-up.tsx:33` |
| BAIXO | `@googlemaps/google-maps-services-js` sem uso | `package.json:25` |
| BAIXO | GPS `mocked` flag não é prova de autenticidade | `use-submit-complaints.ts:57` |

---

## Verificação

1. **Fase 1:** Google Maps funciona no app com a chave restrita (Android + iOS)
2. **Fase 2:** Cold start com token existente → abre autenticado sem re-login
3. **Fase 2:** Simular timeout de rede → app mostra erro em ≤30s, não trava
4. **Fase 3:** Deep link `oikos://complaints/(create)` sem auth → redireciona
5. **Fase 3:** Deep link `oikos://market/invalid-id` → redireciona sem crash
6. **Geral:** `npm run lint` sem erros; `npm test` passando
