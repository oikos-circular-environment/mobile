# Epic Brief — Estabilidade de mapa e geolocalização (Market + Complaints)

## Resumo

Três bugs distintos, todos ligados ao mapa e à geolocalização, agrupados nesta
branch porque compartilham a mesma origem (a camada de localização em tempo real)
e as mesmas telas. São independentes entre si e podem ser revisados como commits
separados, mas convivem no mesmo epic/branch (`fix/map-geo-stability`):

1. **Ícone do norte "escapa" do botão** no mapa de Complaints ao girar a câmera.
2. **Refetch por drift de GPS no mapa de Complaints** — a tela recarrega várias
   vezes por minuto sem necessidade.
3. **Refetch por drift de GPS no Market + reset de navegação em `[companyId]`** —
   a lista recarrega sozinha e, dentro do detalhe da empresa, a navegação "volta
   ao início" (a empresa some da tela).

## Contexto & Problema

### Bug 1 — ícone do norte
Em `src/app/(tabs)/complaints/index.tsx` (linhas ~364-378) o botão de bússola
monitora o `heading` absoluto da câmera (`handleRegionChangeComplete` →
`setMapHeading`) e rotaciona o ícone `Navigation2Icon` para apontar o norte. O
`transform: [{ rotate }]` está aplicado **direto no ícone**, que é um `<Svg>` do
`react-native-svg` (v15.15.4, New Architecture). O svg interpreta `transform` como
transform SVG (origem no canto `0,0`) em vez de transform de layout (origem no
centro) — então, em vez de girar no lugar, o ícone gira em torno do canto e sai do
container 44×44 do botão.

### Bugs 2 e 3 — refetch por drift de GPS (causa-raiz comum)
`GeospatialProvider` (`src/contexts/geospatial-context.tsx`) usa
`Location.watchPositionAsync({ timeInterval: 2000, distanceInterval: 2 })` e chama
`setLocation(nextLocation)` a cada atualização. As query keys de duas telas embutem
`lat`/`lon` como **floats crus** dessa localização:

- Complaints: `useComplaintsMap` (`src/components/complaints/hooks/use-complaints-map.ts`)
  → `queryKey: ["complaints", "map", lat, lon, ...]`.
- Market: `MarketProvider` (`src/contexts/market-context.tsx`) → `useInfiniteQuery`
  com `queryKey: ["market", lat, lon, appliedFilters]`.

Qualquer jitter de GPS (comum mesmo com o device parado) muda o float → nova query
key → nova query → refetch. No Market o efeito é pior: como não há
`placeholderData`, a key nova zera `data`, `companies` vira `[]`, e
`getCompanyById(companyId)` passa a retornar `undefined` no
`src/app/(tabs)/market/[companyId].tsx` → o detalhe cai para estado de
loading/vazio, o que o usuário percebe como "a navegação voltou ao início".

### Agravante compartilhado — re-render por segundo (`currentDate`)
O `GeospatialContext` mantém um `currentDate` atualizado por `setInterval` de **1s**
dentro do mesmo `value` do contexto. Como o React Context re-renderiza **todos** os
consumidores quando o `value` muda, cada consumidor de `useGeospatial()` (Market,
Complaints, Home) re-renderiza uma vez por segundo.

Investigação dos consumidores de `currentDate`:
- `src/components/camera/camera-geospatial-overlay.tsx` — único que precisa de
  precisão de segundos (`HH:mm:ss`), **mas é código morto**: exportado no barrel
  como `Camera.GeospatialOverlay` (`src/components/camera/index.tsx`) e **nunca
  renderizado** (o `camera.tsx` não o usa; não há nenhum outro uso de
  `GeospatialOverlay` fora do barrel).
- `src/app/(tabs)/market/index.tsx` e `src/app/(tabs)/market/[companyId].tsx` —
  usam apenas para `isCompanyOpenNow` (badge aberto/fechado), onde precisão de
  **minuto** é suficiente.

## Objetivo / Resultado esperado

- Ícone do norte gira centrado dentro do botão, sem escapar.
- Mapa de Complaints e lista/detalhe de Market deixam de recarregar por jitter de
  GPS; o detalhe da empresa não "reseta" mais.
- Fim do re-render por segundo: remover o overlay morto e o ticker de 1s; o Market
  passa a usar uma fonte de data leve (tick de 60s).

## Fora de escopo

- Redesenhar a UX do mapa, filtros ou paginação.
- Mudar a estrutura de tabs/navegação.
- Reintroduzir o overlay geoespacial da câmera (está sendo removido por ser morto).

## Impacto

- **Usuário**: navegação estável no Market (não perde a empresa aberta), mapa de
  Complaints sem "piscadas", bússola correta.
- **Performance**: elimina refetch redundante e re-render por segundo nas telas de
  geolocalização.
