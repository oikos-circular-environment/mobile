# Ticket Breakdown — Epic 7: Estabilidade de mapa e geolocalização

```mermaid
graph LR
    T1[Ticket 1: Groundwork - roundCoord + remover overlay morto + ClockProvider] --> T3[Ticket 3: Refetch Complaints]
    T1 --> T4[Ticket 4: Refetch Market + reset navegacao]
    T2[Ticket 2: Icone do norte - independente]
```

Cada item de escopo é uma checkbox: `[x]` feito, `[ ]` pendente. Ao retomar o
trabalho, este arquivo é a fonte de verdade de onde paramos.

Branch: `fix/map-geo-stability` (criada a partir de `origin/development`). Todos os
tickets vivem nesta mesma branch, um commit por ticket.

---

## Ticket 1 — Groundwork: coordenadas estáveis + remover overlay morto + ClockProvider

**Status:** ✅ Concluído.

**Escopo:**
- [x] Criar `src/libs/geospatial/round-coord.ts`:
  ```ts
  export const roundCoord = (value: number, decimals = 4): number =>
    Math.round(value * 10 ** decimals) / 10 ** decimals;
  ```
  e exportar em `src/libs/geospatial/index.ts` (seguindo o padrão dos `format*`).
- [x] Remover o overlay morto da câmera:
  - Deletar `src/components/camera/camera-geospatial-overlay.tsx`.
  - Remover a entrada `GeospatialOverlay: CameraGeospatialOverlay` e o import
    correspondente em `src/components/camera/index.tsx`.
- [x] `src/contexts/geospatial-context.tsx`: remover `currentDate` do state, do
  objeto `value`, do `type GeospatialContextValue` e das deps do `useMemo`;
  remover o `useEffect`/`setInterval` de 1s. Não tocar em `heading`, `location`,
  `addresses`, `permissionDenied`, `isResolving`, `reverseGeocodeError`.
- [x] Criar `src/contexts/clock-context.tsx` com `ClockProvider` (tick de **60s**
  via `setInterval`, `clearInterval` no cleanup) expondo `useNow(): Date`. Seguir
  o padrão dos contexts existentes (createContext + hook que lança se usado fora
  do provider).
- [x] Montar `ClockProvider` em `src/app/(tabs)/market/_layout.tsx` (junto do
  `MarketProvider` — só o Market consome).

**Fora:** trocar os consumidores de `currentDate` para `useNow` (Ticket... feito
aqui mesmo, ver abaixo) — na prática este ticket já precisa migrar os 2 arquivos do
Market para não quebrar o build:
- [x] `src/app/(tabs)/market/index.tsx`: trocar `currentDate` de `useGeospatial()`
  por `useNow()` do clock-context.
- [x] `src/app/(tabs)/market/[companyId].tsx`: idem.

**Testes:**
- [x] Remover `currentDate` do mock de `useGeospatial` em
  `src/tests/component/market/market-screen.test.tsx`,
  `src/tests/component/market/market-list-header.test.tsx`,
  `src/tests/integration/market/market-filters.test.tsx`,
  `src/tests/component/home/home.test.tsx`,
  `src/tests/integration/home/home-flow.test.tsx`.
- [x] Onde o badge aberto/fechado importa (testes de Market), mockar `useNow` para
  retornar a data fixa que antes vinha de `currentDate`, preservando o determinismo.

**Validação:** `npx tsc --noEmit` limpo (só ruído pré-existente em
`src/components/ui/*`, não relacionado); `npm run lint` limpo (exit 0); `npm test`
verde — 74/74 nas suítes de Market/Home ajustadas. Confirmado via `grep` que
nenhum arquivo importa mais `currentDate` de `useGeospatial`.

**Commit:** `af8a0ec` — "refactor: remove overlay morto da câmera e isola ticker
de data do GeospatialContext".

**Referências de spec:** tech-plan.md → Groundwork (roundCoord, ClockProvider,
remoção do overlay); epic-brief.md → "Agravante compartilhado".

**Dependências:** nenhuma. Pré-requisito dos Tickets 3 e 4 (usam `roundCoord`).

---

## Ticket 2 — Ícone do norte não escapa do botão (Complaints)

**Status:** ✅ Concluído (falta validação manual em device — ver nota).

**Escopo:**
- [x] `src/app/(tabs)/complaints/index.tsx` (linhas ~370-377): mover o
  `transform: [{ rotate: \`${-mapHeading}deg\` }]` do `Navigation2Icon` para um
  `<View>` que o envolve:
  ```jsx
  <View style={{ transform: [{ rotate: `${-mapHeading}deg` }] }}>
    <Navigation2Icon size={20} color={colors.white} strokeWidth={2.2} />
  </View>
  ```
  `View` já está importado. Não alterar `handleResetNorth` nem
  `handleRegionChangeComplete`.

**Validação:** `npx tsc --noEmit` e `npm run lint` limpos. **Manual pendente**
(sem device/simulador neste ambiente): girar a câmera do mapa de Complaints →
o ícone deve girar centrado dentro do botão 44×44, sem escapar; tocar reseta
para o norte. Testar Android (PROVIDER_GOOGLE) e iOS.

**Commit:** `8c9284f` — "fix: corrige ícone de bússola que escapava do botão ao
girar o mapa".

**Referências de spec:** tech-plan.md → "Ícone do norte"; epic-brief.md → Bug 1.

**Dependências:** nenhuma (independente dos demais).

---

## Ticket 3 — Refetch por drift de GPS no mapa de Complaints

**Status:** ✅ Concluído (falta validação manual em device — ver nota).

**Escopo:**
- [x] `src/components/complaints/hooks/use-complaints-map.ts`: arredondar
  `userLocation.lat`/`lon` com `roundCoord` (do Ticket 1) e usar os valores
  arredondados **tanto na `queryKey`** quanto no payload de `getV1ComplaintsMap`
  (mantendo key e dados consistentes).
- [x] Adicionar `placeholderData: keepPreviousData` à `useQuery`
  (`import { keepPreviousData } from "@tanstack/react-query"`).

**Validação:** `npx tsc --noEmit` e `npm run lint` limpos. **Manual pendente**
(sem device/simulador neste ambiente): com o device parado, o mapa não deve
recarregar a cada poucos segundos; ao mover-se de verdade os dados devem
atualizar sem os marcadores piscarem/sumirem.

**Commit:** `2cf490b` — "fix: evita refetch do mapa de denúncias por drift de
GPS".

**Referências de spec:** tech-plan.md → "roundCoord na query key" e
"keepPreviousData"; epic-brief.md → Bugs 2/3.

**Dependências:** Ticket 1 (`roundCoord`).

---

## Ticket 4 — Refetch por drift de GPS no Market + reset de navegação em `[companyId]`

**Status:** ✅ Concluído (falta validação manual em device — ver nota).

**Escopo:**
- [x] `src/contexts/market-context.tsx` (`useInfiniteQuery`, linhas ~110-134):
  arredondar `lat`/`lon` com `roundCoord`, usando os valores arredondados na
  `queryKey: ["market", lat, lon, appliedFilters]` **e** no `queryFn` (payload de
  `getV1Market`).
- [x] Adicionar `placeholderData: keepPreviousData` ao `useInfiniteQuery`.
- [x] Nenhuma mudança adicional em `src/app/(tabs)/market/[companyId].tsx` além da
  já feita no Ticket 1 (`useNow`): com `keepPreviousData`, `companies` não zera na
  troca de key, então `getCompanyById(companyId)` segue retornando a empresa e a
  tela não cai para loading/vazio.

**Validação:** `npx tsc --noEmit` e `npm run lint` limpos; suíte de Market/Home
(74/74) verde. **Manual pendente** (sem device/simulador neste ambiente): com o
device parado, a lista do Market não deve recarregar sozinha; abrir
`market/[companyId]`, aguardar e mover-se levemente — a tela do detalhe deve
permanecer (sem "voltar ao início").

**Commit:** `5ea0a47` — "fix: evita refetch do Market por drift de GPS e reset
de navegação em [companyId]".

**Referências de spec:** tech-plan.md → "roundCoord na query key",
"keepPreviousData" e o mecanismo do reset de navegação; epic-brief.md → Bug 3.

**Dependências:** Ticket 1 (`roundCoord`).

---

## Ordem sugerida de execução

1. **Ticket 1** (Groundwork) — desbloqueia 3 e 4 e resolve o re-render por segundo.
2. **Ticket 2** (ícone do norte) — isolado, pode ir a qualquer momento.
3. **Ticket 3** (refetch Complaints).
4. **Ticket 4** (refetch Market + reset de navegação).

Um commit por ticket, todos na branch `fix/map-geo-stability`; ao final, abrir PR
para `development`.

## Status geral

Todos os 4 tickets implementados e commitados (`af8a0ec`, `8c9284f`, `2cf490b`,
`5ea0a47`). Validado com `tsc --noEmit`, `npm run lint` e `npm test` (74/74) —
sem regressão nas suítes de Market/Home. **Falta apenas validação manual em
device/simulador** (sem device neste ambiente): rotação do ícone de bússola e
ausência de refetch por drift de GPS em Complaints/Market, incluindo permanência
na tela `market/[companyId]`.
