# Tech Plan — Correção da rejeição da Apple (Epic 5)

## Abordagem Arquitetural

**Decisão central:** o bug é cirúrgico, não estrutural. Levantamento nos 8
consumidores de `useGeospatial()` + `wrapper-map.tsx` mostrou que todo o código
já tolera `location`/`addresses`/`heading` nulos de forma graciosa
(`wrapper-map` tem gate + fallback próprios; `camera-geospatial-overlay` mostra
"indisponível"; `market-list-header` trata endereço nulo). O único elemento que
efetivamente quebra o app inteiro é o `<Modal>` bloqueante renderizado dentro de
`GeospatialProvider` (`src/contexts/geospatial-context.tsx:202-224`), acima do
`Stack` raiz — ele intercepta toques em qualquer tela, inclusive as que não
usam localização.

- **Sem redesign de provider/contexto.** `GeospatialProvider` continua único,
  montado no root layout, expondo a mesma forma de `GeospatialContextValue`.
  Nenhum consumidor muda sua interface de leitura do contexto.
- **Remover o `<Modal>` bloqueante do `GeospatialProvider`.** Ele deixa de
  existir como bloqueio global; `permissionDenied` continua exposto no
  contexto para quem já lida com ele localmente (hoje só `wrapper-map` tem gate
  próprio, mas outros consumidores podem passar a checar se fizer sentido).
- **Isolar a falha de bússola da falha de permissão.** Hoje
  `Location.watchHeadingAsync` roda dentro do mesmo `try` que
  `watchPositionAsync` e a permissão — se falhar (ex: iPad sem magnetômetro),
  cai no mesmo `catch` que marca `permissionDenied = true`, mesmo com a
  localização de fato concedida e funcional. Isolar `watchHeadingAsync` em seu
  próprio `try/catch` evita esse falso positivo — heading simplesmente continua
  `null` (já tratado com fallback em todo lugar que o consome), sem afetar
  `location`/`permissionDenied`.
- **Fechar o gap do market:** hoje o `ListEmptyComponent` de
  `market/index.tsx` só trata "fonte = perfil sem endereço"; quando a fonte é
  "localização atual" e a permissão é negada, a query nunca é `enabled` e a
  tela fica presa no skeleton de loading indefinidamente. Estender a mesma
  condição de empty-state para cobrir esse caso.
- **Sem aviso global adicional.** Decisão explícita: nenhum banner/toast novo
  no nível do app. Cada feature que precisa de localização já sinaliza (ou
  passa a sinalizar, no caso do market) dentro do próprio fluxo.
- **Restrição:** mudança deve ser comportamentalmente idêntica quando a
  permissão é concedida — nenhuma regressão nos fluxos que hoje dependem de
  localização (market, criação de denúncia, overlay da câmera).

## Modelo de Dados

Sem mudanças. É uma correção inteiramente client-side de UI/estado React —
nenhuma entidade nova, nenhuma alteração de schema de banco, nenhum campo novo
em `GeospatialContextValue` (o isolamento do erro de bússola é uma mudança de
controle de fluxo interna ao provider, não de forma dos dados expostos).

## Arquitetura de Componentes

- **`src/contexts/geospatial-context.tsx`**
  - Remove o bloco `<Modal isOpen={permissionDenied} ...>` do JSX retornado
    pelo provider. `GeospatialContext.Provider` passa a retornar só
    `{children}`.
  - Dentro de `startWatchers()`: separa a chamada a
    `Location.watchHeadingAsync` em seu próprio `try/catch` (falha ali não
    deve alterar `permissionDenied` nem interromper `watchPositionAsync`).
  - Interface pública (`useGeospatial()` e `GeospatialContextValue`) inalterada
    — nenhum consumidor existente precisa mudar imports ou tipos.

- **`src/app/_layout.tsx`**
  - Nenhuma mudança estrutural. `GeospatialProvider` continua no mesmo ponto
    da árvore; só deixa de produzir o overlay bloqueante.

- **`src/app/(tabs)/market/index.tsx`**
  - Amplia a condição do `ListEmptyComponent` (hoje
    `!isLocationReady && locationSource === "profile"`) para também cobrir
    `!isLocationReady && locationSource === "current" && permissionDenied`
    (lido via `useGeospatial()`), com uma mensagem equivalente orientando o
    usuário (ex: trocar para endereço do perfil ou habilitar localização).
    Reaproveita o mesmo slot de UI já existente — não é um componente novo.

- **Consumidores não tocados** (permanecem exatamente como estão, já são
  null-safe): `wrapper-map.tsx`, `camera-geospatial-overlay.tsx`,
  `market-list-header.tsx`, `market-context.tsx`, `complaint-bottom-sheet`,
  `location-source-bottom-sheet.tsx`, `complaints/(create)/index.tsx`,
  `complaints/index.tsx`, `market/[companyId].tsx`.

- **Ponto de integração/validação:** nenhum backend envolvido. A verificação
  fica a cargo de build + teste manual em iPad (simulador ou device) com
  Location Services desligado, cobrindo exatamente o cenário do review da
  Apple — tratado nos tickets, não neste tech plan.
