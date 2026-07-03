# Review: Dados de sessão anterior persistem entre logins

## Contexto

Ao fazer login com um usuário diferente (sem fechar o app), dados do usuário anterior continuam visíveis. O `signOut` (`auth-context.tsx:242`) e o callback `onUnauthenticated` (`auth-context.tsx:253`) só limpam tokens e estado do `AuthContext`, mas **não limpam**:

| Camada | Dados que persistem | Risco |
|--------|---------------------|-------|
| TanStack Query cache | Perfil `["user","profile"]`, complaints, market, empresas | **Alto** |
| Zustand `complaints-store` | `complaints`, `dashboard`, `userVotes`, `selectedMapComplaint`, `resolutionDraft` | **Alto** |
| Zustand `companies-store` | `companies` do usuário | **Alto** |
| `ComplaintCreationContext` | `attachments`, `editingComplaint` (tab layout fica montada) | **Médio** |

---

## Alternativas analisadas

### A. Key-based remount
Wrapper com `key={sessionId}` que força remount de toda a árvore React abaixo do `QueryClientProvider`.

- **Prós**: Contextos novos são limpos automaticamente (zero esforço)
- **Contras**: Flash visual na tela, re-inicializa `GeospatialProvider` (GPS watchers destruídos e recriados), **não reseta Zustand** (vive fora do React tree — precisa de reset manual mesmo assim)

### B. Session Bus (Event Emitter)
Módulo `session-bus.ts` (~15 linhas). `signOut` emite evento. Cada store/context/queryClient se inscreve para limpar seus dados.

- **Prós**: Cobre todas as 3 camadas (Query, Zustand, Context) com padrão único, zero impacto visual, desacoplamento total do auth, já existe padrão similar no codebase (`setOnUnauthenticated`)
- **Contras**: Dev pode esquecer de inscrever novo state (mitigável com nota no CLAUDE.md)

### C. Zustand Reset Registry
Registry que stores chamam `registerResettable(store, initialState)`. Logout chama `resetAll()`.

- **Prós**: Ergonômico para Zustand (1 linha por store)
- **Contras**: Incompleto — **não cobre** React Contexts nem TanStack Query. Precisa de segundo mecanismo, resultando em dois padrões para o mesmo problema.

### D. useSessionReset Hook
Hook que observa `isAuthenticated` e chama `resetFn` na transição `true → false`.

- **Prós**: Simples (~10 linhas), funciona bem para Contexts
- **Contras**: **Não funciona para Zustand** (hooks só rodam dentro do React tree). Timing depende do render cycle — pode ter 1 frame com dado stale.

---

## Abordagem recomendada: B (Session Bus)

Única que cobre todas as camadas com um padrão uniforme, sem impacto visual e com desacoplamento total.

### Implementação

#### 1. Criar `src/libs/session-bus.ts`

```ts
type Listener = () => void;

const listeners = new Set<Listener>();

export const sessionBus = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  emit() {
    for (const fn of listeners) fn();
  },
};
```

#### 2. Emitir evento no `signOut` e `onUnauthenticated`

**Arquivo**: `src/contexts/auth-context.tsx`

```ts
import { sessionBus } from "@/libs/session-bus";

// signOut (linha 242):
const signOut = useCallback(() => {
  setAuthToken(null);
  setRefreshToken(null);
  setUser(null);
  setAccount(null);
  setIsAuthenticated(false);
  sessionBus.emit();
  router.navigate("/(tabs)/(home)");
  toast.success("Você foi deslogado com sucesso!");
}, [router]);

// onUnauthenticated (linha 253):
setOnUnauthenticated(() => {
  setUser(null);
  setIsAuthenticated(false);
  sessionBus.emit();
  toast.info("Sessão expirada", "Faça o login novamente.");
  router.push("/sign-in");
});
```

#### 3. Inscrever `queryClient.clear()` no bus

**Arquivo**: `src/app/_layout.tsx`

Exportar o `queryClient` e inscrever o `clear()` no bus a nível de módulo:

```ts
import { sessionBus } from "@/libs/session-bus";

export const queryClient = new QueryClient();
sessionBus.subscribe(() => queryClient.clear());
```

#### 4. Inscrever Zustand stores (nível de módulo)

**Arquivo**: `src/stores/complaints-store.ts`

Extrair estado inicial para constante e inscrever:

```ts
import { sessionBus } from "@/libs/session-bus";

const INITIAL_STATE: ListState & MapVotesState & MapSelectionState & ResolutionDraftState = {
  complaints: [],
  dashboard: undefined,
  nextCursor: undefined,
  hasNextPage: false,
  activeFilter: null,
  userVotes: {},
  selectedMapComplaint: null,
  resolutionDraft: null,
};

// após o create:
sessionBus.subscribe(() => useComplaintsStore.setState(INITIAL_STATE));
```

**Arquivo**: `src/stores/companies-store.ts`

```ts
import { sessionBus } from "@/libs/session-bus";

const INITIAL_STATE: CompaniesState = {
  companies: [],
  isLoaded: false,
};

// após o create:
sessionBus.subscribe(() => useCompaniesStore.setState(INITIAL_STATE));
```

#### 5. Inscrever React Contexts com `useEffect`

**Arquivo**: `src/contexts/complaint-creation-context.tsx`

```ts
import { sessionBus } from "@/libs/session-bus";

// dentro de ComplaintCreationProvider:
useEffect(() => {
  return sessionBus.subscribe(() => {
    setAttachments([]);
    setEditingComplaint(null);
  });
}, []);
```

#### 6. Atualizar CLAUDE.md

Adicionar nota sobre o padrão de session reset para que novos stores/contexts sigam a convenção.

---

## Verificação

1. Login com Usuário A → navegar por complaints, market, empresas
2. Logout
3. Verificar que nenhum dado aparece nas telas (complaints vazio, market sem cache)
4. Login com Usuário B → confirmar que só dados do B aparecem
5. Forçar expiração de token (401) → verificar que cleanup acontece igual
