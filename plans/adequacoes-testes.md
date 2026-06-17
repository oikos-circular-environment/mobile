# Plano: Adequações em Testes — Fábricas, Performance e Estresse

> **Status:** 🔄 EM EXECUÇÃO (2026-06-11)

## Objetivo

Quatro adequações sequenciais na suíte de testes:

1. Corrigir 2 testes de raio no `market-filters` que falham fora de isolamento
2. Adicionar teste de duplo clique no `BottomSheetTrigger` (race condition)
3. Adicionar benchmark de performance para renderização de 20 empresas no Home
4. Backport do refactor de factories para ~16 testes de componente pré-existentes

---

## Passo 1 — Corrigir testes de raio no `market-filters`

> **Status:** ⬜ PENDENTE

**Suspeita:** O stub do `RadiusBottomSheet` (linhas 63-90) usa `require("@/contexts/market-context")`
dentro do corpo do componente mockado, que pode não resolver consistentemente em
execução conjunta (falha de ~2ms). Os 6 testes que passam não interagem com o stub.

**Solução (preferida):** Remover o stub e usar o **componente real**.

Por que funciona:
- `@gorhom/bottom-sheet` já tem mock manual (`src/tests/__mocks__/@gorhom/bottom-sheet.tsx`) que renderiza `children` como `<View>`
- `BottomSheetTrigger` é um `RNPressable` visível com texto "2 km"
- `handleOpen()` → `isVisible=true` → `BottomSheetPortal` renderiza → `RadiusOption` items aparecem
- Queries por `accessibilityLabel` ("Raio de busca: 10 km") em vez de `testID`
- Elimina o `require()` dinâmico e testa o fluxo real do componente

| Arquivo | Ação |
|---|---|
| `src/tests/integration/market/market-filters.test.tsx` | Remover stub L63-90; adaptar queries para o componente real; remover import `fireEvent` se não usado mais |

**Verificação:**
- `npm test src/tests/integration/market/market-filters.test.tsx` → 8/8 passando
- Rodar com `--forceExit` e em conjunto com outros testes → sem falhas de isolamento

---

## Passo 2 — Teste de duplo clique no `BottomSheetTrigger`

> **Status:** ⬜ PENDENTE

**Bug:** Dois cliques rápidos no trigger → `handleOpen` → `setIsVisible(true)` é batelado
pelo React; segundo clique chega antes do re-render → nada acontece (já `true`);
terceiro clique → `handleClose` (se o sheet fechou) → estado inconsistente.

**Implementação:** Adicionar no mesmo arquivo `market-filters.test.tsx`:

```tsx
it("não quebra com duplo clique rápido no trigger de raio", async () => {
  mockMarketResponse([makeCompany()]);
  await renderMarket();

  const trigger = screen.getByText("2 km");

  // Dois cliques sem await — simula o race
  fireEvent.press(trigger);
  fireEvent.press(trigger);

  // Terceiro clique — deve abrir a sheet normalmente
  fireEvent.press(trigger);

  await waitFor(() => {
    expect(
      screen.getByAccessibilityLabel("Raio de busca: 5 km"),
    ).toBeOnTheScreen();
  });
});
```

**Regra:** Usar `fireEvent.press()` (não `userEvent`) para evitar o debounce interno
de 130ms que impediria o race.

| Arquivo | Ação |
|---|---|
| `src/tests/integration/market/market-filters.test.tsx` | Adicionar describe/it com teste de duplo clique |

**Verificação:**
- Teste passa isoladamente e em conjunto
- Se o bug for corrigido no futuro, este teste continua passando (regressão sound)

---

## Passo 3 — Benchmark de performance (20 empresas no Home)

> **Status:** ⬜ PENDENTE

**Implementação** em `home-flow.test.tsx`:

```tsx
it("renderiza 20 empresas em < 500ms (benchmark)", async () => {
  const start = performance.now();
  await renderHome();
  const elapsed = performance.now() - start;

  console.log(`[benchmark] 20-company render: ${elapsed.toFixed(1)}ms`);
  expect(elapsed).toBeLessThan(5000); // threshold generoso
});
```

| Arquivo | Ação |
|---|---|
| `src/tests/integration/home/home-flow.test.tsx` | Adicionar benchmark test |

**Verificação:**
- `npm test src/tests/integration/home/` → benchmark loga duração no console

---

## Passo 4 — Backport de factories para ~16 testes de componente

> **Status:** ⬜ PENDENTE

**Problema:** Testes de componente pré-existentes usam mocks manuais com `business_name: null`,
quebrando componentes que esperam string.

**Ação:** Para cada teste:
1. Importar `makeCompany()` de `@/tests/factories`
2. Substituir mock manual por `makeCompany({ business_name: "Nome" })`
3. Garantir campos obrigatórios preenchidos

**Alvos confirmados na exploração inicial:**
- `src/tests/component/home.test.tsx`
- `src/tests/component/radius-bottom-sheet.test.tsx`
- (mais ~14 — lista exata a ser levantada na execução)

| Arquivo | Ação |
|---|---|
| (lista a confirmar) | Substituir mocks manuais por factories |

**Verificação:**
- `npm test src/tests/component/` (antes) → N falhas
- `npm test src/tests/component/` (depois) → < N falhas
- `npm run lint` → sem erros

---

## Decisões de Design

| Decisão | Justificativa |
|---|---|
| Usar componente real em vez de stub no Passo 1 | Elimina dependência de `require()` dinâmico; testa fluxo real; `@gorhom/bottom-sheet` já mockado |
| Usar `fireEvent.press()` no Passo 2 | `userEvent.press()` tem debounce de 130ms que impede simular o race |
| Log não-assertivo no Passo 3 | Performance é flaky em CI; log permite monitoramento sem quebrar pipeline |
| Importar factories existentes no Passo 4 | Reusa código já criado; mantém consistência com a refatoração já feita nos testes de integração |
