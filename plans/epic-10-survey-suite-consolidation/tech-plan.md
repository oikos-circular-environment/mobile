# Tech Plan — Epic 10: Consolidação do survey mode (5 suítes → 1)

Épico cross-repo: metade em `/media/ccrs/development/oikos/survey` (protocolo/backend),
metade em `/media/ccrs/development/oikos/mobile` (execução). Ver `epic-brief.md` para o
contexto de pesquisa que motivou a mudança.

## Ordem de execução (obrigatória)

O trabalho no repo `survey` — código, PR até `production` — vem **primeiro** e precisa
estar publicado antes de tocar no `mobile`. `.github/workflows/publish-packages.yml`
nesse repo publica `@oikos-circular-environment/survey-db`/`survey-api` no GitHub
Packages automaticamente ao chegar em `production` (bump de versão `major.minor.<run
number>`) — não existe passo manual de `npm publish`. Ver `tickets.md` para o
sequenciamento exato.

## Abordagem arquitetural

### 1. Protocolo v10 (repo `survey`)

Mecanismo de versionamento já existente é reaproveitado sem mudança de schema: cada
`bun run db:seed` cria linhas novas (UUIDs) para uma nova `protocolVersions` e desativa
a anterior; sessões antigas ficam presas por FK sem cascade
(`suiteRuns.suiteId`→`suiteDefs.id`, `sessions.protocolVersionId`), então não são
afetadas. Esse exato tipo de operação (aposentar suíte, manter dado antigo válido) já
foi feito em produção — remoção da S4 na v8 (commit `499035d`).

`packages/db/src/protocol/data.ts` (hoje `version: 9`):

- **Tasks removidas**: `T1`-`T7`, `T20` (conta/perfil/cadastro de empresa/órgão — fora
  do escopo de pesquisa a partir de agora).
- **T12 "Visualizar o mapa de denúncias" — fix de sinal**: hoje só conclui com
  `GET /v1/complaints/map`, que não dispara de novo se a tela já foi carregada antes
  (cache do React Query) — participante abre a aba e a tarefa não avança, sem
  incentivo. Novo `success`: `mode: "any"` com o `api` que já existe **+**
  `{ kind: "screen", route: "/complaints" }`. Confirmado em `signal-matcher.ts` +
  `use-survey-task-detection.ts`: `pathname` vem de `usePathname()` (expo-router), que
  já remove o grupo de rota `(tabs)` — `/complaints` é o pathname real de
  `src/app/(tabs)/complaints/index.tsx`. Nenhuma mudança de código no mobile — o
  watcher já suporta múltiplos tipos de sinal em `mode: "any"`.
- **Consolidação das micro-tarefas de filtro** (pedido explícito: aceitar qualquer
  interação de filtro, não testar botão por botão):
  - Código `T8` reaproveitado para task única "Usar os filtros de Pontos de Coleta",
    `mode: "any"`, juntando os sinais hoje espalhados em `T8`+`T9`+`T10` (raio ≠ 2000,
    categoria presente, busca por texto presente).
  - Código `T13` reaproveitado para task única "Usar os filtros de Denúncias",
    `mode: "any"`, juntando os sinais hoje em `T13`+`T14`+`T15` (status ≠ OPEN,
    categoria de resíduo presente, nível de periculosidade presente).
  - `T9`, `T10`, `T14`, `T15` deixam de existir como códigos próprios.
  - `T11` (detalhe de empresa) e `T16`-`T19` (ciclo de denúncia) ficam como estão.
- **Suítes**: as 5 entradas (`S1`,`S2`,`S3`,`S5`,`S6`) viram uma única, reaproveitando
  o código `S1`, título `"Teste de Usabilidade"` (definido pelo usuário),
  `task_codes: ["T8","T11","T12","T13","T16","T17","T18","T19"]`.
- **Personas**: as 5 personas passam a ter `suites: [{ suite_code: "S1",
  specific_objectives: [...] }]` — um único item. `specific_objectives` reaproveita os
  bullets atuais de S1/S6 (e de S3/S5 quando fazem sentido sem cadastro) de cada
  persona, descartando qualquer bullet sobre cadastrar empresa/ponto de coleta/órgão.
- `screenerQuestions`/`perSuiteQuestions`/`finalQuestions` não mudam —
  `perSuiteQuestions` passa a rodar 1x por participante em vez de 2-3x, parte do
  ganho pedido.
- Bump `version: 10`; regenerar `route-signals.generated.json`
  (`generate-route-signals.ts`, mesmo processo da remoção da S4).
- `usability-schemas.ts` (zod da API): códigos de suíte/task já são `z.string().max(8)`
  livre, não enum — nenhuma mudança necessária.

### 2. Conta sintética automática (repo `mobile`)

Só começa depois do protocolo v10 publicado e `@oikos-circular-environment/survey-api`
atualizado no `package.json` do mobile.

Disparo: logo após o aceite do TCLE em `consent.tsx` (`handleAccept`), antes de
persona/characterization/`suite-intro`. O event recorder do survey só liga em
`suite-intro.tsx` (`startEventRecorder`/`beginSuite()`), então as chamadas de
registro/login/perfil não entram na telemetria do teste — a ordem por si só já
satisfaz esse requisito, sem precisar suprimir sinal manualmente.

Fluxo: se já autenticado, `signOut({ silent: true })` (nova opção, pula toast +
navegação, mantém revogação de token e limpeza de estado — corrige de graça um bug
existente onde `consent.tsx` chama `signOut()` sem `await`) → `provisionSyntheticParticipant()`
(novo módulo: `postV1UsersRegister` → `postV1AuthLogin` → `putV1Profiles`, dados via
`fakerPT_BR`) → `refreshSession()` (wrapper novo do `refetch` que já existe em
`auth-context.tsx`) → navega. `needsProfileCompletion` (`auth-context.tsx:359`) só
depende de `profile` existir — avatar não é obrigatório, `putV1ProfilesAvatar` fica de
fora, endereço também (campo opcional em `PutV1ProfilesData`, evita fabricar código
IBGE).

Email sintético: `oikos-survey-<uuid>@participant.invalid` — domínio reservado RFC
2606 (nunca resolve de verdade), sem colisão, filtrável.

### 3. Sessão em andamento presa a versão antiga (repo `mobile`)

Requisito do usuário: sessão local **em andamento** no momento em que uma nova versão
do protocolo é detectada é fechada e apagada — não tenta resumir. Sessões
**concluídas** ficam intactas.

Causa raiz do bug hoje: `protocol-cache.ts` guarda uma única linha por `protocolKey`
(sem versão), sempre sobrescrita pelo fetch mais recente
(`onConflictDoUpdate`). `restore-session.ts` resolve a fila de suítes contra o
protocolo *atual* em cache, não contra o que a sessão em andamento estava rodando —
`surveySession.protocolVersion` já existe como coluna mas nunca é lido de volta.

Fix: `RestoredSession` ganha `protocolVersion`. Em `restoreSurveySessionIfNeeded()`,
sessão `IN_PROGRESS` busca o protocolo **preferindo rede** (não cache) — só assim uma
versão recém-publicada é detectada mesmo com cache velho; grava no cache em caso de
sucesso, cai pro cache só se a rede falhar (offline). `COMPLETED`/`ABANDONED` mantêm o
comportamento atual (cache primeiro). Se a versão buscada ≠ `protocolVersion` da sessão
e ela está `IN_PROGRESS`: `deleteLocalSurveyData(sessionId)` (já existe) e retorna
`null` em vez de tentar `restoreSurveyExecution`. Cascade do schema
(`onDelete: "cascade"` em `survey_suite_run`/`survey_task_run`/`survey_event`/
`survey_answer`/`survey_outbox`, confirmado em `db/schema.ts`) apaga tudo com uma única
deleção da linha em `survey_session`. `restoreLatestSurveySession()` já retorna `null`
de cara se não houver sessão local — a maioria dos devices não paga o round-trip extra.

Lado servidor: nenhuma limpeza obrigatória — sessão incompleta presa a versão
desativada fica como linha histórica inofensiva (sem cascade, dashboard já lê por
`protocolVersionId`).

### 4. Copy (repo `mobile`)

Três telas descrevem comportamento que deixa de existir com a conta sintética:
`survey/index.tsx` (aviso "a pesquisa começa como visitante"),
`consent-ended.tsx` (mesma frase), `persona.tsx` (subtítulo "Isso define quais etapas
você vai realizar" — falso agora que toda persona roda a mesma suíte).

## Arquivos-chave

**Repo `survey`**
- `packages/db/src/protocol/data.ts`
- `packages/db/src/protocol/route-signals.generated.json` (regenerado)

**Repo `mobile`**
- `package.json` (`@oikos-circular-environment/survey-api`, `@faker-js/faker` →
  `dependencies`)
- `src/libs/survey/synthetic-participant.ts` (novo)
- `src/contexts/auth-context.tsx`
- `src/app/survey/consent.tsx`
- `src/libs/survey/restore-session.ts`
- `src/app/survey/index.tsx`, `src/app/survey/consent-ended.tsx`,
  `src/app/survey/persona.tsx` (copy)

## Riscos / atenção

- **Ordem entre repos é rígida**: mobile não pode referenciar o novo suite/task antes
  do pacote `survey-api` estar publicado — protocolo é lido de tabelas do banco, não do
  `data.ts` bruto, então até o `db:seed` rodar contra o ambiente alvo, o mobile
  continua vendo a v9.
- **Sessões `IN_PROGRESS` no momento do rollout são destrutivamente descartadas** — é
  o comportamento pedido explicitamente pelo usuário, não um efeito colateral a
  esconder; vale confirmar que não há teste em campo ativo no momento do deploy do
  `db:seed`.
- **`needsProfileCompletion`** dispara um `useEffect` global em `auth-context.tsx`
  (linha ~339) que redireciona para `/profile` com toast sempre que
  `isAuthenticated && user === null`. A sequência do provisionamento evita esse estado
  transitório porque `refreshSession()` só é chamado depois que `putV1Profiles` já
  terminou — não inverter essa ordem.

## Validação

- Repo `survey`: `bun test` nos arquivos afetados; `db:generate` local confirmando que
  não gera migration nova; `bun run db:seed` local e conferir no dashboard que v9 vira
  `isActive: false` e v10 `isActive: true`, com sessão antiga ainda navegável em
  `get-tester-detail`.
- Repo `mobile`: fluxo feliz ponta a ponta via `agent-device` (Participar → TCLE →
  login automático sem tela de cadastro visível → persona → characterization → suíte
  única → criar denúncia → thanks), conferindo que `register`/`login`/`profile` não
  aparecem nos eventos da sessão; T12 conclui só abrindo a aba mesmo com cache; qualquer
  filtro em Pontos de Coleta/Denúncias conclui a task correspondente; sessão
  `IN_PROGRESS` é apagada ao detectar nova versão, `COMPLETED` não é tocada; `npm test`
  limpo.
