# Tech Plan — Upgrade Expo SDK 54 → 55 → 56

## Abordagem Arquitetural

**Upgrade incremental e validado, uma major do Expo SDK por vez** (54→55, validar;
55→56, validar) — é a prática recomendada pela própria Expo e isola em qual versão
uma quebra apareceu. Cada etapa: `npx expo install expo@<versão>` (ou editar
`package.json` + `npx expo install --fix`) → `npx expo-doctor` → `npm test` →
build dev/preview → smoke test manual das áreas críticas do epic-brief → só então
avança.

**New Architecture** já está habilitada (`app.config.ts` → `newArchEnabled: true`),
que é pré-requisito obrigatório do SDK 55 (Old Architecture foi removida) — nenhuma
migração necessária aqui.

**Breaking changes conhecidas e como tratamos cada uma:**

| SDK | Mudança | Impacto neste projeto |
|---|---|---|
| 55 | `expo-av` removido (substituído por `expo-audio`/`expo-video`) | Nenhum — projeto já usa só `expo-video`, nunca importou `expo-av` |
| 55 | `@expo/vector-icons` removido das deps transitivas do pacote `expo` | Baixo — já é dependência direta (`^15.0.3`); só validar bump de versão via `expo install --fix` |
| 55 | `EXAppDelegateWrapper` (iOS) / `ReactNativeHostWrapper` (Android) removidos | Afeta plugins nativos — `expo-camera`, `expo-video`, `expo-location`, `expo-splash-screen`, `expo-secure-store` são 1st-party e atualizam via `expo install --fix`. **Maior risco real: `react-native-compressor`** — já está marcado em `package.json` (`expo.doctor.reactNativeDirectoryCheck.exclude`) como não verificado pelo React Native Directory; testar explicitamente o fluxo de compressão de mídia em denúncias |
| 56 | iOS deployment target mínimo sobe para 16.4 | Nenhum target customizado hoje em `app.config.ts`/`eas.json` — o novo default do prebuild se aplica automaticamente; só confirmar que o build EAS não falha por isso. **Decisão de produto, não só técnica:** isso derruba suporte a iPhone 7/7+, 6s/6s+, SE 1ª geração, iPad mini 4, iPad Air 2 — vale confirmar com o usuário que essa perda de alcance é aceitável antes de finalizar o Ticket 2 |
| 56 | Hermes V1 vira padrão (era opt-in no 55) | Observar especialmente `react-native-reanimated`/`react-native-worklets` (C++/JSI) durante o smoke test de gestures. **Gotcha documentado (relato real de upgrade 54→55 com Claude Code):** Reanimated 4.2.1+ ficou mais estrito checando `in` em arrays de estilo — um valor numérico solto num array de `style` pode crashar; vale revisar componentes animados se algo quebrar. **Achado posterior (Ticket 6, 2026-07-07):** Hermes V1 tem regressão de memória confirmada com `react-native-reanimated`/`worklets` (~512KB por worklet único, eval guarda metadata de debug mesmo em produção) — já presente nesta versão (56), não é exclusivo do SDK 57. Sem fix publicado em release de RN/Expo ainda; ver Ticket 6 para detalhes e fontes |
| 56 | Codemod de imports do expo-router obrigatório (`expo-router` não depende mais de `react-navigation`) | Comando oficial: `npx expo-codemod sdk-56-expo-router-react-navigation-replace src`. **Grep confirmou que não há nenhum import direto de `@react-navigation/*` em `src/`**, então o codemod não deve alterar nada em código próprio — rodar mesmo assim como rede de segurança. Os 3 pacotes `@react-navigation/*` continuam como deps diretas (dependência transitiva do próprio expo-router), só alinhar versão |
| 56 | Node mínimo 20.19.4 | Local já é v24.15.0; `eas.json` não fixa versão de node — imagem gerenciada do EAS Build já atende, só confirmar no log do build |
| 56 | `@expo/vector-icons` descontinuado (migrar para `@react-native-vector-icons/*`) | **Grep confirmou zero imports de `@expo/vector-icons` em `src/`** — é dependência direta não usada (o projeto usa `lucide-react-native` exclusivamente, por regra do CLAUDE.md). Mais simples remover a dependência no Ticket 2 do que rodar o codemod de migração |
| 56 | `expo-file-system`: `copy()`/`move()` viram assíncronos | Único uso no projeto é `src/libs/media-validation.ts` (classe `File`, só `.exists`/`.size`) — nenhuma chamada a `.copy()`/`.move()`. Sem impacto |
| 56 | `expo/fetch` vira `globalThis.fetch` por padrão | Projeto usa Axios (não fetch nativo) para toda chamada de API — sem impacto esperado, mas observar durante regressão |
| 56 | `@expo/dom-webview` substitui `react-native-webview` como default de DOM components | `react-native-webview` não é dependência do projeto — sem impacto |
| 55 | `edgeToEdgeEnabled`/`newArchEnabled` removidos do schema (edge-to-edge e New Arch viram mandatórios, não configuráveis) | `app.config.ts` ainda declara os dois explicitamente com `true` — `npx expo config` confirmou que isso é aceito silenciosamente (sem warning/erro), já que bate com o novo default obrigatório. Puramente cosmético; limpar como housekeeping no Ticket 2, não é bloqueante |

**Por que os pitfalls de projetos bare (relatados em upgrades reais 54→55 com Claude
Code: `AppDelegate.swift`, `bindReactNativeFactory` removido, `gradle-wrapper.jar`,
reestruturação de `settings.gradle`/autolinking) não se aplicam aqui:** este projeto
é managed/CNG — `ios/`/`android/` são gitignored, gerados pelo EAS Build a cada
build. Não há código nativo customizado para quebrar.

**`@buoy-gg/*` (devtools)**: não é trabalho novo de integração — já existe wiring
comentado em `src/app/_layout.tsx` (adicionado no commit `1ba2b1a`, comentado
depois). Reativar depois dos dois bumps de SDK, para testar contra o Hermes V1 do
56 diretamente, evitando destestar duas vezes.

**Ordem de execução:**
1. 54 → 55, validar
2. 55 → 56 (inclui codemod expo-router), validar
3. Reativar `@buoy-gg/*` em `_layout.tsx`, validar (build dev apenas — não roda em produção)
4. Regressão completa + dry-run de build/submit nos 3 profiles do EAS

## Modelo de Dados

N/A — upgrade de infraestrutura, sem novas entidades ou mudança de schema.

## Arquitetura de Componentes

**Arquivos tocados:**
- `package.json` / `package-lock.json` — todas as deps `expo-*`, `react-native`,
  `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler`,
  `react-native-safe-area-context`, `react-native-screens` alinhadas às versões do
  SDK 56.
- `app.config.ts` — versões de plugins alinhadas; possível pin explícito de iOS
  deployment target se o novo default do prebuild colidir com `react-native-maps`
  ou `expo-camera`.
- `src/app/_layout.tsx` — reativação do `@buoy-gg/*`: restaurar
  `import { FloatingDevTools } from "@buoy-gg/core"` e descomentar
  `{isDevelopmentMode && <FloatingDevTools />}`, removendo a linha comentada
  duplicada (`userRole` variant) que ficou como lixo do commit original.
- Arquivos tocados pelo codemod de import do expo-router — escopo determinado pela
  saída do próprio codemod, não previsível antecipadamente.

**Testes:**
- Suíte Jest existente (`src/tests/component`, `src/tests/integration`) roda a cada
  etapa do upgrade, sem levantamento de cobertura nova. Validação funcional das
  áreas críticas é manual, feita pelo usuário no app entre uma versão e outra.

Sem novos componentes de produto, sem novos pontos de integração além dos já
existentes.
