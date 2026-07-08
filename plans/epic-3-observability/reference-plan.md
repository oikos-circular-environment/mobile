# Plano: Observabilidade — Oikos Mobile

## Contexto

O app Oikos vai para produção sem nenhuma instrumentação de observabilidade:
sem crash reporting, sem analytics, sem performance monitoring, sem error boundary,
sem logging estruturado. Erros em produção são silenciosos. Este plano define
quais ferramentas adotar, em que ordem, e como integrá-las ao projeto sem custo
inicial — com caminho claro para escalar quando necessário.

---

## Estado atual do projeto

| Categoria | Estado |
|---|---|
| Crash reporting | ❌ Nenhum |
| Product analytics | ❌ Nenhum |
| Performance monitoring | ❌ Nenhum |
| Error boundary React | ❌ Nenhum |
| Logging estruturado | ❌ Apenas `console.error/log` em 4 arquivos |
| MAU / usage baseline | ❌ Nenhum |
| Feature flags | ❌ Nenhum |
| `@buoy-gg/*` dev overlay | Instalado mas **não usado** — pode ser removido |

---

## Comparativo de ferramentas

| Ferramenta | Foco | Free tier | Pago | Expo SDK 54 | expo-router |
|---|---|---|---|---|---|
| **EAS Insights** | MAU / cold starts | ✓ 10K MAU, 90 dias | — planos Enterprise | Nativo | Nativo |
| **Firebase Crashlytics** | Crashes nativos + JS | ✓ **ilimitado** | Sem custo extra | ✓ confirmado | Manual |
| **Firebase Analytics** | Eventos, funil, audience | ✓ **ilimitado** | Sem custo extra | ✓ confirmado | Manual |
| **Firebase Performance** | App start, HTTP, renders | ✓ **ilimitado** | Sem custo extra | ✓ confirmado | Manual |
| **PostHog** | Product analytics, flags, replay | ✓ 1M eventos, 5K replays | ~$0,00005/evento | ✓ Expo SDK | Manual |
| **Sentry** | Crashes + performance + traces | ✓ 5K erros/mês | $26/mês (Team) | ✓ wizard setup | Manual (wrap root) |
| **Datadog** | Full stack / enterprise | ❌ Sem free tier | ~$31/host | Incerto | Desconhecido |

---

## Recomendação: stack em duas fases

### Fase 1 — $0/mês (lançamento)

```
EAS Insights          → MAU baseline (nativo, zero config extra)
Firebase Crashlytics  → Crash reporting completo (nativo + JS)
Firebase Analytics    → Eventos de produto, funis, retenção
Firebase Performance  → App start, HTTP request timing via Axios
PostHog               → Feature flags (para rollout gradual) + replays de sessão
```

**Custo:** $0. Firebase é 100% gratuito para estas categorias. PostHog tem
1M eventos/mês grátis — suficiente para os primeiros 6–12 meses de crescimento.

### Fase 2 — $26/mês (quando escalar)

Adicionar **Sentry** (Team plan) para:
- Performance tracing granular com `@sentry/react-query` (integração nativa com TanStack Query v5)
- Session replay com fidelidade maior que PostHog
- Source maps automáticos + alertas de regressão
- Substituir Firebase Performance por Sentry Performance (mais detalhe por span)

**Gatilho para subir de fase:** >500 MAU ativos ou necessidade de rastrear
performance de queries individuais do TanStack Query.

**Datadog:** Descartado — sem free tier, preços opacos, voltado para empresas
com infraestrutura já no ecossistema Datadog.

---

## Implementação — Fase 1

### 1. EAS Insights (expo-insights)

**Arquivo:** `app.config.ts` e `src/app/_layout.tsx`

```bash
npx expo install expo-insights
```

```ts
// src/app/_layout.tsx
import { useInsights } from "expo-insights";
// Adicionar dentro do root layout component:
useInsights();
```

Sem configuração adicional. Dados aparecem em expo.dev → projeto → Insights.

---

### 2. Firebase (Crashlytics + Analytics + Performance)

**Pré-requisito:** Criar projeto no Firebase Console e baixar
`google-services.json` (Android) e `GoogleService-Info.plist` (iOS).
Ambos devem ir para `docs/` e ser adicionados ao `.gitignore`.

```bash
npx expo install @react-native-firebase/app \
  @react-native-firebase/crashlytics \
  @react-native-firebase/analytics \
  @react-native-firebase/perf
```

**`app.config.ts`** — adicionar plugins:
```ts
plugins: [
  // ... plugins existentes ...
  "@react-native-firebase/app",
  "@react-native-firebase/crashlytics",
  ["@react-native-firebase/analytics", { "dataCollectionEnabled": true }],
  "@react-native-firebase/perf",
]
```

**`src/libs/firebase.ts`** — criar módulo de inicialização:
```ts
import crashlytics from "@react-native-firebase/crashlytics";
import analytics from "@react-native-firebase/analytics";
import perf from "@react-native-firebase/perf";

export { crashlytics, analytics, perf };
```

**`src/libs/logger.ts`** — substituir os `console.error` soltos:
```ts
import crashlytics from "@react-native-firebase/crashlytics";

export const logger = {
  error(context: string, error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    crashlytics().log(`[${context}] ${msg}`);
    crashlytics().recordError(error instanceof Error ? error : new Error(msg));
    if (__DEV__) console.error(`[${context}]`, error);
  },
  log(context: string, message: string) {
    crashlytics().log(`[${context}] ${message}`);
    if (__DEV__) console.log(`[${context}]`, message);
  },
};
```

Substituir todos os `console.error(error)` em:
- `src/contexts/auth-context.tsx` (linhas 89, 142, 159, 180)
- `src/components/camera/camera-root.tsx` (linhas 112, 134)
- `src/app/(tabs)/(home)/profile.tsx` (linha 346)

**Screen tracking para Analytics** — hook reutilizável para expo-router:
```ts
// src/libs/use-screen-tracking.ts
import { useEffect } from "react";
import { usePathname } from "expo-router";
import { analytics } from "@/libs/firebase";

export function useScreenTracking() {
  const pathname = usePathname();
  useEffect(() => {
    analytics().logScreenView({ screen_name: pathname, screen_class: pathname });
  }, [pathname]);
}
// Chamar em src/app/_layout.tsx: useScreenTracking()
```

**Identificar usuário no crash context** — em `auth-context.tsx` após sign-in:
```ts
crashlytics().setUserId(profile.id);
crashlytics().setAttribute("user_type", profile.type); // catador, empresa, cidadão
```

---

### 3. PostHog (feature flags + analytics + replay)

```bash
npx expo install posthog-react-native expo-file-system expo-device
```

**`src/libs/posthog.ts`**:
```ts
import PostHog from "posthog-react-native";

export const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY!, {
  host: "https://us.i.posthog.com",
  disabled: __DEV__,
});
```

**`src/app/_layout.tsx`** — envolver com provider:
```tsx
import { PostHogProvider } from "posthog-react-native";

<PostHogProvider client={posthog}>
  {/* conteúdo atual */}
</PostHogProvider>
```

**Identificar usuário** — após sign-in em `auth-context.tsx`:
```ts
posthog.identify(profile.id, {
  user_type: profile.type,
  city: profile.city,
});
```

**Eventos de produto relevantes para o Oikos:**
```ts
posthog.capture("complaint_submitted", { type, has_photo, has_video });
posthog.capture("marketplace_item_viewed", { company_id });
posthog.capture("ecopoint_searched", { radius_km });
posthog.capture("signup_completed", { user_type });
posthog.capture("complaint_list_viewed");
```

**Feature flags** — para rollout gradual de features novas:
```ts
const showNewFeature = posthog.isFeatureEnabled("new-marketplace-filter");
```

---

### 4. Error Boundary React

**`src/components/error-boundary.tsx`** — criar componente:
```tsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import { logger } from "@/libs/logger";

interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error("ErrorBoundary", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-lg font-semibold mb-2">Algo deu errado</Text>
          <Pressable onPress={() => this.setState({ hasError: false })}>
            <Text className="text-lime-800">Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
```

Adicionar no root layout e nas telas críticas (complaint creation, market):
```tsx
// src/app/_layout.tsx
<ErrorBoundary>
  {/* conteúdo atual */}
</ErrorBoundary>
```

---

### 5. Remoção de código morto

```bash
npm uninstall @buoy-gg/core @buoy-gg/debug-borders @buoy-gg/env \
  @buoy-gg/events @buoy-gg/highlight-updates @buoy-gg/network \
  @buoy-gg/react-query @buoy-gg/route-events @buoy-gg/storage
```

Nenhum desses pacotes é importado em `src/`. Reduz bundle e elimina deps mortas.

---

## Variáveis de ambiente

Adicionar ao `.env.eas` e `.env` e sincronizar com `npm run sync:env`:

```
EXPO_PUBLIC_POSTHOG_API_KEY=phc_xxxxx
```

Firebase não usa variável pública — as credenciais ficam nos arquivos
`google-services.json` e `GoogleService-Info.plist` (gitignored).

---

## Resumo de custos

| Ferramenta | Fase 1 | Fase 2 |
|---|---|---|
| EAS Insights | $0 | $0 |
| Firebase (Crashlytics + Analytics + Perf) | $0 | $0 |
| PostHog | $0 até 1M eventos/mês | ~$5–20/mês |
| Sentry | — | $26/mês (Team) |
| **Total** | **$0/mês** | **~$26–46/mês** |

---

## Impacto no build e OTA

- Firebase requer `expo-dev-client` (já instalado) — sem impacto no fluxo atual
- PostHog usa `expo-file-system` e `expo-device` (já disponíveis via Expo SDK)
- Nenhuma ferramenta da Fase 1 quebra OTA updates via EAS Update
- **Sentry (Fase 2)** exige upload de source maps após cada `eas update`:
  ```bash
  npx sentry-expo-upload-sourcemaps dist
  ```
  Deve ser adicionado ao script de CI/CD para não perder rastreabilidade de crashes.

---

## Verificação

1. **Crashlytics:** forçar `throw new Error("test")` → Firebase Console → Crashlytics em <5 min
2. **Analytics:** `analytics().logEvent("test_event")` → Firebase DebugView em tempo real
3. **PostHog:** `posthog.capture("test")` → PostHog Live Events
4. **EAS Insights:** cold start do app → expo.dev → Insights após 24h
5. **Error Boundary:** renderizar componente que lança → exibe fallback sem crash nativo
