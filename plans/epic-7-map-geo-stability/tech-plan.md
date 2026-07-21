# Tech Plan — Epic 7: Estabilidade de mapa e geolocalização

## Abordagem arquitetural

Quatro frentes, uma delas (Groundwork) é pré-requisito das duas de refetch:

1. **Groundwork** — infra compartilhada:
   - Helper puro `roundCoord` para quantizar coordenadas nas query keys.
   - Remoção do overlay geoespacial morto da câmera e do ticker de 1s do
     `GeospatialContext`.
   - Nova fonte de data leve (`ClockProvider`/`useNow`, tick de 60s) para o Market.
2. **Ícone do norte** — mudança de layout isolada em Complaints (independente).
3. **Refetch Complaints** — usa `roundCoord` + `keepPreviousData` no
   `useComplaintsMap`.
4. **Refetch Market** — usa `roundCoord` + `keepPreviousData` no `MarketProvider`.

### Por que `roundCoord` na query key resolve o refetch
`watchPositionAsync` emite novos objetos de `location` continuamente (jitter de GPS
mesmo parado). Arredondar `lat`/`lon` para 4 casas decimais (~11m) faz coordenadas
"praticamente iguais" colapsarem na **mesma** query key, então o React Query não
dispara refetch. Ao se mover de verdade (> ~11m) a key muda e os dados atualizam —
comportamento desejado. Deve-se arredondar **tanto a key quanto o payload** enviado
ao backend, para que key e dados fiquem consistentes.

### Por que `placeholderData: keepPreviousData`
Quando a key muda de fato (movimento real, troca de filtro), sem `placeholderData` o
React Query zera `data` para a nova key até a resposta chegar. No Market isso faz
`companies` virar `[]` e o `[companyId]` perder a empresa (parece reset de
navegação). Com `keepPreviousData`, os dados anteriores permanecem renderizados
durante o refetch em background. Vale para as duas queries (mapa de Complaints e
lista de Market). Import: `import { keepPreviousData } from "@tanstack/react-query"`
(v5 — projeto usa `^5.100.10`).

### Por que remover o overlay + ticker de 1s
`camera-geospatial-overlay.tsx` é o único consumidor que precisa de precisão de
segundos e é **código morto** (nunca renderizado). Removê-lo elimina a última
justificativa para o ticker de 1s. Sem ele, o `currentDate` só serve ao Market
(aberto/fechado, precisão de minuto). Tirar `currentDate` do `GeospatialContext`
elimina o re-render por segundo de todos os consumidores de `useGeospatial()`.

### Por que um `ClockProvider` de 60s (e não `new Date()` inline)
O Market precisa que o badge aberto/fechado continue correto se o usuário ficar na
tela cruzando o horário de abertura/fechamento, **e** os testes injetam uma data
fixa para determinismo. Um `useNow()` com tick de 60s atende os dois: atualiza no
máximo 1×/min (custo desprezível) e é mockável nos testes. Escopo do provider: só o
Market (`market/_layout.tsx`), já que é o único consumidor.

## Modelo de dados / assinaturas

```ts
// src/libs/geospatial/round-coord.ts
export const roundCoord = (value: number, decimals = 4): number =>
  Math.round(value * 10 ** decimals) / 10 ** decimals;

// src/contexts/clock-context.tsx
export function ClockProvider({ children }: PropsWithChildren): JSX.Element;
export function useNow(): Date; // tick de 60s
```

## Arquitetura de componentes / arquivos

**Novos**
- `src/libs/geospatial/round-coord.ts` — helper puro (exportar também no barrel
  `src/libs/geospatial/index.ts` se houver, seguindo o padrão dos `format*`).
- `src/contexts/clock-context.tsx` — `ClockProvider` + `useNow`.

**Alterados**
- `src/contexts/geospatial-context.tsx` — remover `currentDate` (state, `value`,
  type) e o `setInterval` de 1s.
- `src/components/camera/index.tsx` — remover a entrada `GeospatialOverlay` do
  `Object.assign`.
- `src/app/(tabs)/market/_layout.tsx` — envolver com `ClockProvider`.
- `src/app/(tabs)/market/index.tsx` e `.../market/[companyId].tsx` — trocar
  `currentDate` (de `useGeospatial`) por `useNow()`.
- `src/components/complaints/hooks/use-complaints-map.ts` — `roundCoord` na key +
  payload; `placeholderData: keepPreviousData`.
- `src/contexts/market-context.tsx` — `roundCoord` na key + `queryFn`;
  `placeholderData: keepPreviousData`.
- `src/app/(tabs)/complaints/index.tsx` — envolver `Navigation2Icon` num `<View>`
  com o `transform`.

**Removidos**
- `src/components/camera/camera-geospatial-overlay.tsx`.

**Testes**
- `src/tests/component/market/market-screen.test.tsx`,
  `.../market/market-list-header.test.tsx`,
  `src/tests/integration/market/market-filters.test.tsx` — remover `currentDate`
  do mock de `useGeospatial`; mockar `useNow` (data fixa) onde o aberto/fechado
  importa.
- `src/tests/component/home/home.test.tsx`,
  `src/tests/integration/home/home-flow.test.tsx` — apenas remover `currentDate`
  do mock (Home não usa mais).

## Riscos / atenção

- **react-native-svg + transform**: a correção do ícone deve mover o `transform`
  para um `<View>` (não deixar no `<Svg>`). Confirmar visualmente em Android
  (PROVIDER_GOOGLE) e iOS.
- **Precisão de 4 casas**: se 11m for pouco/muito para o caso de uso, o `decimals`
  é o único ponto de ajuste (helper compartilhado). Manter o mesmo valor nas duas
  telas.
- **Escopo do `ClockProvider`**: se algum consumidor futuro fora do Market precisar
  de `useNow`, subir o provider para `src/app/_layout.tsx`. Por ora, escopo mínimo.
- **Mocks de teste**: garantir que os testes que dependiam de `currentDate` fixo
  para o badge aberto/fechado passem a fixar `useNow`, senão viram flaky.

## Validação

- `npm run lint` (Biome) e `npm test` limpos (ajustar os testes listados).
- Verificação manual em device/simulador: ver `tickets.md` (seção Validação de
  cada ticket) e o epic-brief.
