---
name: tech-plan
description: Use after an Epic Brief exists, to design the technical approach and produce plans/epic-N-<slug>/tech-plan.md for this repo. Trigger phrases — "desenha a arquitetura", "como vamos implementar", "cria o tech plan", "/tech-plan". Interactive, section-by-section alignment with the user — not a document generated in one shot.
metadata:
  version: 1.0.0
---

# Tech Plan — Oikos Mobile

Versão local (não depende de skill global de máquina) do segundo passo do fluxo
`plans/epic-*/`. Ver `plans/epic-9-*/tech-plan.md` (ou qualquer outro epic) como
referência de forma real — o template abaixo já reflete o que esse exemplo pratica, que
vai um pouco além do esqueleto mínimo quando o caso pede.

## Processo interativo obrigatório

Esta fase exige colaboração passo a passo — **não pule clarificação por eficiência**, nem
produza o documento inteiro de uma vez sem checar com o usuário.

## Papel

Arquiteto técnico que vê cada componente no contexto do sistema inteiro.

Foco em:
- Fundamentar recomendações no codebase real deste app (grep, leitura de arquivos
  tocados), nunca em suposição genérica de "como React Native geralmente funciona".
- Começar simples, com caminho claro pra escalar depois se precisar.
- Deixar os fluxos do usuário (epic-brief) informar as escolhas técnicas, não o
  contrário.
- Rastrear uma requisição de ponta a ponta pelo design proposto.
- Considerar modos de falha — o que quebra, o que se recupera.

## Processo

1. Internalize o problema a partir do `epic-brief.md` deste epic.
2. **Analise o codebase de verdade primeiro** — grep pelos arquivos/padrões relevantes
   (auth, context, componente, etc.) antes de propor qualquer coisa. Toda recomendação
   deve citar arquivo:linha real, não descrição genérica.
3. Pense no design de alto nível antes de perguntar ao usuário: rastreie uma requisição
   de ponta a ponta pelo design proposto, mude um requisito e veja o que isso quebra,
   injete uma falha em cada ponto.
4. Apresente a direção proposta + suposições-chave ao usuário via perguntas de
   entrevista. Alinhe a abordagem geral **antes** de detalhar seção por seção.
5. Trabalhe cada seção do template abaixo, uma de cada vez, no ciclo:
   **pense → pergunte (se houver decisão não óbvia) → documente**. Só escreva a seção
   depois de alinhamento — o documento registra decisões tomadas, não deliberação em
   andamento.

## Template (formato real deste repo)

```markdown
# Tech Plan — Epic N: <Título>

## Abordagem arquitetural
Decisões-chave e trade-offs, com o "porquê" de cada uma (subsections "Por que X resolve
Y" são o padrão deste repo quando o epic cobre múltiplos bugs/causas — ver epic-9). Cite
arquivo:linha real. <100 linhas.

## Modelo de dados / assinaturas
Snippets **curtos**, só pra ilustrar uma mudança de assinatura/interface (antes/depois) —
não lógica de negócio inteira. <100 linhas.

## Arquitetura de componentes / arquivos
Lista concreta de arquivos tocados, agrupada por causa/bug/fluxo (não por função
individual). Sem estrutura de repositório genérica, sem detalhe de implementação de
lógica de negócio — só o que muda e onde.

## Riscos / atenção
O que pode dar errado nessa abordagem, o que precisa de validação especial (ex.: só
reproduz em hardware físico, muda comportamento de cache, etc.).

## Validação
Como confirmar que funcionou: comandos (`tsc --noEmit`, `lint`, `test`) e, quando
aplicável, roteiro de reprodução manual via `agent-device`.
```

As duas últimas seções (Riscos/atenção, Validação) não fazem parte do esqueleto genérico
de 3 seções, mas são prática já estabelecida nos epics reais deste repo — mantenha-as.

**Nunca inclua snippets de código de lógica de negócio completa** — só schemas,
assinaturas, interfaces. Se a tentação for colar uma função inteira, é sinal de que
aquilo é detalhe de implementação e pertence ao ticket/execução, não ao plano.

## Onde salvar

`plans/epic-N-<slug>/tech-plan.md`, mesmo `N`/slug do `epic-brief.md` correspondente.

## Critérios de aceitação

- Abordagem arquitetural alinhada com o usuário, suposições clarificadas.
- Decisões e trade-offs chave capturados com alinhamento do usuário.
- Usuário confirma a direção técnica.

## Próxima fase sugerida

`tickets` — quebrar este plano em unidades de trabalho executáveis.
