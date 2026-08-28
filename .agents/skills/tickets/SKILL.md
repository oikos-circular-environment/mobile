---
name: tickets
description: Use after a Tech Plan exists, to break it into a ticket breakdown at plans/epic-N-<slug>/tickets.md for this repo. Trigger phrases — "quebra em tickets", "cria o ticket breakdown", "/tickets". Produces the file the orchestrator and any Executor agent treats as source of truth for progress — includes a mermaid dependency diagram and a running status log.
metadata:
  version: 1.0.0
---

# Ticket Breakdown — Oikos Mobile

Versão local (não depende de skill global de máquina) do terceiro passo do fluxo
`plans/epic-*/`. Ver `plans/epic-9-*/tickets.md` como referência de forma real — esse
arquivo é a **fonte de verdade de onde o trabalho parou**, tanto pro orquestrador quanto
pra qualquer Executor (`ui-executor`, `data-executor`, etc.) que retomar depois.

## Processo

1. Revise `epic-brief.md` e `tech-plan.md` deste epic; identifique unidades de trabalho
   naturais.
2. Aplique bom julgamento pra agrupar:
   - Por componente, camada ou bug/causa — nunca por função individual.
   - Considere dependências reais entre partes do trabalho.
   - Cada ticket é do tamanho de uma story (trabalho significativo), não uma função só.

   **Anti-padrão:** não quebre demais. O conjunto mínimo de tickets é melhor que muitos
   tickets pequenos.
3. Rascunhe cada ticket com: título orientado à ação, escopo (o que entra / o que fica
   explicitamente fora), referências de spec (link pra seção do brief/tech-plan),
   dependências.
4. Apresente o breakdown proposto ao usuário com um diagrama mermaid de dependências.
5. Itere com o feedback do usuário (granularidade, reordenar, agrupamento diferente) até
   o breakdown estar correto.

## Template (formato real deste repo)

```markdown
# Ticket Breakdown — Epic N: <Título>

​```mermaid
graph LR
    T1[Ticket 1: <nome curto>] --> T2[Ticket 2: <nome curto>]
    T3[Ticket 3: <nome curto>]
​```

Cada item de escopo é uma checkbox: `[x]` feito, `[ ]` pendente. Ao retomar o trabalho,
este arquivo é a fonte de verdade de onde paramos.

Branch: `<tipo>/<slug>` (criada a partir de `development`/`origin/development`). Um
commit por ticket.

---

## Ticket N — <Título orientado à ação>

**Status:** ⬜ Pendente / ✅ Concluído (+ ressalva se validação manual falta) / 🔶 Em
andamento.

**Escopo:**
- [ ] Item concreto, com arquivo:linha quando já souber.

**Testes:**
- [ ] O que cobrir, ou nota explícita do porquê não há teste automatizado (ex.: race
  condition ligada a timing nativo real, RNTL/jsdom não reproduz).

**Validação:** comandos rodados (`tsc --noEmit`, `lint`, `test`) e, se pendente,
o roteiro manual exato que falta.

**Commit:** hash + mensagem, depois de feito.

**Referências de spec:** aponte pra seção específica do tech-plan.md/epic-brief.md, não
só "ver tech plan".

**Dependências:** outro(s) ticket(s), ou "nenhuma".

---

## Ordem sugerida de execução
Lista numerada com justificativa curta de por que essa ordem (menor superfície primeiro,
o que desbloqueia mais, o que depende de quê).

## Status geral
Atualizado a cada rodada de execução: quantos tickets concluídos, resultado agregado de
tsc/lint/test, o que falta (inclusive validação manual pendente e se a PR já foi aberta).
```

A seção final "Status geral" não está no esqueleto genérico do fluxo, mas é prática já
estabelecida — mantenha-a atualizada conforme os tickets avançam, não só no fim.

## Onde salvar

`plans/epic-N-<slug>/tickets.md`, mesmo `N`/slug do brief/tech-plan correspondentes.

## Depois de gerar

Este documento não escreve código — devolve o breakdown ao orquestrador (ou ao usuário)
decidir qual Executor (`ui-executor`, `data-executor`, `native-executor`,
`release-executor`, `performance-executor`) roda cada ticket, um por vez, um commit por
ticket, seguindo a regra geral do repo (ver `docs/agent-architecture.md` seção 4).

## Próxima fase sugerida

Execução dos tickets (via Executor apropriado) e, ao final de cada um, verificação real
via `qa-runner`/`agent-device` antes de marcar como concluído.
