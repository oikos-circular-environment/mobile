# Epic Brief — Estruturação de tratamento de erros JS

## Resumo

Continuação direta do ticket #217 (bump Expo SDK 56→57 + `Observe.reportError` em 4 pontos
pontuais: `camera.tsx`, `error-boundary.tsx`, `outbox.ts`, `lifecycle.ts`). Hoje o app tem um
único `ErrorBoundary` no root que derruba a árvore inteira em qualquer erro de render, e a
maioria dos ~42 blocos `catch` escritos à mão no app descarta a exceção silenciosamente, sem
log nem report. Este epic estrutura o tratamento de erro JS em duas frentes: granularidade de
error boundary via Expo Router (boundary por tab + boundary local em telas de risco, com uma
tela de erro com identidade visual própria) e um relatório de auditoria dos pontos sem
try/catch ou com catch silencioso, para decidir onde adicionar `Observe.reportError`.

Mesma branch do #217 (`217-upgrade-expo-57-observe-errors`).

## Contexto & Problema

### 1. Boundary único no root = blast radius total (`src/app/_layout.tsx:137`, `src/components/error-boundary.tsx`)
Qualquer erro de render em qualquer tela substitui a árvore inteira do app pela tela de
fallback genérica (`error-boundary.tsx:36-51`: "Algo deu errado" / botão "Tentar
novamente"). Um erro isolado numa aba (ex. mapa em `complaints`) derruba `market`, `(home)`
etc também — usuário perde toda a navegação, não só a tela que quebrou.

### 2. Fallback UI é a mesma para qualquer erro, sem identidade visual do app (`error-boundary.tsx:36-51`)
Usa `Heading`/`Text`/`Button` crus do gluestack, sem ilustração e sem diferenciar contexto —
erro de rede, erro de render e erro de câmera mostram a mesma tela genérica.

### 3. Maioria dos catch blocks do app é silenciosa (evidência: `grep -rn "} catch" src --include="*.ts" --include="*.tsx"`, excluindo `src/tests/`)
46 blocos `catch` no total. 4 são código gerado (`src/libs/brasil-api-sdk/**/*.gen.ts`),
fora de escopo. Dos ~42 restantes escritos à mão, a maioria usa `catch {` sem variável de
erro — descarta a exceção sem log nem report. Cruzando com as comunidades do grafo
(`graphify query`), dá pra agrupar por área em vez de lista solta por arquivo:
- **Survey** (community `getSurveyDb`): `outbox.ts:307`, `restore-session.ts:95,129,153`,
  `synthetic-participant.ts:56`, `survey-migrations-runner.tsx`,
  `delete-survey-data-sheet.tsx:70`.
- **Geoespacial/mapas** (community `useAuthContext`, que agrupa `geospatial-context.tsx`
  junto com auth/market por import): `geospatial-context.tsx:101,135,142`,
  `google/geocode-address.ts:23`, `google/reverse-geocode.ts:55`.
- **Complaints/denúncia** (communities `(create)/index.tsx`, `complaint.ts`, `cn`):
  `resolution.tsx:120,129,334`, `(create)/index.tsx:298,340`,
  `use-create-denunciation.ts:64`, `complaint-details-header.tsx:114`,
  `use-complaint-card.ts:38,46`.
- **Suporte** (mesma família de `(create)/index.tsx`): `use-create-support-request.ts:64`.
- **Perfil/empresa** (community `useAuthContext`): `profile.tsx:326,366`,
  `companies/[companyId]/address.tsx:137`, `companies/[companyId]/company.tsx:722`,
  `companies/[companyId]/services/form.tsx:124`.
- **Mídia/câmera** (community `(create)/camera.tsx`): `media-compression.ts:29,46,61`,
  `media-thumbnail.tsx:96`, `media-validation.ts:30`.

Só 4 pontos usam `Observe.reportError` hoje (adicionados no #217). Sem auditoria, não
sabemos quais desses catches são legitimamente descartáveis (ex. fallback silencioso
aceitável de geocoding) e quais escondem falha real que deveria aparecer no Observe.

### 4. Nenhum uso hoje do modelo de boundary por rota/layout do Expo Router
`unstable_settings.screenErrorBoundary` (mantém tab bar/header montados quando uma screen
quebra — https://docs.expo.dev/router/error-handling/#error-boundaries-for-screens-in-a-layout)
e `export function ErrorBoundary` por rota não são usados em nenhum `_layout.tsx` ou tela do
app hoje — só o boundary manual de root.

## Objetivo / Resultado esperado

- Erro de render numa tab não derruba as outras: `_layout.tsx` de cada tab ativa (`market`,
  `(home)`, `complaints`) usa `unstable_settings.screenErrorBoundary`; tab bar continua
  navegável quando uma screen quebra.
- Telas de risco alto identificadas (câmera de denúncia, mapa) têm `ErrorBoundary` local via
  export de rota, com fallback e retry específicos do fluxo.
- Componente de erro com identidade visual do app (design system gluestack + `lime-800`
  existente, sem paleta nova), reutilizável entre o boundary de root, os de tab e os de rota
  — substitui a UI genérica atual de `error-boundary.tsx`.
- Relatório de auditoria (tabela file:line), organizado pelas áreas mapeadas acima via
  `graphify query`/`graphify explain` (survey, geoespacial, complaints, suporte,
  perfil/empresa, mídia/câmera), cobrindo os ~42 catch blocks escritos à mão e os pontos de
  chamada de rede/storage/mídia sem try/catch nenhum, cada um classificado: silencioso-ok,
  precisa `Observe.reportError` (https://docs.expo.dev/eas/observe/errors/#handled-errors),
  ou precisa virar erro visível para o usuário.
- Ticket de execução aplicando as classificações do relatório.

## Fora de escopo

- Crash reporting nativo (Sentry/Crashlytics) — decisão adiada desde #204, não muda aqui.
- Ferramenta/tela de dev em runtime para visualizar erros ao vivo — definido que o
  mapeamento é relatório estático, não tooling novo.
- Tabs desabilitadas na UI (`donations`, `learn`) — não entram na granularidade por tab
  agora, só as 3 ativas.
- Redesenho do design system em si — a tela de erro nova usa componentes/tokens gluestack já
  existentes.

## Impacto

- **Usuário**: erro deixa de derrubar o app inteiro; fica contido na tab/tela onde ocorreu,
  com uma tela de erro mais clara e consistente com a identidade visual do app.
- **Observabilidade**: mais cobertura de `Observe.reportError` nos pontos que hoje falham
  silenciosamente, além dos 4 já cobertos pelo #217.
- **Risco de regressão**: baixo — é aditivo (novos boundaries, novos reports), não muda
  lógica de negócio existente nos catches revisados além de adicionar o report.
