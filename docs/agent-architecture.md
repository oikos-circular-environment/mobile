# Arquitetura de Agents Especializados — Oikos Mobile

> **Status: implementado, em teste prático.** Os 13 agents descritos aqui existem de fato em
> `.claude/agents/*.md`, consumindo as skills de `.agents/skills/` (seção 6). `observability-executor`
> é a única peça da spec original que ficou só no papel — por decisão explícita, sem instrumentar
> ferramenta nova enquanto `plans/epic-3-observability` não decidir o vendor. Ver seção 8 pro que
> falta validar na prática.
>
> Público-alvo: qualquer pessoa (ou agente) que vá rodar este projeto e programar usando Claude Code
> e/ou OpenCode — ver seção 9 pra como os dois se encaixam.

## 1. Problema que isso resolve

Hoje, um único agent generalista lida com qualquer pedido no repo — desde um typo em `market-list-header.tsx`
até uma investigação de bug de safe area envolvendo config plugin nativo. Isso tem dois custos:

1. **Redundância de contexto.** O agent generalista tem ~38 skills disponíveis (ver seção 6) e o
   catálogo inteiro do projeto (Market, Complaints, Survey, Auth, EAS, design system...) sempre
   presentes, mesmo quando a tarefa toca só um canto específico. Cada invocação "reconstrói" esse
   entendimento do zero.
2. **Scope creep.** Um agent com acesso amplo a arquivos e sem um contrato de escopo tende a abrir
   mais frentes do que o pedido original — refatorar código adjacente, tocar em módulos não
   relacionados, gerar mais diff do que o necessário para resolver o problema.

A proposta: trocar "um generalista faz tudo" por "um orquestrador aciona especialistas de escopo
estreito", cada um carregando só o contexto (skills, arquivos, convenções) da sua área.

## 2. Modelo mental: Orquestrador → Analistas → Executores → QA

```mermaid
graph TD
    U[Pedido do usuário] --> O{Orquestrador}
    O -->|trivial: 1 arquivo, causa óbvia| D[Resolve direto, sem delegar]
    O -->|não-trivial| A[Camada 1 — Analista de domínio]
    A -->|plano escopado em plans/epic-*/| O
    O --> E[Camada 2 — Executor de camada técnica]
    E -->|1 ticket por vez, 1 commit por ticket| O
    O --> Q[qa-runner via agent-device]
    Q -->|passou| O
    Q -->|falhou| O
    O --> R[Ticket marcado feito]
```

**O orquestrador não é um agent novo.** É a própria sessão principal do Claude Code — quem já tem a
tool `Agent`/Task e decide quando delegar. Não faz sentido criar um "agent orquestrador" separado:
isso só adicionaria uma chamada de LLM redundante em cima de uma decisão que a sessão principal já
toma de graça.

Regras do protocolo:

- **Só o orquestrador aciona agents.** Nenhum Analista ou Executor tem a tool `Agent` no seu
  `tools:` — evita árvores de subagents descontroladas (elas mesmas um vetor de scope creep).
- **Agents frescos, não fork.** Analistas e Executores devem ser instâncias novas (`Agent` sem
  `subagent_type: "fork"`), não forks da sessão principal. O ganho de isolamento de contexto —
  o motivo de existir essa arquitetura — some se o agent herda todo o histórico da sessão que o
  chamou.
- **Pular o pipeline para tarefas triviais.** Typo, fix de uma linha com causa óbvia, pergunta
  factual sobre o código: a sessão principal resolve direto. O pipeline existe para reduzir o custo
  de tarefas não-triviais, não para burocratizar tudo — isso ecoa a regra geral do Claude Code de
  não invocar subagent sem necessidade real.

## 3. Camada 1 — Analistas (leitura, análise, proposta)

Analistas **não escrevem código**. Consomem o estado atual do domínio, analisam o pedido, e produzem
um plano escopado — sem abrir o leque para além do problema determinado. O contrato de tools espelha
os agents builtin `Explore`/`Plan` deste harness (mesmo padrão, não uma invenção nova):

```
tools: Read, Grep, Glob, Bash (somente leitura/diagnóstico — git log, npm test --listTests, graphify query), Skill
# Excluídos deliberadamente: Edit, Write, NotebookEdit, Agent, Artifact, ExitPlanMode
```

| Agent | Domínio | Arquivos-chave | Aciona quando |
|---|---|---|---|
| `market-analyst` | Marketplace de resíduos/serviços | `src/app/(tabs)/market/`, `src/contexts/market-context.tsx`, `src/components/market/` | Mudança de comportamento/feature no Market |
| `complaints-analyst` | Denúncia + câmera | `src/app/(tabs)/complaints/`, `src/contexts/complaint-creation-context.tsx`, `src/contexts/complaints-context.tsx`, `src/components/camera/` | Fluxo de denúncia, captura de foto, geolocalização anexada à denúncia |
| `survey-analyst` | Modo pesquisa (TCLE, SQLite, outbox) | `src/app/survey/`, `src/libs/survey/`, `src/components/survey/` | Qualquer mudança no subsistema de pesquisa — é o mais isolado e complexo do repo (persistência local, consentimento, outbox de sincronização) |
| `auth-session-analyst` | Auth, sessão, perfil, tab Home | `src/contexts/auth-context.tsx`, `src/libs/session-bus.ts`, `src/app/(home)/`, `src/libs/api/oikos-api.ts` | Login, refresh de token, logout, reset de sessão, tela inicial |
| `design-system-analyst` | Consistência visual | `src/components/ui/`, uso de `gluestack-ui`/NativeWind em qualquer tela | Auditoria de drift visual, decisão de criar/alterar um componente compartilhado |
| `data-layer-analyst` | Camada de dados cross-cutting | `src/libs/oikos-sdk/` (consumo, nunca edição), React Query em geral, padrões de cache/refetch | Mudança que atravessa múltiplos domínios pelo lado dos dados (ex.: `roundCoord`+`keepPreviousData` do epic-7 foi um caso desses) |
| `observability-analyst` | Interpretação de erro/crash/performance | Dados do EAS Observe (métricas de cold/warm start, TTI), issues do Sentry quando existir, `plans/epic-2-eas-observe/`, `plans/epic-3-observability/` | Diagnosticar um erro/crash já reportado, triar prioridade, decidir causa raiz **antes** de qualquer instrumentação nova ser escrita — hoje o observer é incompleto (epic-3 aguarda decisão de ferramenta), então grande parte do trabalho aqui é "o que está faltando observar", não só "o que os dados já dizem" |

**Saída esperada de um Analista:** este repo já tem um formato de plano maduro em `plans/epic-*/`
(`epic-brief.md` → `tech-plan.md` → `tickets.md`, ver `plans/README.md` e qualquer epic existente
como referência de forma). Um Analista deve:

- Para algo do tamanho de um epic: criar/atualizar essa estrutura de 3 arquivos.
- Para algo menor (um ticket avulso): devolver ao orquestrador um plano inline no mesmo formato de
  `tickets.md` (checkboxes `[ ]`, escopo explícito, "Fora:" listando o que **não** é para tocar).

Nos dois casos, o plano deve declarar explicitamente o que fica **fora** do escopo — esse "Fora:" é o
principal mecanismo anti scope-creep na saída do Analista.

> Nota: as skills globais `brief`/`tech-plan`/`tickets` (workflow `agile`, ver
> `~/.claude/CLAUDE.md`) já automatizam esse formato, mas hoje são globais da máquina — não
> reproduzíveis por qualquer pessoa que clone o repo. Formalizar esse fluxo em nível de projeto
> (skill própria, ou pelo menos um template em `plans/`) é um gap em aberto (seção 8).

### Exemplo completo — `survey-analyst`

```markdown
---
name: survey-analyst
description: >
  Use when the request touches the survey mode subsystem: TCLE consent, SQLite persistence,
  outbox sync, task/suite flow, or anything under src/app/survey/, src/libs/survey/,
  src/components/survey/. Analyzes the current state and proposes a scoped plan; does not
  write code.
tools: Read, Grep, Glob, Bash, Skill
model: sonnet
---

Você é o analista do subsistema de pesquisa (survey mode) do Oikos Mobile.

## Escopo
- `src/app/survey/**`, `src/libs/survey/**`, `src/components/survey/**`.
- Fora do seu escopo: qualquer tela fora de `survey/`, o design system genérico
  (`src/components/ui/`) — para essas, o orquestrador aciona outro analista.

## O que você faz
1. Lê o código relevante e o(s) ticket(s)/epic(s) já existentes em `plans/` que tocam survey.
2. Entende exatamente o problema pedido — não amplie para "enquanto isso, também poderíamos...".
3. Produz um plano no formato `tickets.md` deste repo: checkboxes de escopo, seção "Fora:"
   explícita, e uma nota se o ticket depende de outro domínio (ex.: geolocalização vem de
   `geospatial-context`, não é survey).
4. Nunca edita código. Devolve o plano para o orquestrador decidir qual executor aciona.

## Convenções do domínio a respeitar na análise
- Persistência é SQLite isolada do resto do app (ver M01 em `plans/`), com outbox de sync.
- Fluxo de consentimento (TCLE) tem exigências éticas de pesquisa com seres humanos — qualquer
  mudança de texto ou fluxo de consentimento deve ser sinalizada como sensível no plano.
- Estado de sessão de pesquisa é resetado via `sessionBus` no logout, como qualquer outro
  contexto — verifique se o ticket proposto preserva isso.
```

## 4. Camada 2 — Executores e QA (escrevem código, rodam o app)

Diferente dos Analistas (organizados por domínio de produto), os Executores são organizados por
**camada técnica** — porque é aí que "boas práticas de Expo/TypeScript/React Native" realmente
diferem. Um ticket de UI do Market e um ticket de UI de Complaints usam exatamente as mesmas regras
de `gluestack-ui`/NativeWind; não faz sentido duplicar esse conhecimento por domínio.

```
tools (executores de código): Read, Grep, Glob, Edit, Write, Bash, Skill
tools (qa-runner):            Read, Grep, Glob, Bash, Skill  (sem Edit/Write — é verificador, não escritor)
# Excluído de todos: Agent (só o orquestrador encadeia agents)
```

| Agent | Escopo de escrita | Skills principais | Boas práticas que aplica |
|---|---|---|---|
| `ui-executor` | Telas, componentes, layouts (`src/app/**`, `src/components/**` exceto `camera/` nativo) | `expo-router`, `expo-native-ui`, `expo-design-system`, `gluestack-ui-v4`, `expo-tailwind-setup`, `expo-animation`, `react-composition-2026`, `copywriting`/`copy-editing` | `cn()` para className condicional, formulários em `KeyboardAvoidingView`+`ScrollView`, ícones só `lucide-react-native`, cor primária `lime-800`, gluestack-ui v5 antes de RN cru, composição em vez de prop-drilling excessivo |
| `data-executor` | Hooks de dados, formulários, consumo do `oikos-sdk`, mutations/queries, estado global | `expo-data-fetching`, `native-data-fetching`, `dinero-*` (valores monetários do Market), `react-state-management`, `zustand` | React Query para todo estado de servidor, `react-hook-form`+`zod`, nunca editar `src/libs/oikos-sdk/` à mão (regenerar via `npm run generate:api`); Zustand está instalado mas sem uso real hoje — só introduzir se Context API deixar de bastar para um caso concreto, não preventivamente |
| `native-executor` | Módulos nativos, permissões, config plugins (`plugins/`, `app.config.ts`, `expo-camera`/`expo-location`) | `expo-module`, `expo-native-ui`, `eas-workflows` | Preferir config plugin a edição manual de `android/`/`ios/` (que são gerados e gitignored — ver `plugins/withAndroidSplashWindowBackground.js` como referência real deste repo) |
| `release-executor` | Publicação, EAS, release notes, ASC/Play (`store/`, `.eas/`, `eas.json`) | `eas-app-stores`, `eas-workflows`, `eas-update-insights`, `copywriting`/`copy-editing` | Release notes ≤500 caracteres (`wc -m` antes de commitar, ver `docs/publishing-path.md`), nunca pular validação de char limit |
| `observability-executor` **(não implementado)** | Instrumentação de erro/performance (SDK setup, releases, alertas) | `sentry-get-started`, `sentry-react-native-sdk`, `sentry-instrument`, `sentry-setup-releases`, `posthog-instrumentation`, `eas-observe` | Ficaria pronto pra implementar o que `observability-analyst` apontar como faltando, mas por decisão explícita não construímos esse arquivo agora — sem instrumentar ferramenta nova antes do `plans/epic-3-observability` decidir o vendor |
| `performance-executor` | Qualquer camada, quando o pedido é otimização (não feature nova) | `argent-react-native-optimization`, `expo-react-native-performance`, `react-native-architecture`, `react-state-management`, `typescript-refactor` | Ver nota abaixo — é a exceção deliberada ao padrão Analista/Executor |
| `qa-runner` | **Não escreve código.** Roda o app, verifica, coleta evidência | `agent-device`, `android-emulator`, `ios-simulator`, `dogfood`, `expo-dev-client` | Fluxo `open → snapshot -i → act → re-snapshot → verify → close`; app já precisa estar rodando (`npm run android`/`ios`); reporta pass/fail + screenshots/logs ao orquestrador — não corrige o que encontrar, devolve para o executor certo |

> **Por que `performance-executor` quebra o padrão "Analista propõe, Executor implementa":**
> otimização é um ciclo medir → corrigir → remedir, não uma feature com escopo fixo de antemão —
> a própria skill `argent-react-native-optimization` (Software Mansion, mesma equipe do Reanimated)
> formaliza isso: scan rápido de re-renders, sweep semântico (memoização, listas, animações,
> cleanup de efeitos, fetch waterfalls), *então* perfil, corrige o maior gargalo, remede, decide se
> manteve ou reverteu. Forçar um plano por escrito antes de cada correção individual travaria o
> ciclo sem ganho real. O guardrail aqui não é "sem Edit/Write" — é **um alvo por invocação**:
> `performance-executor` recebe uma métrica e um limiar do orquestrador (ex.: "reduzir re-renders
> da lista do Market", não "otimizar o app"), corrige o que for necessário para aquele alvo, e para.
>
> **Limite conhecido:** essa skill assume as tools MCP live do `argent` (`react-profiler-*`,
> `debugger-evaluate`) pra fases de profiling/verificação. Não instalamos o CLI/MCP do `argent`
> neste repo — ele se sobrepõe ao `agent-device` já adotado (os dois automatizam
> device/simulador/emulador, e manter dois ecossistemas de automação ativos ao mesmo tempo é
> exatamente o tipo de redundância que este documento tenta evitar). Sem o MCP live, o
> `performance-executor` ainda aproveita o Phase 1 (lint sweep) e Phase 2 (sweep semântico) da
> skill — que não dependem de dispositivo — e usa `qa-runner`/`agent-device` como substituto pro
> Phase 3/4 (perfil visual e verificação em device). Se no futuro o profiling ficar insuficiente
> assim, migrar pro `argent` inteiro (e possivelmente aposentar `agent-device`) é uma decisão a
> avaliar — não algo pra fazer hoje sem necessidade concreta.

Regra herdada do próprio fluxo de trabalho do repo (`plans/epic-*/tickets.md`): **um ticket por vez,
um commit por ticket.** Isso vale também para os Executores — um Executor recebe um ticket do
Analista/orquestrador, não o epic inteiro. Limita o raio de ação de cada invocação individual.

### Exemplo completo — `ui-executor`

```markdown
---
name: ui-executor
description: >
  Use to implement a single, already-scoped UI ticket (screen, component, layout) in
  React Native + Expo Router + gluestack-ui v5 + NativeWind. Does not decide product scope —
  expects a ticket with explicit boundaries from an Analyst or the orchestrator.
tools: Read, Grep, Glob, Edit, Write, Bash, Skill
model: sonnet
---

Você implementa UI neste app Expo/React Native. Você recebe UM ticket já escopado — não amplie
o pedido, não refatore código adjacente que não foi pedido.

## Regras obrigatórias (não são sugestões)
- Componentes: `gluestack-ui v5` antes de primitivos RN crus. Wrappers vivem em `src/components/ui/`.
- Estilo: `NativeWind` (`className`). `className` com lógica condicional SEMPRE via `cn()` de
  `@/libs/utils` — nunca template literal.
- Cor primária: `lime-800`. Não introduza paleta concorrente.
- Ícones: só `lucide-react-native`.
- Formulários: sempre `KeyboardAvoidingView behavior="padding"` + `ScrollView` com
  `contentContainerClassName` para padding.
- Zero comentários explicativos por padrão no código.

## Antes de escrever
1. Confirme os limites do ticket (arquivos que pode tocar). Se o ticket exigir tocar fora
   desses limites, pare e devolva ao orquestrador em vez de expandir sozinho.
2. Use as skills `expo-router`, `expo-native-ui`, `expo-design-system`, `gluestack-ui-v4`,
   `expo-tailwind-setup` para padrões atualizados — não confie só em memória de treino.
3. Se o ticket envolve texto voltado ao usuário (copy de UI, mensagens de erro, empty states),
   use a skill `copywriting` ou `copy-editing`.

## Depois de escrever
Rode `npm run lint` e, se o ticket tiver testes associados, `npm test`. Não marque o ticket como
concluído — isso é decisão do orquestrador após o `qa-runner` validar.
```

### Exemplo (não implementado) — `observability-executor`

> Este arquivo `.claude/agents/observability-executor.md` **não existe no repo** — o resto dos
> 13 agents desta spec já foi implementado, esse ficou de fora por decisão explícita (ver
> status no topo do documento). O exemplo abaixo continua valendo como template pra quando
> `plans/epic-3-observability` decidir a ferramenta.

```markdown
---
name: observability-executor
description: >
  Use to implement error/crash/performance instrumentation (Sentry, PostHog, or EAS Observe)
  from a scoped ticket produced by observability-analyst. Does not decide which vendor to
  adopt — that decision belongs to plans/epic-3-observability and is made by a human.
tools: Read, Grep, Glob, Edit, Write, Bash, Skill
model: sonnet
---

Você instrumenta observabilidade neste app Expo/React Native. Você recebe um ticket já
escopado — qual sinal instrumentar (erro, trace, evento de produto), não qual ferramenta
adotar em definitivo.

## Contexto do repo
- `plans/epic-2-eas-observe/` — performance (cold/warm start, TTI) já implementado via EAS
  Observe, todos os 5 tickets concluídos.
- `plans/epic-3-observability/` — crash reporting + product analytics, **decisão de
  ferramenta ainda em aberto** (candidatos: Sentry/BugSnag para crash, PostHog/Amplitude/
  Firebase Analytics para produto). Se o ticket não especificar a ferramenta, pare e
  pergunte ao orquestrador — não escolha sozinho.

## Ao instrumentar
1. Use `sentry-get-started`/`sentry-react-native-sdk` (setup Expo+RN) ou
   `posthog-instrumentation` (eventos/feature flags) conforme a ferramenta do ticket.
2. `sentry-instrument` para sinais além de erro (tracing, profiling, session replay) — só se
   o ticket pedir explicitamente, não adicione sinais "por completude".
3. `sentry-setup-releases` quando o ticket envolver rastrear qual release introduziu um
   problema — isso cruza com `release-executor` (EAS build/submit); coordene via
   orquestrador em vez de tocar `eas.json`/workflows você mesmo.
4. Nunca capture PII sem necessidade (e-mail, nome completo, localização exata) nos eventos —
   este app lida com denúncias e dados de pesquisa com seres humanos (survey/TCLE).

## Ao investigar (não instrumentar)
Se o ticket for "por que esse erro está acontecendo" em vez de "adicionar esse sinal", isso é
trabalho do `observability-analyst` (`sentry-debug-issue`, `sentry-fix-stack-traces`) — devolva
ao orquestrador se receber esse tipo de pedido por engano.
```

### Exemplo completo — `qa-runner`

```markdown
---
name: qa-runner
description: >
  Use to verify a completed ticket by actually driving the running app via agent-device —
  screenshots, interaction, logs. Does not write code; reports pass/fail and evidence back
  to the orchestrator.
tools: Read, Grep, Glob, Bash, Skill
model: sonnet
---

Você verifica mudanças rodando o app de verdade — não lê só o diff.

## Pré-condição
O app já precisa estar rodando (`npm run android` ou `npm run ios` ou `npm start`). Você não
inicia build; se não houver processo rodando, pare e informe o orquestrador.

## Fluxo
1. `agent-device open <app> --platform <android|ios> --foreground`
2. `agent-device snapshot -i` para capturar refs interativos.
3. Execute o roteiro do ticket (toques, digitação, navegação) usando os refs.
4. Re-snapshot para verificar o resultado esperado.
5. Capture screenshot/log só quando agregar evidência real (não em todo passo).
6. `agent-device close` ao final.

## Ao encontrar um problema
Não corrija. Descreva o sintoma, o passo que reproduz, e devolva ao orquestrador — ele decide
qual executor (`ui-executor`, `data-executor`, `native-executor`) aciona para o fix.

## Skills de apoio
`android-emulator` / `ios-simulator` para o alvo específico; `dogfood` se o pedido for
exploratório ("será que tem mais alguma coisa quebrada por aqui") em vez de verificação de um
ticket específico.
```

## 5. Guardrails contra scope creep

Mecanismos concretos, não só disciplina de prompt:

1. **Estrutural — Analistas não têm `Edit`/`Write`.** Código só nasce depois de passar por um
   plano revisável. Isso é reforçado pelo `tools:` do agent, não só pedido no texto.
2. **Um ticket por invocação de Executor**, nunca o epic inteiro — limita o raio de ação de cada
   chamada individual (convenção já usada em `plans/epic-*/tickets.md`).
3. **Seção "Fora:" obrigatória** em todo plano de Analista — declara o que não deve ser tocado.
4. **Nenhum agent encadeia outro agent.** Só o orquestrador usa `Agent`. Evita árvores de
   delegação descontroladas, que são elas mesmas um jeito de o escopo crescer sem supervisão.
5. **Sem refatoração de carona.** Herda a regra geral do projeto: bug fix não leva refactor
   adjacente, tarefa pontual não leva abstração nova "pra generalizar".
6. **Gate de verificação antes de marcar ticket como feito.** `qa-runner` roda o app de verdade;
   só o orquestrador fecha o ticket depois disso.

**Limite honesto:** hoje não existe no Claude Code um jeito de restringir tecnicamente *em quais
arquivos* um agent pode escrever (o `tools:` restringe *quais ações* — Edit, Write, Bash — não
*em quais paths*). O confinamento por domínio dos Executores é convenção de prompt, reforçada pelo
escopo explícito do ticket que ele recebe — não um sandbox técnico. Vale lembrar disso ao avaliar
o quanto confiar num Executor sem revisão.

## 6. Inventário de skills instaladas (nível de projeto)

Todas em `.agents/skills/`, com symlink em `.claude/skills/` — ver `skills-lock.json`.

| Categoria | Skills | Consumidas por |
|---|---|---|
| Expo framework (OSS) | `expo-overview`, `expo-router`, `expo-native-ui`, `expo-design-system`, `expo-ui`, `expo-animation`, `expo-data-fetching`, `expo-tailwind-setup`, `expo-dom`, `expo-web-to-native`, `expo-module`, `expo-brownfield`, `expo-project-structure`, `expo-examples`, `expo-app-clip` | `ui-executor`, `data-executor`, `native-executor` |
| EAS (pago) | `eas-app-stores`, `eas-workflows`, `eas-hosting`, `eas-observe`, `eas-simulator`, `eas-update-insights`, `expo-dev-client`, `expo-upgrade` | `release-executor`, `qa-runner`, `observability-analyst`/`observability-executor` (`eas-observe`) |
| Automação de app/dispositivo | `agent-device`, `android-emulator`, `ios-simulator`, `dogfood` | `qa-runner` |
| Design/UI de terceiros | `gluestack-ui-v4`, `building-native-ui`, `vercel-react-native-skills` | `design-system-analyst`, `ui-executor` |
| Dados/dinheiro | `native-data-fetching`, `dinero-best-practices`, `dinero-currency-patterns`, `dinero-formatting` | `data-layer-analyst`, `data-executor` |
| Escrita | `copywriting`, `copy-editing` | `ui-executor`, `release-executor` (e qualquer um escrevendo texto pro usuário) |
| Performance/otimização | `argent-react-native-optimization`, `expo-react-native-performance`, `react-native-architecture`, `react-state-management`, `typescript-refactor`, `typescript-advanced-patterns` | `performance-executor` |
| Arquitetura e princípios de design | `solid`, `domain-driven-design`, `clean-architecture`, `clean-code` | Julgamento de qualquer Analista ao propor um plano; `data-layer-analyst` em especial (DDD mapeia direto pros `src/contexts/*` do app — cada context já é, na prática, um bounded context informal) |
| Estado/componentes React | `react-state-management`, `zustand`, `react-composition-2026` | `data-layer-analyst`/`data-executor` (estado), `design-system-analyst`/`ui-executor` (composição de componente) |
| Observabilidade (erro/crash/analytics) | `sentry-get-started`, `sentry-react-native-sdk`, `sentry-instrument`, `sentry-debug-issue`, `sentry-fix-stack-traces`, `sentry-setup-releases`, `posthog-instrumentation` | `observability-analyst` (as de `sentry-debug-issue`/`sentry-fix-stack-traces`), `observability-executor` (as demais) |
| Meta | `expo-skill-feedback` | Qualquer agent, para reportar falha/lacuna de uma skill |

> **Sentry e PostHog cobrem os dois candidatos citados no `plans/epic-3-observability`** (Sentry
> para crash, PostHog para product analytics) — instalar as skills não decide a ferramenta, só
> arma quem for executar o epic com conhecimento atualizado dos dois caminhos possíveis. A decisão
> em si continua em aberto e cabe a uma pessoa, não ao `observability-executor`.

> **MVVM não tem skill instalada de propósito.** As opções disponíveis no catálogo são todas de
> Kotlin/Android, SwiftUI ou WPF/MAUI — plataformas erradas pra este stack. MVVM não é como React
> pensa (não existe um "ViewModel" observável separado do componente — o hook já cumpre esse
> papel). `clean-architecture` cobre o problema real por trás do pedido (separar regra de negócio
> de apresentação) de um jeito que faz sentido aqui.

> **Gap conhecido:** as 23 skills `expo-*`/`eas-*` foram instaladas copiando o conteúdo do plugin
> oficial (`expo@claude-plugins-official`) manualmente, não via `npx skills add expo/skills`. Por
> isso elas não aparecem em `skills-lock.json` (só `expo-tailwind-setup`, que já existia antes por
> esse caminho, está lá). Reinstalar via `skills add` no futuro destravaria `skills update`
> automático para elas.

## 7. Como isso se conecta ao fluxo de trabalho existente

- **Planejamento:** saída dos Analistas alimenta `plans/epic-*/` (`epic-brief.md` → `tech-plan.md`
  → `tickets.md`), o mesmo formato já usado nos 8 epics existentes.
- **Branch/commit:** segue as regras já em vigor neste repo — nunca commit direto em
  `development`/`production`, uma branch por tarefa (não fragmentar), um commit por ticket, PR sem
  checklist de pendências (pendência vira ticket, não texto de PR).
- **Verificação:** `qa-runner` é o primeiro uso real do `agent-device` instalado nesta sessão — fecha
  o ciclo "escreveu código → rodou de verdade no emulador/simulador" sem depender de validação manual
  humana para todo ticket.
- **Escrita:** `copywriting`/`copy-editing` (instaladas nesta sessão) cobrem tanto texto de produto
  (UI, `ui-executor`) quanto texto de release (`release-executor`, release notes com limite de 500
  caracteres).
- **Observabilidade:** `observability-analyst` materializa a metade "entender o que já existe e
  o que falta" do `plans/epic-3-observability`, lendo o EAS Observe (epic-2, já implementado) —
  sem instrumentar nada novo. A metade "implementar" (`observability-executor`) fica só como
  template até alguém decidir Sentry vs. PostHog (ou outro).
- **Performance:** `performance-executor` não nasce de um epic específico — é acionado ad-hoc
  quando o pedido é "isso está lento"/"otimiza isso", não uma feature planejada.

## 8. Status atual e próximos passos

O que já existe:
- [x] Skills de automação de app (`agent-device` + 3 companheiras), copywriting,
      performance/TypeScript moderno, observabilidade (Sentry + PostHog) e arquitetura
      (SOLID/DDD/clean-architecture/clean-code, zustand, react-composition-2026) instaladas.
- [x] Os 13 arquivos `.claude/agents/*.md` (7 Analistas + 6 Executores/QA) implementados.
- [x] Integração com o pipeline OpenCode do repo `api` (`.opencode/prompt/*.md` desta mobile) —
      ver seção 9.
- [x] Este documento.

O que **não** existe ainda:
- [ ] `observability-executor` (decisão explícita — ver seção 7).
- [ ] Uma skill de projeto (não global) para gerar `epic-brief.md`/`tech-plan.md`/`tickets.md` no
      formato deste repo — hoje esse fluxo depende de skills globais de uma máquina específica.
- [ ] A decisão de ferramenta do `plans/epic-3-observability` em si (Sentry vs. BugSnag,
      PostHog vs. Amplitude/Firebase) — não é algo que este documento resolve.
- [ ] Validação prática: rodar esse pipeline numa tarefa real e medir se de fato reduz consumo de
      contexto/token frente ao agent generalista — é isso que o pedido original chamou de "testar
      essa prática", e é o próximo passo real agora que os agents existem de verdade.

## 9. Modelo híbrido: Claude Code + OpenCode

Dois motores diferentes, cada um no papel que faz sentido pro custo dele — não dois jeitos
concorrentes de fazer a mesma coisa.

### Claude Code — orquestração, julgamento e revisão (nunca a primeira tentativa de execução)

O **Orquestrador**, todo **Analista** e o **`qa-runner`** sempre rodam em Claude — são papéis de
julgamento (escopo, arquitetura, verificação), não de escrever o diff em si. Analistas seguem em
`model: sonnet`; `qa-runner` segue em `model: haiku` (protocolo fixo, pouca ambiguidade — só
promover pra `sonnet` se um caso concreto mostrar Haiku errando leitura de snapshot).

**Os 5 Executores (`ui-executor`, `data-executor`, `native-executor`, `release-executor`,
`performance-executor`) não são mais "Claude por padrão, OpenCode como economia opcional".**
Desde 2026-08-26, todo Executor tenta a cadeia de modelos gratuitos primeiro — sem exceção pra
native/release — e só escreve o código ele mesmo (em Claude) se a cadeia inteira falhar. A revisão
obrigatória (ver "Rede de segurança" abaixo) é o que torna isso seguro mesmo pra native/release,
que antes eram exceção por causa de blast radius alto (native só valida depois de build real,
release lida com credencial/char-limit exato) — antes essa cautela vinha de nunca delegar; agora
vem de sempre revisar antes de aceitar, delegado ou não.

### Cadeia de execução (por ticket, nesta ordem)

| # | Tier | Agent OpenCode | Modelo | Custo | Quando passa pro próximo |
|---|---|---|---|---|---|
| 1 | T1 free | `oikos-exec` | `opencode/big-pickle` | grátis | erro de cota/rate-limit |
| 2 | T1 free | `oikos-exec-alt` | `opencode/deepseek-v4-flash-free` | grátis | erro de cota **idêntico** ao do passo 1 → pula os dois provedores da OpenCode Zen no resto da sessão (ver nota de cota abaixo); erro diferente → tenta mesmo assim |
| 3 | T1 free | `oikos-exec-omni` | `omniroute/omini-free-tier` | grátis | falha de conexão ou timeout — ver nota sobre o combo custom abaixo |
| 4 | T2 pago | `oikos-exec-go` | `opencode-go/kimi-k2.7-code` | pago (crédito curto — escalonamento consciente) | falha ou diff ruim na revisão |
| 5 | Claude | Executor Claude, `model: haiku` (override do orquestrador na chamada `Agent`) | `claude-haiku-4-5` | pago (Anthropic) | diff ruim na revisão |
| 6 | Claude | Executor Claude, `model: sonnet` (default do agent, sem override) | `claude-sonnet-5` | pago (Anthropic) | — é o último tier, sempre funciona |

`oikos-exec-gemini` (`google/gemini-3.6-flash`) continua fora dessa cadeia linear — é uma escolha
por **formato da task** (muito contexto de leitura), não um degrau de fallback por custo; o
Executor Claude escolhe ele diretamente quando a task pedir isso, em vez de entrar na sequência
acima.

**Nota sobre cota compartilhada (não confirmada por documentação):** não há doc pública da
OpenCode Zen que diga se `big-pickle` e `deepseek-v4-flash-free` compartilham cota por conta ou
têm cota independente por modelo. Em vez de assumir, o passo 2 da cadeia funciona como teste
empírico por sessão: se o erro vier no mesmo formato do passo 1, trata como confirmado *para essa
sessão* e pula direto pro passo 3 nas próximas tentativas — não reabre a pergunta a cada ticket.

**OmniRoute** (`http://127.0.0.1:20128`, container Docker local, ver `docker ps` → `omniroute`)
agrega dezenas de provedores gratuitos por trás de um único endpoint compatível com OpenAI (GitHub
Copilot, Groq, NVIDIA NIM, Ollama Cloud, Kiro, OpenRouter free tier, e mais). Em vez de cadastrar
provedor por provedor no `opencode.json` (frágil — cada provedor tem limites próprios), usamos um
**combo custom criado no dashboard do OmniRoute**, `omini-free-tier` (`/api/combos`, `id
ef4ee986-7b43-4f2f-a387-47a8ae9360f7`, strategy `round-robin`) — em vez do combo genérico
`auto/coding:free` que o OmniRoute já expõe por padrão. A diferença: o combo custom só roteia entre
os providers que o usuário escolheu manualmente adicionar (controle explícito sobre quais
provedores participam), enquanto `auto/coding:free` tenta todos os providers gratuitos conectados
sem curadoria. Sem autenticação necessária pro endpoint de chat (o container só escuta em
`127.0.0.1`); o management API (`/api/combos`, CRUD completo — GET/POST/PUT/DELETE/PATCH) aceita a
mesma chave Bearer usada no MCP — **confirmado na prática**: a IA consegue listar, adicionar,
remover e testar providers dentro de um combo diretamente via `PUT /api/combos/{id}` (mandando o
objeto completo com o array `models` atualizado), sem precisar do dashboard. Só a criação do combo
em si e a chave Bearer continuam sendo setup humano inicial.

**Achados reais testando esse tier (sessão de 2026-08-26/27, incompleta — retomar):**

1. **Cap de 128 tools do Groq.** OpenCode manda no `tools` da request toda capacidade de todo MCP
   habilitado globalmente pro agent — não só os builtins. Neste repo isso somava ~137 tools
   (`metro-mcp`: 88, `chrome-devtools-mcp`: 29, builtins do OpenCode: 12, `pencil`: 4, `context7`:
   2), e o Groq rejeita requests com mais de 128. **Corrigido**: restrição por agent via
   `permission` com wildcard (`"chrome-devtools_*": "deny"`, `"metro-mcp_*": "deny"` em cada agent
   `oikos-*` no `opencode.json` global) — a doc oficial do OpenCode confirma que `deny` remove a
   tool da descrição mandada pro modelo, não só bloqueia a execução. `Framelink_Figma_MCP` foi
   removido do config global por não ser mais necessário.
2. **TPM (tokens/minuto) do tier free do Groq.** Com só `groq/qwen/qwen3.6-27b` no combo, uma task
   real (dispatch de commit via `oikos-exec-omni`, ~17-44k tokens de contexto) bateu em
   `[413] tokens per minute (TPM): Limit 8000` — estrutural do tier gratuito daquele
   provider/modelo, não contornável via config. Só serve pra prompts pequenos (testado: chat
   simples de 16 tokens respondeu em 1.4s).
3. **Kiro — status de custo incerto, não confirmado.** Testei adicionar `kiro/claude-haiku-4.5` ao
   combo — funcionou tecnicamente (roteou certo, aguentou 24k tokens sem erro de TPM, 3.5s de
   latência), mas o header `x-omniroute-response-cost` veio com valor não-zero (~$0.012 numa
   chamada de 24k tokens; bate com `cost: 0.002362` já visto no `omniroute_cost_report` pra esse
   modelo). A conexão (`GET /api/providers`) mostra `authType: oauth`, importada via GitHub, ligada
   a um `profileArn` da AWS CodeWhisperer — é o Kiro da AWS, que tem plano com cota **mensal de
   créditos gratuitos**. Não achei nenhum campo que confirme se esse `response-cost` é cobrança real
   ou só uma estimativa interna do OmniRoute consumindo a cota grátis mensal (hipótese do usuário,
   plausível, não verificada). **Removido do combo por precaução** até confirmar — sem certeza não
   vale arriscar consumo de cota/crédito real do usuário só pra um teste de infraestrutura.
4. **`opencode/mimo-v2.5-free` (candidato free real, teste inconcluso).** Adicionado ao combo no
   lugar do Kiro — mesma conta OpenCode Zen já usada por `oikos-exec`/`oikos-exec-alt`, mas roteada
   pelo omniroute (contexto de 1M tokens, sem custo). Primeiro teste real (24k tokens) bateu em
   `[429] Rate limit exceeded` — pode ser limite real do free tier desse modelo ou só as várias
   chamadas de teste anteriores nesta sessão saturando a mesma conta. **Não teve tempo de reteste.**

**Estado do combo `omini-free-tier` ao pausar (2026-08-27, ~01:30 UTC):**
`groq/qwen/qwen3.6-27b` + `opencode/mimo-v2.5-free`. Não confiar nesse tier em produção até o
próximo teste confirmar se o 429 foi transitório.

**Próximos passos (retomar em sessão futura):**
- Confirmar se o Kiro (AWS) cobra de verdade ou só consome cota mensal grátis — se for cota grátis,
  ele volta a ser candidato válido pro combo (teve 100% de sucesso e sem cap de TPM/tools nos
  testes).
- Retestar `opencode/mimo-v2.5-free` isolado (fora do horário de pico de uso da conta) pra separar
  rate-limit real de saturação temporária da sessão de testes.
- Se confirmar 429 persistente, tentar outro candidato genuinamente free: `nvidia` (NVIDIA NIM,
  `tokenStatus: valid` no quota check) ou `github` (Copilot, mesma ressalva).
- Só depois de achar 1-2 providers realmente free e estáveis sob carga real, rodar de novo o
  dispatch completo do `oikos-exec-omni` fazendo um commit de verdade (teste ponta-a-ponta que
  ainda não foi concluído com sucesso).
- Até lá, uma falha nesse tier deve escalar pro passo 4 (`oikos-exec-go`) sem insistir.

`.opencode/prompt/{oikos-exec,oikos-review,oikos-text}.md` **neste repo** dão a cada tier as
convenções da mobile (gluestack-ui/NativeWind, `android/`/`ios/` gerados, `oikos-sdk` gerado) —
os agents em si (modelo, permissão, fallback, provider `omniroute`) continuam definidos
globalmente (`~/.config/opencode/opencode.json`), então o mesmo pipeline atende `api`, `mobile`, e
qualquer outro repo do org que ganhar seu próprio `.opencode/prompt/`.

**Como um Executor Claude despacha pro OpenCode:** via Bash, não via tool `Agent` (são processos
completamente separados) —

```
opencode run --agent oikos-exec --format json "<task totalmente especificada>"
```

A task só deve ser despachada quando **não sobra nenhuma decisão de design** pro worker —
arquivos exatos, padrão exato, exemplo já escrito pelo Executor Claude. O worker executa, não
julga escopo.

### Rede de segurança: code review obrigatório em toda saída, de qualquer tier

Isso é o que viabiliza usar gratuito por padrão até em native/release: **nenhuma saída de
Executor — de qualquer um dos 6 tiers acima, inclusive quando o próprio Sonnet escreveu — é
aceita sem passar pelo `/code-review` do orquestrador antes do ticket ser marcado concluído.**
Não é uma sugestão do Executor "reviso se achar necessário" — é um portão que o orquestrador
sempre aciona. Erro de um tier barato custa uma rodada de revisão + nova tentativa no próximo
tier; sem essa rede, custaria descobrir o erro em produção (native) ou numa loja (release), que é
exatamente o motivo que antes justificava excluir esses dois da delegação.

### Por que não mais provedores gratuitos, nem modelo local mais pesado

Documentado aqui porque foi decisão explícita, não omissão: fora do que já está configurado
(`big-pickle`, `deepseek-v4-flash-free`, `gemini-3.6-flash`, e agora o combo do OmniRoute, que por
si só cobre a maior parte do espaço de "mais um provedor gratuito"), modelos locais
(`qwen2.5-coder:3b` via Ollama) não têm reasoning suficiente pra código real neste projeto — por
isso ficam restritos a T0 (texto puro). Se isso mudar (hardware melhor, modelo local mais forte),
revisar essa restrição é razoável — não é um limite permanente, é o estado real de hoje
(2026-08-26).
