# Ticket Breakdown — Epic 1: Upgrade Expo SDK 54 → 55 → 56

```mermaid
graph LR
    T1[Ticket 1: Upgrade para SDK 55 ✅] --> T2[Ticket 2: Upgrade para SDK 56 ✅]
    T2 --> T3[Ticket 3: Reativar buoy-gg ⏳]
    T3 --> T4[Ticket 4: Regressão final + dry-run EAS ⏳]
    T4 --> T5[Ticket 5: Cleanup de dívida técnica de TypeScript ⏳]
```

Sem ticket de cobertura de testes nova — só roda a suíte Jest existente a cada
etapa. Validação funcional fica a cargo do usuário testando o app manualmente
entre uma versão e outra.

Cada item de escopo abaixo é uma checkbox: `[x]` feito, `[ ]` pendente. Ao retomar
o trabalho, este arquivo é a fonte de verdade de onde paramos.

---

## Ticket 1 — Upgrade para SDK 55

**Status:** ✅ Concluído — usuário confirmou teste manual passando.

**Escopo:**
- [x] `npx expo install expo@^55.0.0` + `npx expo install --fix`.
- [x] Corrigir conflito de versão `@react-navigation/native`/`bottom-tabs`/`elements`
  (expo-router 55 exigia `^7.3.7`, projeto tinha `^7.1.8` — causava crash
  `createScreenFactory is not a function`).
- [x] Corrigir mock de `react-native-worklets`/`react-native-reanimated` no Jest
  (`src/tests/setup.ts`) — faltava mockar `react-native-worklets` antes do
  reanimated, causava `WorkletsError` em 14 suítes de teste.
- [x] Adicionar `expo-font`, `expo-image`, `expo-web-browser` aos plugins do
  `app.config.ts` (exigido pelo config plugin desses pacotes na v55).
- [x] Validar `@expo/vector-icons`, plugins nativos (`expo-camera`, `expo-video`,
  `expo-location`, `expo-splash-screen`, `expo-secure-store`) — todos ok via
  `expo install --fix` + `expo-doctor`.
- [x] `react-native-compressor` (não verificado pelo React Native Directory) —
  bump de versão aplicado sem erro no `expo-doctor`; **teste funcional do fluxo de
  compressão de mídia em denúncias ainda depende do teste manual do usuário**.
- [x] `npx expo-doctor` limpo (19/19 checks).
- [x] `npm test` verde (23/23 suítes, 201/201 testes, suíte existente sem testes novos).
- [x] `npx biome ci .` limpo (0 erros, só warnings pré-existentes).
- [x] **Smoke test manual do usuário** (auth, câmera/mídia, mapa/geolocalização,
  gestures/teclado/safe-area/guards) — confirmado ok pelo usuário.
- Fora: qualquer mudança do SDK 56 (codemod de router, Hermes V1 default).

**Referências de spec:** tech-plan.md → Abordagem Arquitetural, tabela de breaking
changes (linhas SDK 55).

**Dependências:** nenhuma.

---

## Ticket 2 — Upgrade para SDK 56

**Status:** ✅ Concluído — usuário confirmou device support do iOS 16.4 e teste
manual passando.

**Escopo:**
- [x] `npx expo install expo@^56.0.0` + `npx expo install --fix`.
- [x] Rodar `npx expo-codemod sdk-56-expo-router-react-navigation-replace src` —
  0 alterações (confirma ausência de imports diretos de `@react-navigation/*`).
- [x] Remover `@expo/vector-icons` do `package.json` (não usado em `src/`).
- [x] Housekeeping cosmético: remover `newArchEnabled`/`edgeToEdgeEnabled` de
  `app.config.ts`.
- [x] **Achado extra não previsto**: `react-native-compressor` (todas as versões,
  inclusive a 2.0.2) quebra a avaliação do config com
  `Cannot find module '@expo/config-plugins'` — o plugin dele é um no-op
  (`config => config`) em todas as versões, então foi removido de `plugins` em
  `app.config.ts` sem perda funcional (o módulo nativo continua linkado normalmente).
- [x] **Achado extra**: `expo-doctor` apontou `expo-constants` como peer dependency
  obrigatória do `expo-router` — tinha sido removida por engano (achava que não
  tinha uso, mas é exigida internamente); reinstalada.
- [x] **Achado extra**: `expo-doctor` apontou que os pacotes `@react-navigation/*`
  (bottom-tabs, elements, native) não podem mais coexistir com expo-router 56 —
  removidos do `package.json`.
- [x] **Achado extra**: `jest-expo` 56 exige `@react-native/jest-preset` como peer
  dependency nova (preset que antes vinha embutido) — instalada.
- [x] **Achado extra**: nova dependência transitiva do expo-router
  (`standard-navigation`) é ESM e não estava no `transformIgnorePatterns` do Jest —
  adicionada.
- [ ] Validar deployment target iOS (16.4) não quebra build EAS.
- [x] **Confirmar com o usuário que dropar suporte a iPhone 7/7+, 6s/6s+, SE 1ª
  geração, iPad mini 4, iPad Air 2 é aceitável** — usuário confirmou que sim.
- [ ] Observar `react-native-reanimated`/`react-native-worklets` sob Hermes V1 (novo
  default) — atenção a valores numéricos soltos em arrays de `style` (gotcha
  documentado no Reanimated 4.2.1+). Sem sinal de problema nos testes automatizados;
  falta validação manual de gestures.
- [x] Confirmar Node da imagem EAS Build atende mínimo 20.19.4 (local já é v24.15.0).
- [x] `npx expo-doctor` limpo (21/21), `npm test` verde (23/23 suítes, 201/201
  testes), `biome ci` sem erros.
- [x] **Smoke test manual do usuário** — confirmado ok pelo usuário.
- Fora: reativação do buoy-gg (ticket separado, testado só contra o 56 final).

**Nota sobre `tsc --noEmit`:** rodei fora do escopo formal do ticket (não há script
de typecheck no projeto nem gate de CI pra isso) e encontrei 85 erros de TypeScript.
Confirmado que **não são causados por este upgrade**: o mesmo número de erros
aparece tanto com TypeScript 6.0.3 quanto voltando pra 5.9.2 (testado e revertido).
São majoritariamente incompatibilidades de tipos de libs de UI (`@gluestack-ui`,
`@gorhom/bottom-sheet`, `react-native-svg`) e alguns bugs de código pré-existentes
(ex: `src/components/ui/date-time-picker` importa `@react-native-community/datetimepicker`,
que **não é nem dependência do projeto** — nunca foi instalado). Dívida técnica
pré-existente, não bloqueante pra este epic; documentando aqui pra não se perder.

**Referências de spec:** tech-plan.md → Abordagem Arquitetural, tabela de breaking
changes (linhas SDK 56).

**Dependências:** Ticket 1, e confirmação manual do usuário de que o app está
estável na 55.

---

## Ticket 3 — Reativar `@buoy-gg/*` (devtools em modo dev)

**Status:** ⏳ Não iniciado — pronto pra começar (Ticket 2 concluído).

**Escopo:**
- [ ] Em `src/app/_layout.tsx`: restaurar `import { FloatingDevTools } from "@buoy-gg/core"`
  e descomentar `{isDevelopmentMode && <FloatingDevTools />}`; remover a linha
  comentada duplicada (variante `userRole`) deixada do commit original (`1ba2b1a`).
- [ ] Validar que funciona em build de desenvolvimento e que **não** aparece/roda em
  build de produção (`isDevelopmentMode` gate).
- Fora: mudanças de produto/config no próprio buoy-gg além de religar o que já existia.

**Referências de spec:** epic-brief.md → Escopo (dentro); tech-plan.md →
Arquitetura de Componentes.

**Dependências:** Ticket 2 (testar direto contra Hermes V1 / SDK 56, evita retestar).

---

## Ticket 4 — Regressão final + dry-run de build/submit EAS

**Status:** ⏳ Não iniciado — bloqueado pelo Ticket 3.

**Escopo:**
- [ ] Rodar a suíte de testes uma última vez.
- [ ] Smoke test manual completo (Android + iOS) das áreas críticas com o buoy-gg
  ativo em dev.
- [ ] Dry-run de build nos 3 profiles (`development`, `preview`, `production`) via
  `.eas/workflows/build-and-submit.yml` / `eas.json`.
- Fora: submit real às lojas (fica a critério do usuário decidir quando submeter).

**Referências de spec:** epic-brief.md → Critérios de sucesso.

**Dependências:** Ticket 3.

---

## Ticket 5 — Cleanup de dívida técnica de TypeScript (85 erros pré-existentes)

**Status:** ⏳ Não iniciado — backlog, roda depois do Ticket 4. Não bloqueia o
fechamento do Epic 1; é uma "atualização geral" separada, a critério do usuário
sobre quando entrar nela.

**Contexto:** rodando `npx tsc --noEmit` (fora do fluxo normal do projeto — não
existe script de typecheck nem gate de CI para isso) apareceram 85 erros.
**Confirmado que não são causados por este upgrade**: mesma contagem (85) tanto
com TypeScript 6.0.3 (pós-upgrade) quanto revertendo para 5.9.2 (testado e
restaurado). É dívida técnica pré-existente, sem gate de CI hoje, sem efeito no
runtime (Metro não faz type-check; `npm test` passa 100%).

**Escopo (por categoria, para triagem futura):**

- [ ] **Grupo 1 — `StyleSheet.absoluteFillObject` renomeado para `absoluteFill`**
  (17 erros / 5 arquivos): `src/app/(tabs)/(home)/sign-in.tsx`,
  `src/app/(tabs)/(home)/sign-up.tsx`, `src/components/camera/camera-preview.tsx`
  (x2), `src/components/medias-preview/media-thumbnail.tsx`. Fix mecânico,
  baixíssimo risco — find & replace.
- [ ] **Grupo 2 — import morto** (12 erros / 2 arquivos):
  `src/components/companies/financial-methods/payments-tab.tsx` e
  `receipts-tab.tsx` importam `@/libs/types/financial-method`, que não existe.
- [ ] **Grupo 3 — dependência nunca instalada** (4 erros / 2 arquivos):
  `src/components/ui/date-time-picker/index.tsx` e `index.web.tsx` importam
  `@react-native-community/datetimepicker`, que não é dependência do projeto.
  Verificar se o componente é usado em algum lugar antes de decidir entre
  instalar a dependência ou remover o componente morto.
- [ ] **Grupo 4 — campo `observations` ausente no SDK gerado** (4 erros):
  `src/app/(tabs)/(home)/companies/[companyId]/services/index.tsx` e
  `waste/index.tsx`, mais `src/tests/factories/make-service.ts` e
  `make-waste.ts`. Provável spec da OpenAPI desatualizado — checar se
  `npm run generate:api` (precisa do backend rodando em localhost:3333)
  resolve.
- [ ] **Grupo 5 — `global` sem tipo** (3 erros): `src/libs/media-compression.ts`,
  `src/tests/integration/companies/address-flow.test.tsx`,
  `src/tests/integration/profile/profile-flow.test.tsx`. Provavelmente deveria
  ser `globalThis`.
- [ ] **Grupo 6 — gluestack-ui v5 alpha** (≈27 erros): `bottomsheet`, `checkbox`,
  `toast`, `spinner`, `select-actionsheet`, `modal`, `button`, `badge`, `avatar`
  em `src/components/ui/`. Tipos instáveis de lib pré-release
  (`@gluestack-ui/core: ^5.0.0-alpha.0`, `@gluestack-ui/utils: ^5.0.1-alpha.0`).
  **Atualização (2026-07-04): release estável já existe** —
  [v5.0.0 no GitHub](https://github.com/gluestack/gluestack-ui/releases/tag/v5.0.0),
  `@gluestack-ui/core@5.0.15` e `@gluestack-ui/utils@5.0.6` publicados no npm
  (nossa versão pinada é `^5.0.0-alpha.0`/`^5.0.1-alpha.0`, não pega o estável
  automaticamente). Novidades da v5 estável: integração completa com
  NativeWind v5 (Tailwind v4) e "Expo Router first". Breaking change conhecido
  (suporte a Next.js removido) **não nos afeta** — projeto é só Expo. NativeWind
  em si ainda não tem release estável (`nativewind@5.0.0-preview.4` continua
  sendo a última, igual à instalada); `react-native-css` tem um patch novo
  (`3.0.7`, estamos em `3.0.6`). Não há confirmação de que a migração alpha→
  estável dos componentes wrapped (`bottomsheet`, `checkbox` etc.) seja livre de
  breaking changes — precisa de uma passada de validação dedicada, não só bump
  de versão.
  **Previsão de estável do NativeWind v5 (checado em 2026-07-04 via `gh` na
  [nativewind/nativewind](https://github.com/nativewind/nativewind))**: existe
  um plano de release ativo —
  [discussão #1818](https://github.com/nativewind/nativewind/discussions/1818),
  postada em 2026-06-17. Escopo do 5.0 é deliberadamente mínimo (só `filter`,
  `mix-blend-mode` e bugs bloqueantes; tudo mais fica pra depois). Timeline
  original: auditoria de PRs/issues + guia de migração v4→v5 (~1 semana) → corte
  de um Release Candidate → **~2 semanas de "bake"** só com correção de bugs →
  promoção pra `latest`. **Na prática está atrasado em relação a esse plano**:
  nenhum RC foi publicado ainda (última tag continua `5.0.0-preview.4`, de
  15/05), e o v4 ainda recebe patch novo (`4.2.6` em 22/06, depois do post do
  plano). Estimativa realista: estável não deve sair antes de meados/final de
  julho de 2026, dado que nem o RC saiu. Bônus: já existe uma
  [discussão sobre a v6](https://github.com/nativewind/nativewind/discussions/1819)
  (upstream pra Yoga/React Native), mas é early-stage, não bloqueia nada agora.
- [ ] **Grupo 7 — tipagem de mocks só em teste** (≈38 erros, sem afetar
  runtime): `Company` não exportado de `@/stores/companies-store` (7 arquivos
  de teste), mocks com tipos incompatíveis (`User`, literal `"profile"` vs
  `"current"`, arrays `never[]`) em `market-screen.test.tsx` e outros.

**Referências de spec:** discussão com o usuário em 2026-07-04 sobre os 85 erros
de `tsc --noEmit` encontrados durante o Ticket 2.

**Dependências:** nenhuma tecnicamente (é debt independente), mas por decisão do
usuário roda só depois de fechar os Tickets 3 e 4 deste epic.
