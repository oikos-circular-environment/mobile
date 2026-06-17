# TanStack Query + RNTL — Padrões de Teste

Guia de referência para testes de componentes e integração que usam `@tanstack/react-query`.

---

## Problema raiz

`useMutation` chamado dentro de `useEffect` dispara trabalho assíncrono no mount. Por padrão, o `notifyManager` do TanStack Query batcha as notificações React via `setTimeout(cb, 0)`. Isso faz com que os state updates das mutations completem **fora** de qualquer escopo `act()`, causando dois problemas simultâneos:

1. **`overlapping act() calls`** — o segundo `act()` do `waitFor` encontra o timer do `notifyManager` ainda pendente do `act()` anterior, corrompendo o estado interno do React e quebrando todos os testes seguintes.
2. **`Jest did not exit`** — o timer de GC do `QueryCache` (`gcTime = 5 min` por padrão) é agendado ao desmontar o componente e mantém o processo Node.js vivo após os testes.

---

## Configuração global (`src/tests/setup.ts`)

```ts
import { notifyManager } from "@tanstack/query-core";

// Torna as notificações do TanStack Query síncronas.
// Sem isso, o notifyManager usa setTimeout(cb, 0) para batchear notificações
// React, causando warnings "overlapping act() calls" que corrompem o estado
// do React entre os testes.
notifyManager.setScheduler(callback => callback());
```

Essa configuração já está aplicada em `setup.ts`.

---

## `createQueryClient` para testes

```ts
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}
```

| Opção | Motivo |
|---|---|
| `retry: false` | Evita retries lentos em cenários de erro |
| `gcTime: 0` | Timer de GC dispara em <1ms após o desmonte, permitindo que o Jest encerre limpo |

---

## Padrão `renderScreen`

Quando o componente usa hooks que disparam mutations no mount via `useEffect` (ex: `useCompanyAddress`), o `await render()` retorna antes das mutations completarem. Use `waitFor` para drenar as mutations dentro de um escopo `act()`:

```ts
let queryClient: QueryClient;

async function renderScreen() {
  queryClient = createQueryClient();
  await render(
    <QueryClientProvider client={queryClient}>
      <ComponenteAlvo />
    </QueryClientProvider>,
  );
  // Drena a mutation que dispara no mount.
  // waitFor mantém o escopo act() aberto até o onSuccess (setState) executar,
  // evitando o warning "overlapping act() calls".
  await waitFor(() => expect(apiMockQueDispara).toHaveBeenCalled());
  // Flush de qualquer trabalho assíncrono restante (ex: mutations em cascata).
  await act(async () => {});
}
```

> Substitua `apiMockQueDispara` pelo mock da função de API que a mutation chama no mount.

---

## `afterEach`

```ts
afterEach(async () => {
  // Flush de trabalho assíncrono antes do auto-cleanup do RNTL desmontar
  // o componente, evitando state updates em componentes já desmontados.
  await act(async () => {});
  queryClient?.clear();
  jest.clearAllMocks();
});
```

O `cleanup()` manual **não** é necessário — o RNTL v14 registra seu próprio `afterEach(cleanup)` automaticamente.

---

## Resumo do fluxo

```
render()
  └─ useEffect → mutation.mutate()
       └─ mutationFn() → apiCall() → Promise resolve (microtask)
            └─ notifyManager.schedule(fn)
                 └─ [sync scheduler] → fn() → setState → re-render
                      └─ [dentro do act() do waitFor] ✓
```

Com `notifyManager.setScheduler(cb => cb())`, todo esse fluxo acontece sincronamente assim que a Promise resolve, garantindo que fique dentro do escopo `act()` correto.
