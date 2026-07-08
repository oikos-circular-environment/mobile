# Tech Plan — EAS Observe (Epic 2)

## Abordagem Arquitetural

O projeto está no Expo SDK 56 (Epic 1 concluído), então usamos a API mais nova
do `expo-observe`: `ObserveRoot` (não `AppMetricsRoot`) e `useObserve()` (não o
global `AppMetrics.markInteractive()`).

**Decisões-chave:**

1. **Três camadas de instrumentação, cada uma automática ao máximo:**
   - App-wide (root): `ObserveRoot.wrap` + `markInteractive()` uma vez —
     cobre cold/warm launch, bundle load, TTR/TTI globais sem código extra por
     tela.
   - Por rota: integração `expo-router` (`Observe.configure({ integrations:
     { 'expo-router': true } })`) + `markInteractive()` chamado nas ~15 telas
     de `profile`, `companies`, `market` e `complaints` — responde "qual tela
     está lenta", não só "o app está lento".
   - Eventos de produto: `Observe.logEvent` disparado no `onSuccess`/`onError`
     das mutations React Query já existentes (não no `onPress`) — captura o
     resultado real (sucesso/falha, duração, IDs), não só a intenção de clique.

2. **Módulo central `observe-events.ts` como único ponto de contato com o
   expo-observe para eventos customizados.** Em vez de espalhar
   `Observe.logEvent` em ~15 call sites, cada domínio expõe funções tipadas
   próprias. Garante nomenclatura consistente (`dominio.acao`, lowercase,
   dot-separated) e é o único lugar a auditar contra vazamento de PII —
   trade-off de uma pequena camada de indireção em troca de consistência.

3. **Error Boundary único, na raiz.** Um boundary básico (React
   `componentDidCatch`) envolvendo o app inteiro dentro do `ObserveRoot`,
   reportando via o mesmo `observe-events.ts` (severity `fatal`). Escopo
   básico por decisão do epic-brief: uma falha em qualquer tela reseta a tela
   de fallback do app inteiro, não só o widget que quebrou — boundaries por
   feature ficam para uma iteração futura, se a telemetria mostrar necessidade.

4. **Sem mudança de infraestrutura de dados.** Toda a persistência/batching de
   métricas e eventos é interna ao SDK `expo-observe` (dispatch como OTel log
   records para a EAS) — nenhuma tabela, endpoint ou mudança em
   `src/libs/oikos-sdk` é necessária.

**Restrições:**
- Builds de debug não despacham métricas por padrão — validação real só em
  build de produção/preview, não em `expo start`.
- `Observe.configure({ integrations: {...} })` deve rodar em module scope,
  antes de qualquer tela montar — não pode ser chamado condicionalmente depois.
- `markInteractive()` só registra a primeira chamada por sessão — telas que
  são pontos de entrada via deep link (`sign-in`, detalhe de empresa/denúncia)
  precisam da própria chamada, não só a do root.

## Modelo de Dados

Sem novas entidades de backend nem mudança de schema — é telemetria
client-side pura. O "modelo de dados" aqui é a **taxonomia de eventos
customizados**, que `observe-events.ts` fixa como contrato:

| Domínio | Eventos | Atributos típicos |
|---|---|---|
| `profile` | `profile.updated`, `profile.avatar_updated` | `success`, `durationMs` |
| `company` | `company.created`, `company.updated`, `company.address_updated`, `company.hours_updated`, `company.service_saved`, `company.waste_saved` | `success`, `companyId`, `durationMs` |
| `market` | `market.filter_applied`, `market.location_source_changed` | `radius`, `category`, `hasQuery`, `source` |
| `complaint` | `complaint.created`, `complaint.updated`, `complaint.voted`, `complaint.resolved` (também cobre exclusão de resolução via `action: "deleted"`), `complaint.cancelled` | `success`, `hasPhoto`, `hasVideo`, `voteType`, `action` |
| `app` (erros) | `app.error_boundary_triggered` | `route`, `message`, `severity` |

Regra fixa em todos: só `string \| number \| boolean` nos atributos — nenhum
identificador de PII (nome, e-mail, CPF, endereço completo); `companyId`/
`complaintId` são UUIDs internos, não dado pessoal.

## Arquitetura de Componentes

- **`src/app/_layout.tsx`**
  - Exporta o root component via `ObserveRoot.wrap(RootLayout)`.
  - `Observe.configure({ integrations: { 'expo-router': true } })` em module
    scope, junto aos outros side-effects de import já existentes no arquivo
    (ex: `@/libs/api/oikos-api`).
  - `markInteractive()` (via `useObserve()`) chamado no `useEffect` que já
    esconde a splash screen (`loaded || error`) — mesmo ponto de "app pronto".

- **`src/components/error-boundary.tsx`** (novo)
  - Boundary de classe React padrão (`getDerivedStateFromError` +
    `componentDidCatch`), com fallback simples (mensagem + retry).
  - `componentDidCatch` chama `observe-events.ts` (evento
    `app.error_boundary_triggered`, severity `fatal`).
  - Envolve o conteúdo do `RootLayout`, dentro do `ObserveRoot.wrap`.

- **`src/libs/observe-events.ts`** (novo)
  - Único import de `Observe` do pacote `expo-observe` no projeto (fora do
    root layout, que só usa `ObserveRoot`/`configure`).
  - Expõe uma função por domínio (`logProfileEvent`, `logCompanyEvent`,
    `logMarketEvent`, `logComplaintEvent`, `logAppEvent`), cada uma com union
    type dos nomes de evento da tabela acima e atributos tipados.

- **`src/libs/use-route-interactive.ts`** (novo)
  - Hook fino sobre `useObserve()`, chamando `markInteractive()` num
    `useEffect`. Aceita um parâmetro opcional `ready` (default `true`) para
    telas que têm carregamento assíncrono antes de estarem realmente
    interativas.
  - Consumido pelas ~15 telas de `profile`, `sign-in`, `sign-up`, `companies`
    (index + subpáginas de `[companyId]`), `market` (index + `[companyId]`),
    `complaints` (index, list, create, resolution).

- **Pontos de integração (sem mudança de interface, só callback adicional):**
  `profile.tsx` (`profileMutation`, `profileAvatarMutation`),
  `companies/[companyId]/*.tsx` (mutations de company/address/hours/
  services/waste), `market-context.tsx` (`setAppliedFilters`,
  `setLocationSource`), `use-submit-complaints.ts`, `use-edit-complaint.ts`,
  `complaint-vote.tsx`, `resolution.tsx`, `complaint-bottom-sheet` (delete/
  cancel) — cada um passa a chamar a função correspondente de
  `observe-events.ts` no `onSuccess`/`onError` já existente da mutation.

- **Sem mudanças em `src/libs/oikos-sdk`** (SDK gerado da API) nem no backend.
