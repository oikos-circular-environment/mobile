# Epic Brief — Upgrade do gluestack-ui (alpha → v5 estável)

## Resumo

O projeto usa gluestack-ui v5 no modelo "CLI copy-paste": só `@gluestack-ui/core`
e `@gluestack-ui/utils` são dependências npm; os ~28 componentes de UI vivem
como código-fonte vendorizado em `src/components/ui/*`. Hoje essas duas libs
estão em versões alpha (`@gluestack-ui/core@^5.0.0-alpha.0`,
`@gluestack-ui/utils@^5.0.1-alpha.0`), mas já existem versões estáveis reais no
npm (`5.0.15` e `5.0.6` respectivamente — o "5.0.3" visto inicialmente no npm é
o pacote do CLI, não essas libs de motor). Este epic sai do alpha em duas
fases, na sequência definida pelo usuário: **(1) bump das 2 libs → usuário
testa o app e roda `expo prebuild` → (2) atualizar os componentes vendorizados
→ usuário roda um development build completo para validar.**

## Contexto & Problema

- **Por que sair do alpha**: reduzir risco de instabilidade/breaking changes
  não documentados de uma versão pre-release usada em produção.
- **27 erros de TypeScript pré-existentes**, todos em `src/components/ui/*`.
  Cerca de 8 parecem bugs de tooling da própria versão alpha (candidatos a
  sumir só com o bump); os demais vêm de integração com libs externas
  (`@gorhom/bottom-sheet`, `react-native-svg`/`lucide-react-native` via ref) e
  não devem mudar com o bump.
- **3 componentes vendorizados confirmados sem nenhum uso no app** (`avatar`,
  `date-time-picker`, `tabs` + arquivos auxiliares) — auditoria por grep
  (import fora do próprio diretório, sem barrel que pudesse mascarar uso
  indireto) mostrou zero consumidores. `date-time-picker` além de morto já
  estava quebrado (dependência fantasma `@react-native-community/datetimepicker`
  e um `@/components/ui/calendar` inexistente). Decisão: deletar os 3 em vez de
  atualizar/reconciliar.
- **Patch `patches/react-native-maps+1.27.2.patch` estava sujo**: 161 dos 163
  arquivos eram artefatos de build do Gradle capturados por engano; só 2
  arquivos tinham a mudança real (fix de import do config plugin para SDK 56).
  Regenerado limpo antes de qualquer bump, para não arriscar o `npm install`
  (que roda `patch-package` no postinstall).
- **`bottomsheet` não é mais um componente do template gluestack**: foi
  deliberadamente reescrito pelo time como wrapper direto sobre
  `@gorhom/bottom-sheet` (API própria `BottomSheetRef` com
  open/close/snapToIndex, `disablePortal`), usado em 6+ lugares do app. Fica
  fora do escopo de qualquer `gluestack-ui add` — se algum outro bottom sheet
  esbarrar em atrito com o gluestack no futuro, a rota de fallback é migrar
  todos os bottom sheets do app para `@gorhom/bottom-sheet` direto.

## Objetivo / Resultado esperado

- `@gluestack-ui/core`/`utils` em versão estável, sem regressão de tipos/lint/
  testes.
- Componentes vendorizados sem uso removidos do repositório.
- Componentes vendorizados com uso real atualizados para a v5 estável, sem
  perder customizações do time (API do bottomsheet, dual-mode de props em
  badge/checkbox, parser de gap do grid, animação do select-actionsheet).
- App validado em development build real (iOS/Android) pelo usuário.

## Fora de escopo

- Consertar a dependência fantasma do `date-time-picker` — componente foi
  deletado por estar morto, não faz sentido investir nisso.
- Corrigir os 9 erros de TS do `bottomsheet` (mismatch com
  `@gorhom/bottom-sheet@5.2.14`) — não relacionado ao gluestack, fica para um
  ticket separado se necessário.
- Qualquer teste em device físico/simulador ou build nativo — sem
  device/simulador neste ambiente; ambas as fases terminam com handoff para o
  usuário validar localmente.

## Impacto

- **Estabilidade**: sai de versões alpha para estável nas duas libs de motor
  do design system.
- **Manutenção**: remove ~3 componentes mortos do repositório, reduzindo
  superfície de erros de TS e código para manter.
