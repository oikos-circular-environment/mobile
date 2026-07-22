# Tech Plan — Epic 8: upgrade do gluestack-ui (alpha → v5 estável)

## Abordagem arquitetural

Cinco frentes, em ordem estrita (cada uma depende da anterior estar limpa):

1. **Limpeza do patch `react-native-maps`** — pré-requisito de segurança para
   qualquer `npm install` futuro (postinstall roda `patch-package`).
2. **Remoção de componentes vendorizados sem uso** — reduz superfície antes de
   qualquer bump (menos código para revalidar, menos erros de TS herdados de
   código morto).
3. **Fase 1 — bump das 2 libs npm** (`@gluestack-ui/core`, `@gluestack-ui/utils`)
   sem tocar em `src/components/ui/*`.
4. **Handoff para o usuário**: rodar o app localmente + `expo prebuild`.
5. **Fase 2 — atualizar componentes vendorizados** via CLI, com reconciliação
   manual nos que têm lógica própria, seguida de handoff final para
   development build completo.

### Por que separar limpeza de patch antes do bump
`patches/react-native-maps+1.27.2.patch` tinha 161 dos 163 arquivos como
artefatos de build do Gradle (`node_modules/react-native-maps/android/build/**`)
capturados por engano ao gerar o patch com um `node_modules` "sujo" (pós-build
nativo). Só 2 arquivos (`plugin/build/android.js`, `plugin/build/ios.js`) têm a
mudança real: redirecionam `require("@expo/config-plugins")` /
`require("@expo/config-plugins/build/...")` para `require("expo/config-plugins")`
— necessário porque o config plugin do `react-native-maps@1.27.2` importa um
subpath interno que não é mais resolvível de forma estável no Expo SDK 56. Um
patch sujo pode falhar ao aplicar (ou aplicar lixo) num `node_modules` limpo —
por isso é regenerado ANTES de qualquer mudança de dependência.

### Por que remover componentes vendorizados sem uso antes do bump
Auditoria por grep (`grep -rl "components/ui/<nome>"` excluindo o próprio
diretório, mais checagem de barrel — não existe `src/components/ui/index.ts` —
e de nomes de export soltos como `Avatar`/`Tabs`/`DateTimePicker` fora do
diretório) confirmou **zero consumidores reais** para:

- `avatar/` — nenhuma referência a `Avatar` fora do próprio dir.
- `date-time-picker/` (`index.tsx`, `index.web.tsx`, `styles.tsx`) — nenhuma
  referência a `DateTimePicker` fora do próprio dir. Já estava quebrado
  independente disso: `index.tsx:14` importa
  `@react-native-community/datetimepicker` (não instalado, não está em
  `package.json`/`node_modules`); `index.web.tsx:5` importa
  `@/components/ui/calendar`, diretório inexistente no projeto.
- `tabs/` (`index.tsx`, `TabsAnimatedIndicator.tsx`, `animation-config.ts`) —
  a única ocorrência de "Tabs" fora do dir é o `Tabs` do `expo-router` em
  `src/app/(tabs)/_layout.tsx` (sem relação nenhuma).

Deletar os 3 (em vez de reconciliar/atualizar via CLI) já remove 6 dos 27 erros
de TS pré-existentes (1 do avatar — `@ts-expect-error` obsoleto; 5 do
date-time-picker — módulo ausente + integração de ref quebrada), sem depender
do bump de versão.

### Por que a Fase 1 é só os 2 pacotes de motor
`@gluestack-ui/core`/`@gluestack-ui/utils` são as únicas dependências npm reais
do gluestack neste projeto (confirmado: sem `@gluestack-ui/nativewind-utils`,
sem pacote `gluestack-ui` legado). Os ~19 componentes restantes em
`src/components/ui/*` (após remover os 3 mortos) são código-fonte que só se
atualiza via CLI (`gluestack-ui add`), processo separado e mais arriscado (sem
merge automático). Fazer o bump isolado primeiro permite:
- Validar rapidamente (`tsc`/`lint`/`test`) se algum dos ~8 erros de tooling
  alpha (`nativeStyleToProp not assignable`, "union type too complex",
  `ts-expect-error` obsoleto) desaparece só com a troca de versão do motor.
- Isolar o risco: se o bump sozinho já causar problema, é mais fácil
  diagnosticar do que junto com uma reescrita de 19 componentes.

### Por que a Fase 2 tem 3 categorias (não 2)
A investigação inicial separava só "stock" vs "customizado", mas descobertas
subsequentes mostraram que "customizado" não é uma categoria única:

1. **Grupo A — sobrescrita direta**: `alert`, `divider`, `progress`, `spinner`,
   `switch`, `pressable`, `skeleton`, `form-control`, `input`, `icon`, `menu`,
   `modal`, `toast`, `box`, `card`, `heading`, `hstack`, `vstack`, `text`,
   `gluestack-ui-provider`. Estrutura enxuta, sem lógica de negócio, convenção
   de tokens já "flat" (`bg-primary`, `text-foreground`) igual à base
   NativeWind v5 + Tailwind v4 que a v5 estável do gluestack usa — risco baixo
   de a sobrescrita reverter a paleta visual, mas cada um ainda passa por diff
   antes de aceitar.
2. **Grupo B — reconciliação manual** (lógica/API própria, buscar template
   novo à parte e mesclar só mudanças de motor): `badge`/`checkbox` (modo dual
   de props `size` vs `height`/`width` cru do SVG; branch `Platform.OS ===
   "web"` com ajuste para RN 19/react-native-web), `grid` (parser próprio
   `parseGapFromClassName` de classes Tailwind para pixels), `select/
   select-actionsheet` (anima com `@legendapp/motion`, escolha de stack
   específica do projeto).
3. **Fora do escopo do CLI** (não é gerado/mantido pelo template gluestack, não
   tentar `add`): `decimal-input` (100% custom, usa `@/libs/money`),
   `swipeable-card.tsx` (100% custom, swipe-to-delete próprio), e
   **`bottomsheet`** — confirmado pelo usuário que já foi deliberadamente
   reescrito como wrapper direto sobre `@gorhom/bottom-sheet` (API própria
   `BottomSheetRef` com open/close/snapToIndex/expand/collapse,
   `disablePortal`), não é mais um componente derivado do template. Rodar
   `add` aqui apagaria essa API e quebraria 6+ call sites
   (`src/app/(tabs)/(home)/index.tsx`, `src/app/(tabs)/complaints/index.tsx`,
   `src/contexts/market-context.tsx`, `location-source-bottom-sheet.tsx`,
   `radius-bottom-sheet.tsx`, `complaint-filter-bottom-sheet.tsx`,
   `company-picker-bottom-sheet.tsx`). Os 9 erros de TS deste arquivo vêm de
   mismatch de tipos com `@gorhom/bottom-sheet@5.2.14` instalado — orthogonal,
   fora de escopo deste epic. Fallback se algum outro bottom sheet do app
   esbarrar em atrito com o gluestack: migrar todos para consumir
   `@gorhom/bottom-sheet` direto, como este já faz.

## Modelo de dados / comandos

Nenhum modelo de dados novo. Comandos-chave:
```bash
# limpeza do patch
rm -rf node_modules/react-native-maps/android/build
npx patch-package react-native-maps

# bump (Fase 1)
npm install @gluestack-ui/core@5.0.15 @gluestack-ui/utils@5.0.6 --save-exact=false

# Fase 2 (por componente do Grupo A/B, confirmar flags na hora —
# não há gluestack-ui.config.json, CLI pode perguntar path/estilo)
npx gluestack-ui@latest add <componente> --path src/components/ui
```

## Riscos / atenção

- **CLI sem config persistida**: sem `gluestack-ui.config.json`, `add` pode
  perguntar interativamente por `path`/estilo — confirmar respostas na hora
  (path = `src/components/ui`, estilo = o que já está em uso).
- **Paleta de tokens**: mesmo nos componentes do Grupo A, confirmar após cada
  `add` que `bg-primary`/`text-foreground`/`bg-muted` etc. não regrediram para
  a escala numérica padrão do gluestack (`bg-primary-500`).
- **`bottomsheet` não deve ser tocado pelo CLI** — reforçar isso na execução,
  já que é fácil confundir com "componente customizado que precisa de
  reconciliação" em vez de "não é mais um componente do template".
- **Sem device/simulador neste ambiente** — toda validação visual/build nativo
  (prebuild, development build) fica com o usuário, em ambas as fases.

## Validação

- Após cada passo/fase: `npx tsc --noEmit`, `npm run lint`, `npm test`
  (suíte completa, baseline 198/198 passando).
- Baseline de erros de TS: 27 antes de qualquer mudança → esperado ~21 após
  remover os 3 componentes mortos → recontar após o bump da Fase 1 e após cada
  componente da Fase 2.
- `git diff` de cada componente tocado na Fase 2, revisado manualmente antes de
  commitar — nunca aceitar `add` às cegas nos componentes do Grupo B.
