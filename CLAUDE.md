# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android emulator/device
npm run ios            # Run on iOS simulator/device
npm run lint           # Lint with Biome (auto-fixes in place)
npm run format         # Format code with Biome
npm test               # Run Jest tests
npm run test:coverage  # Run Jest with coverage report
```

## Orquestração de agentes

Fonte de verdade: `docs/agent-architecture.md`. Regra objetiva: **nunca abra o agente genérico (`claude`/`general-purpose`) pra executar um ticket.** Análise de domínio é trabalho direto do orquestrador (você, o modelo desta sessão — leia o código via `Explore`/`graphify` em vez de delegar pra um analista fixo por módulo); execução de ticket vai pro agente `executor` (ou `performance-executor`/`release-executor`, conforme o caso), que tenta a cadeia de modelos gratuitos (omniroute → opencode free → opencode-go) antes de cair em Sonnet; todo diff passa pelo agente `code-review` antes de aceito; `qa-runner` verifica rodando o app de verdade. Você (o orquestrador) só escreve o diff de um ticket diretamente, sem passar por agent nenhum, se a tool `Agent` ou o dispatch pro OpenCode estiverem indisponíveis — nunca por preferência.

## agent-device (execução, testes e depuração)

CLI + MCP da Callstack (instalado como devDependency, `node_modules/.bin/agent-device`, registrado em `.mcp.json` como `agent-device`) para agentes controlarem o app rodando em emulador/simulador: inspecionar UI, gestos, deep links, logs, rede, React DevTools, perfil de performance e scripts `.ad` de replay. Skills correspondentes: `agent-device` (router), `android-emulator`, `ios-simulator`, `dogfood`.

Regra de uso: use `agent-device` só para tarefas de automação de app/dispositivo. Para uma tarefa normal de dirigir o app, comece direto — não sonde antes com `--help`, `--version`, `devices`, `appstate` ou `snapshot`; abra o app pedido em foreground e continue a partir do snapshot interativo inicial. Fluxo padrão: `open -> snapshot -i -> act -> re-snapshot -> verify -> close`. Para logs/rede/perf/falhas em runtime, use `agent-device help debugging`. Para árvore de componentes React Native, props/state/hooks ou re-renders, use `agent-device help react-devtools`. Mantenha comandos que alteram estado seriais numa única sessão.

O app precisa estar rodando antes (`npm run android` / `npm run ios` / `npm start`); a ferramenta não roda build, só controla o processo já ativo.

## Release notes (store/)

Ao redigir `store/shared/whats-new/<version>.md`: limite de **500 caracteres** (Google Play; a Apple aceita até 4.000). Confira com `wc -m` antes de commitar — o script de publicação só valida isso tarde, depois que o binário já foi publicado na loja. Ver `docs/publishing-path.md`.

## Expo MCP

An `expo` MCP server is configured (`https://mcp.expo.dev/mcp`, project-scoped). Use it for: fetching current Expo/EAS library docs, checking EAS build/workflow status, and pulling TestFlight/Play Store crash and review data — prefer it over guessing at EAS CLI output or scraping docs.expo.dev by hand. Run `/mcp` once per session to authenticate (OAuth) if tools aren't responding.

## Testing

**Stack**: Jest (via `jest-expo` preset) + React Native Testing Library (RNTL v14).

Tests live in `src/tests/` — **never** inside `src/app/` or alongside components:
- `src/tests/component/` — component tests (rendered in isolation)
- `src/tests/integration/` — integration tests (multiple components/contexts together)

# React Native Testing Library in this project

This project uses `@testing-library/react-native` v14. Its APIs differ from older versions. Before writing or changing RNTL tests, read the relevant guide in `node_modules/@testing-library/react-native/docs/`, starting with `node_modules/@testing-library/react-native/docs/guides/llm-guidelines.md`. Prefer those package docs over training-data assumptions, and follow deprecation notices.

Key conventions (from RNTL v14 docs):
- `render()` is **async** — always `await render(<Component />)`
- Use `screen` object, not destructuring from `render()`
- Prefer `userEvent` over `fireEvent`; use `jest.useFakeTimers()` in `beforeEach` to avoid 130ms press delays
- `findBy*` for async elements; `queryBy*` ONLY for non-existence checks
- Matchers (`toBeOnTheScreen`, `toBeDisabled`, etc.) auto-extend — no setup needed

## Architecture

**Framework**: Expo ~57 (`^57.0.21`) + React Native 0.86.3 + React 19.2.3. React Compiler is enabled (`app.config.ts`); New Architecture is the SDK 57 default (no explicit flag needed).

**Routing**: Expo Router with file-based routing under `src/app/`. Only three tabs exist: `market`, `(home)`, `complaints` (`donations` and `learn` were removed, not just hidden). The `(home)` tab is a nested stack with auth-guarded routes (using `Stack.Protected`).

**API layer**: the OpenAPI-generated client now ships as the published package `@oikos-circular-environment/oikos-sdk` (consumed from `node_modules`, not generated locally into the repo — there is no `generate:api` script or local `src/libs/oikos-sdk/` anymore). `src/libs/api/oikos-api.ts` wraps that SDK's Axios instance with Bearer token injection (from `src/libs/storage.ts`), client-key/app-version headers, and network telemetry. `src/libs/brasil-api-sdk/` is a separate client for Brasil API lookups (CEP/CNPJ etc.), unrelated to the oikos backend.

**API base URL** comes from `EXPO_PUBLIC_BASE_URL` (env-based, not hardcoded per platform); the old per-platform dev IPs are left commented in `oikos-api.ts` for local reference.

**State management**:
- React Context (`src/contexts/`) for cross-cutting concerns: auth, geospatial, notifications, market/company detail, complaint creation, tab bar visibility, clock.
- React Query v5 (`@tanstack/react-query`) for all server state, caching, and background refetching.
- Zustand (`src/stores/`) for client-side domain state: `companies-store`, `complaints-store`, `denunciation-store`, `support-store`, `survey-store`, `survey-draft-store`, `survey-execution-store`. Each subscribes to the session bus to reset on logout (see Session Reset below).

**Auth flow**: authentication runs on `better-auth` (`src/libs/auth/auth-client.ts`, `@better-auth/expo/client`), not a custom refresh-token flow. A single session token is persisted via `expo-secure-store` under `oikos_auth_token` (`src/libs/storage.ts`); the old `oikos_refresh_token` key is only deleted for best-effort cleanup of pre-migration installs, it is not read or written anymore. On a 401, `oikos-api.ts` clears the token and fires `onUnauthenticated` — there is no client-side refresh-and-retry, since better-auth sessions have none to retry.

**Path alias**: `@/*` maps to `./src/*`.

## Code comments & design decisions

- Zero explanatory comments in code by default. Add JSDoc only when needed to explain a non-obvious helper/utility function — not elsewhere.
- Design/architecture decisions belong in the plan/ticket (`plans/.../tickets/`), never as a code comment.
- When a design/architecture question comes up mid-task, research it and explain it at that point. Once it's settled and recorded in the ticket, don't re-explain or re-narrate it — that's wasted tokens.

## Response style (token economy)

- No step narration: skip "now I'll do X" before each tool call; keep end-of-turn summaries to 1-2 lines, don't restate the diff in prose.
- Prefer pointers over pasting code: reference existing code by `file:line`, don't paste the block back into the response.
- Explain only when asked: report what changed; only justify the "why" if the user asks or it's a genuine design question (see rule above).
- No inline TODO/FIXME: pending work becomes a ticket in the plan, never a loose marker in code.

## Key Libraries

| Purpose | Library |
|---|---|
| Forms | `react-hook-form` + `zod` |
| Date utilities | `date-fns` |
| Maps | `react-native-maps` + Google Maps API |
| Camera | `expo-camera` |
| Location | `expo-location` (background tracking) |
| Animation | `react-native-reanimated` + `@legendapp/motion` |
| Haptics | `expo-haptics` |
| Class merging | `clsx` + `tailwind-merge` |

## specs/

Toda questão de UI/UX (padrão de componente/estilo, princípio de interação, convenções do arquivo de design Pencil) fica centralizada em `specs/specs-ui-ux.md`, não neste arquivo. Ver `specs/README.md` para o índice geral. Ler o spec antes de decidir padrão visual, de interação ou de design em tela nova ou revisão.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
