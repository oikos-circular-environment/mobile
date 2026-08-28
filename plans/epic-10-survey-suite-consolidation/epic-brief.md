# Epic Brief — Consolidação do survey mode (5 suítes → 1)

## Resumo

Testes de usabilidade rodados na v1.0.4 mostraram que a estrutura atual de 5-6 suítes
do survey mode é repetitiva e cansativa — o participante sente que "tem mais uma coisa
pra fazer" e perde paciência antes de terminar. O epic reduz para **uma única suíte**
por participante, cobrindo exploração do app (Pontos de Coleta + Denúncias) e o ciclo
completo de uma denúncia (criar, ver, votar, resolver). Cadastro de empresa/órgão sai
do escopo de pesquisa; cadastro de conta/perfil deixa de ser uma etapa manual avaliada
e vira uma conta sintética criada automaticamente, invisível ao participante.

Cross-repo: metade no repo `survey` (protocolo/backend), metade no `mobile` (execução).

## Contexto & Problema

### Estrutura atual (protocolo v9)
5 suítes (`S1` exploração livre anônima, `S2` conta+perfil, `S3` cadastro de empresa,
`S5` cadastro de órgão + ação em denúncias, `S6` participação cidadã), cada persona
roda um subconjunto de 2-3 delas. `S2` é feita manualmente pelo participante e é
justamente a parte mais entediante/repetitiva. `S3`/`S5` pedem cadastro de
empresa/órgão do zero — tarefa longa que ninguém quer fazer num teste de usabilidade.

### Bug de sinal em T12
"Visualizar o mapa de denúncias" só conclui com a chamada de API
`GET /v1/complaints/map`. Se o participante já carregou essa tela antes (React Query
cacheia), reabrir a aba não dispara a chamada de novo e a tarefa nunca avança — sem
nenhum incentivo pro participante continuar.

### Micro-tarefas de filtro
Pontos de Coleta e Denúncias têm uma task por tipo de filtro (raio, categoria, busca,
status, periculosidade) — o participante fica testando controle por controle sem
entender bem o propósito de cada um, o que também contribui pro cansaço.

### Restrição inegociável
Sessões já concluídas em produção não podem ser invalidadas nem pedir pro participante
refazer. O mecanismo de versionamento do protocolo (nunca edita em lugar, sempre nova
versão + reseed, sessão presa a UUID versionado) já resolve isso — mesma operação já
feita uma vez (remoção da S4 na v8).

## Objetivo / Resultado esperado

- Todas as 5 personas rodam a mesma suíte única — persona vira só caracterização do
  testador, não seleciona mais conteúdo de teste.
- Cadastro de conta/perfil automático e invisível (conta sintética), sem entrar na
  telemetria da tarefa.
- T12 conclui só de abrir a aba, mesmo com API em cache.
- Filtros viram uma task genérica por tela ("usou algum filtro"), não uma por tipo.
- Sessão local em andamento no momento do rollout é descartada (não tenta resumir);
  sessão concluída fica intacta.

## Fora de escopo

- Cadastro de empresa/ponto de coleta/órgão como parte do teste (tasks `T1`-`T7`,
  `T20` saem do protocolo).
- Limpeza server-side de sessões incompletas presas a versões antigas (fica como nota,
  não como tarefa — schema não exige, são linhas históricas inofensivas).
- Redesenho visual das telas do survey — mudança é de conteúdo/protocolo e de fluxo de
  autenticação, não de UI.

## Impacto

- **Pesquisa**: teste vira 1 sessão em vez de 5-6, sem perder cobertura das jornadas
  centrais (navegar + denunciar).
- **Participante**: entra direto na exploração, sem tela de cadastro; filtro vira
  algo pra brincar, não pra decorar.
- **Compatibilidade**: zero impacto em sessões já concluídas.
