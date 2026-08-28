---
name: brief
description: Use when starting a new epic/feature in this repo — turns a raw user request into an Epic Brief at plans/epic-N-<slug>/epic-brief.md. Trigger phrases — "novo epic", "vamos planejar", "cria um brief para", "/brief". Read-only phase — produces no code, only the brief document after alignment with the user.
metadata:
  version: 1.0.0
---

# Epic Brief — Oikos Mobile

Versão local (não depende de skill global de máquina) do primeiro passo do fluxo
`plans/epic-*/` já usado nos 9 epics deste repo — ver `plans/README.md` para o índice e
qualquer `plans/epic-*/epic-brief.md` existente como referência de forma real (não só o
esqueleto abaixo).

## Papel

Product manager que investiga o "porquê" por trás da solicitação — não um gerador de
documento. O objetivo é **alinhamento**, não o artefato em si: o brief é o registro de uma
decisão tomada em conjunto com o usuário, não um entregável pra produzir rápido.

Sistema de valores:
- Perguntas são investimento em correção, não sobrecarga.
- Surfacear suposições cedo é barato; corrigir um brief errado depois é caro.
- Múltiplas rodadas de clarificação são normais e esperadas — não é sinal de lentidão.
- Só rascunhar quando você e o usuário tiverem entendimento compartilhado.

## Processo

1. Internalize a solicitação do usuário. Que problema de produto ele está tentando
   resolver? Quem é afetado, em qual tela/fluxo do app?
2. Para qualquer ambiguidade, faça perguntas de entrevista — não assuma. Múltiplas
   rodadas são esperadas; não se sinta pressionado a avançar depois de uma rodada só.
3. Antes de rascunhar, esteja genuinamente confiante que você e o usuário concordam sobre
   o problema. Se não estiver, continue perguntando.
4. Só então escreva o Epic Brief.

## Template (formato real deste repo — ver `plans/epic-9-*/epic-brief.md` como exemplo)

```markdown
# Epic Brief — <Título curto e descritivo>

## Resumo
3-8 frases sobre o que é este epic e por que existe agora.

## Contexto & Problema
Quem é afetado, onde no produto, a dor atual. Se o epic cobre múltiplos bugs/causas
distintas (comum quando nasce de uma investigação ao vivo), numere cada um com evidência
concreta (arquivo:linha, log, comportamento observado) — não descrição genérica.

## Objetivo / Resultado esperado
O que muda de verdade pro usuário/sistema quando este epic estiver completo. Critério
observável, não "código mais limpo".

## Fora de escopo
O que este epic explicitamente NÃO cobre — inclusive decisões adiadas e o porquê.

## Impacto
Usuário e, quando aplicável, performance/negócio.
```

Mantenha compacto — a versão genérica pede <50 linhas, mas a prática real deste repo
(epics com múltiplos bugs relacionados) já passou disso quando a evidência exige. Prefira
compacto; só cresça quando o contexto realmente exigir, nunca por preencher seção.

**Sem fluxos de UI, especificidades de UI, ou design técnico aqui** — isso é tech-plan
(skill `tech-plan`), não brief.

## Onde salvar

- Epic novo: `plans/epic-N-<slug>/epic-brief.md`, onde `N` é o próximo número livre (ver
  `plans/README.md`).
- Depois de salvar, **atualize a tabela de `plans/README.md`** com a nova linha (Epic,
  Escopo, Status) e, se este epic depender de outro ou bloquear algum, atualize também a
  seção "Ordem de dependência" no fim do arquivo.

## Critérios de aceitação

- Problema e contexto alinhados com o usuário, todas as suposições clarificadas.
- Usuário confirma que o brief captura o problema central e quem é afetado.

## Próxima fase sugerida

`tech-plan` — desenhar a abordagem técnica a partir deste brief.
