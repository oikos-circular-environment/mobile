# Epic Brief — Correção da rejeição da Apple (v1.0.0 build 4)

## Resumo

A submissão 1.0.0 (4) foi **rejeitada** pela Apple em 07/07/2026 (Submission ID
`3f96db4c-ee45-422c-b5fe-eb90bd5b03a9`, revisada em iPad Air 11-inch M3,
iPadOS 26.5.2) por duas guidelines: **5.1.5** (uso de localização em recursos que
não dependem dela — app não funcional com Location Services desligado) e **2.1(a)**
(bugs que impedem o uso: erro ao tocar na maioria das tabs, botão de login sem
resposta). A análise do código aponta uma **causa raiz única** para as duas: o
`GeospatialProvider` é montado no root layout (`src/app/_layout.tsx`), acima do
`Stack` que contém todas as tabs e telas de auth, e renderiza um `Modal`
bloqueante (sem forma de fechar, exceto abrir Configurações) sempre que a
permissão de localização é negada ou falha ao resolver — cobrindo o app inteiro,
inclusive telas que não usam localização (login, home, perfil, listagem de
denúncias sem criação). Este epic corrige exatamente esse bloqueio, sem
redesenhar a UX de localização por tela (fica para uma iteração futura, se
necessário).

## Contexto & Problema

- **Quem é afetado**: hoje, o revisor da Apple (bloqueando o lançamento do app);
  em produção, qualquer usuário que negue permissão de localização ou esteja com
  Location Services desligado — perderia acesso ao app inteiro, não só aos
  recursos que dependem de mapa/geolocalização.
- **Onde no produto**: `src/contexts/geospatial-context.tsx` (o modal bloqueante)
  e seu ponto de montagem em `src/app/_layout.tsx`. Hipótese secundária a
  investigar: `Location.watchHeadingAsync` (bússola) pode falhar em iPads sem
  magnetômetro, fazendo o catch (`geospatial-context.tsx:157-160`) marcar
  `permissionDenied = true` mesmo com a permissão de localização concedida —
  o que tornaria o bug reproduzível especificamente em iPad, mesmo passando em
  iPhone.
- **Dor atual**: app rejeitado, sem caminho de resubmissão até resolver. Não há
  Error Boundary nem telemetria de produção hoje (ver Epic 2/3) — esse tipo de
  bug só foi descoberto via review manual da própria Apple, não por nós.

## Critérios de sucesso

- Nenhuma tela que não dependa de localização (login, cadastro, home, perfil,
  listagem de denúncias/empresas) fica bloqueada por falta de permissão/serviço
  de localização — o modal de aviso passa a aparecer só dentro das telas que
  realmente precisam (mapa do market, criação de denúncia, overlay de
  localização da câmera).
- Causa raiz da bússola (iPad sem magnetômetro) investigada e, se confirmada,
  corrigida (`watchHeadingAsync` não deve derrubar todo o fluxo de localização
  por falta de hardware de bússola).
- Reprodução e validação específica em iPad (via EAS Simulator ou device físico)
  com Location Services desligado — cobrindo exatamente o cenário do review.
- Regressão validada nas 4 áreas que hoje dependem de localização (`market`,
  `complaints` criação, `camera-geospatial-overlay`, `market-list-header`) —
  continuam funcionando normalmente quando a localização está disponível.
- Nova build gerada via `eas build --profile production` (Android + iOS) e
  reenviada para review na App Store Connect.

## Escopo

**Dentro:**
- Mover o gate de localização do root layout para dentro das telas/componentes
  que de fato precisam dela, em vez de bloquear o app inteiro.
- Investigar e corrigir a hipótese da bússola em iPad.
- Testes de regressão manuais focados em iPad (simulador ou device).
- Nova submissão à App Store Connect.

**Fora:**
- Redesenho da UX de localização por tela (prompts contextuais, fallback de
  busca manual de endereço) — só o mínimo para destravar o bloqueio global.
- Error Boundary / captura de erros de produção — isso é escopo do Epic 2
  (já ajustado para incluir essa motivação).
- Qualquer outra melhoria de performance/observabilidade fora do necessário para
  resolver as duas guidelines.

## Prazo

Urgente — app está rejeitado e não pode ser lançado até a correção. Prioridade
sobre o Epic 2 (EAS Observe), que fica pausado no brief até este epic fechar.
