# Epic Brief — Upgrade Expo SDK 54 → 55 → 56

## Resumo

O app está no Expo SDK 54.0.35. Este epic faz o upgrade incremental até o SDK 56,
passando pelo 55. A motivação primária é destravar o **EAS Observe** (Epic 2), que
exige SDK 55 no mínimo e só ganha a API completa (`ObserveRoot` + integração nativa
com expo-router) a partir do 56 — mas o upgrade também é buscado pelos ganhos gerais
do SDK novo (correções, melhorias no expo-router, novos recursos) e não só como
pré-requisito técnico. Aproveitando que dependências serão mexidas, o epic também
ativa o `@buoy-gg/*` (devtools overlay), hoje instalado mas nunca importado, restrito
a modo desenvolvedor.

## Contexto & Problema

- **Quem é afetado**: o time de engenharia, que fica sem caminho para instrumentar
  performance em produção (Epics 2 e 3 dependem deste); e indiretamente os usuários
  finais, que deixam de receber correções e melhorias já disponíveis nas versões
  novas do SDK e do expo-router.
- **Onde no produto**: transversal — não é uma tela específica, é a fundação
  (Expo SDK, React Native, expo-router) sobre a qual todo o app roda.
- **Dor atual**: o app está preso no SDK 54 sem devtools ativos em desenvolvimento
  (`@buoy-gg/*` instalado e nunca ligado) e sem caminho para observabilidade de
  produção.

## Critérios de sucesso

- Build gerado e validado nos profiles `development`, `preview` e `production`
  (`eas.json` / `.eas/workflows/build-and-submit.yml`) em Android e iOS.
- Suíte Jest existente passando a cada etapa (sem levantamento de cobertura nova —
  validação funcional fica a cargo do usuário testando o app manualmente).
- Validação manual sem regressão em: autenticação (login/signup/refresh de token),
  câmera e mídia (captura/upload no fluxo de denúncias), mapa e geolocalização,
  gestures, comportamento de teclado, safe areas/edges, guards de rota
  (`Stack.Protected`).
- Changelog do Expo SDK 55/56 e do expo-router revisado — mudanças relevantes
  (breaking changes e novos recursos aproveitáveis) identificadas e tratadas.
- `@buoy-gg/*` funcionando como overlay de devtools, ativo **somente** em
  `__DEV__`, sem impacto em build de produção.

## Escopo

**Dentro:**
- Bump incremental de versão 54 → 55 → 56 (Expo, React Native, expo-router e libs
  nativas dependentes: `react-native-maps`, `reanimated`, `gluestack-ui`, plugins de
  câmera/vídeo/localização/splash).
- Ativação do `@buoy-gg/*` em modo dev.
- Testes de regressão (automatizados + validação manual) nas áreas críticas listadas.

**Fora:**
- Implementação do EAS Observe em si (Epic 2).
- Ferramentas de crash reporting/analytics (Epic 3).
- Bundle analysis / Expo Atlas (Epic 4, backlog).
- **Upgrade para o Expo SDK 57 (React Native 0.86)** — investigado (Ticket 6) e
  **adiado por decisão do usuário**: regressão de memória confirmada no Hermes
  V1 (`react-native-reanimated`/`worklets`, ~512KB por worklet único, já
  presente na combinação atual RN 0.85.x + New Architecture, independente do
  SDK 57) sem fix publicado em nenhuma versão de RN/Expo ainda, e o workaround
  sugerido (Worklets Bundle Mode) com problema próprio de OOM em dev descoberto
  na mesma semana da investigação. Ver Ticket 6 para os detalhes e fontes.

## Prazo

Upgrade precisa estar rodando **hoje** — há uma apresentação prevista. Qualidade
prevalece sobre velocidade: usar a suíte de testes existente e gerar testes novos
para validar as mudanças, em vez de pular validação para ganhar tempo.
