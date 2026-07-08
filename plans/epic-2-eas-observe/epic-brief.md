# Epic Brief — EAS Observe (Performance Monitoring)

## Resumo

O app Oikos vai para produção sem nenhuma visibilidade sobre performance real —
cold/warm start, tempo até interatividade (TTI), carregamento de bundle por rota.
Este epic instrumenta o app com o **EAS Observe** (`expo-observe`), liberado no
plano Expo Starter, cobrindo as métricas nativas via `AppMetricsRoot`/`ObserveRoot`
e a integração automática com expo-router. Além da cobertura genérica por rota, o
epic adiciona eventos customizados (`Observe.logEvent`/`markInteractive`) nos
contextos de maior valor de produto: `profile`, `companies`, `market` e
`complaints`. O escopo é **só instrumentação** — analisar os dados coletados e agir
sobre eventuais gargalos de performance é trabalho de um epic futuro, depois que
houver dados reais acumulados em produção.

## Contexto & Problema

- **Quem é afetado**: o time de engenharia, que hoje não tem nenhum dado sobre
  quão rápido (ou lento) o app realmente é para o usuário final em produção —
  qualquer regressão de performance passa despercebida até virar reclamação.
- **Onde no produto**: transversal (cold/warm start, navegação entre rotas), com
  ênfase nos fluxos de maior uso/valor: cadastro e atualização de perfil
  (`profile`), cadastro e atualização de empresas (`companies`), listagem e filtros
  do marketplace (`market`), e o fluxo completo de denúncias (`complaints`:
  criação, listagem, filtros, votação, resolução).
- **Dor atual**: zero instrumentação de performance. Não há como saber se o app
  demora para abrir, se uma rota específica trava a UI, ou se um fluxo crítico
  (ex: criação de denúncia com foto/vídeo) está degradando ao longo do tempo.

## Critérios de sucesso

- `expo-observe` instalado e configurado (`AppMetricsRoot`/`ObserveRoot`) na raiz
  do app, com a integração automática do expo-router ativa (TTR/TTI por rota).
- Eventos customizados cobrindo as interações relevantes de `profile`, `companies`,
  `market` e `complaints` (ex: submissão de formulário, aplicação de filtro, voto,
  resolução).
- Um Error Boundary React (hoje inexistente no projeto) capturando erros não
  tratados e reportando via `Observe.logEvent` (severity `error`/`fatal`, sem PII)
  — motivado pela rejeição da Apple (Guideline 2.1(a), ver Epic 5): hoje um bug
  como "erro ao tocar na tab" só é descoberto via review manual da loja, não há
  telemetria de produção nenhuma para esse tipo de falha.
- Diagnóstico de travamento/lentidão percebida (frames lentos/congelados) coberto
  pelos parâmetros `frameRate.*` já nativos do TTI/Nav TTI — sem instrumentação
  extra além do que o Epic 2 já provê.
- Métricas visíveis via EAS CLI (`eas observe:metrics-summary`, `observe:routes`,
  `observe:events`) após rollout.
- Rollout direto em produção (sem etapa intermediária de validação em dev/preview)
  — instrumentação é passiva e não-intrusiva, mesmo padrão adotado para o
  `@buoy-gg/*` no Epic 1.
- Suíte Jest e `expo-doctor` seguem passando sem regressão.

## Escopo

**Dentro:**
- Instalação e configuração do `expo-observe` (root HOC + integração expo-router).
- Eventos customizados nos contextos `profile`, `companies`, `market` e
  `complaints`.
- Error Boundary React básico + ponte com `Observe.logEvent` para erros não
  tratados.
- Rollout em produção e verificação inicial de que os dados chegam via EAS CLI.

**Fora:**
- Análise dos dados coletados / decisão sobre otimizações de performance (epic
  futuro, depois de acumular dados reais).
- Crash reporting e product analytics (Epic 3 — depende de decisão de ferramenta).
- Bundle analysis / Expo Atlas (Epic 4, backlog).

## Prazo

Sem prazo definido — segue a ordem de dependência do epic de observabilidade
(Epic 1 concluído → Epic 2 agora).
