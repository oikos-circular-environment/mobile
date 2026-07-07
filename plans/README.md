# Plans — Observabilidade

Índice dos epics derivados do plano original de observabilidade, após a liberação do
EAS Observe (plano Expo Starter) e o levantamento de que ele cobre só performance,
não crash/analytics/replay.

| Epic | Escopo | Status |
|---|---|---|
| [epic-1-sdk-upgrade](./epic-1-sdk-upgrade/) | Upgrade Expo SDK 54 → 55 → 56 (bloqueia os demais) | PR aberta (#62) |
| [epic-5-appstore-rejection-fix](./epic-5-appstore-rejection-fix/) | Correção da rejeição da Apple (Guidelines 5.1.5 + 2.1(a)) — bloqueia o lançamento | Fix commitado (`fix/appstore-rejection-location-block`); validação em iPad e resubmissão adiadas por decisão do usuário |
| [epic-2-eas-observe](./epic-2-eas-observe/) | EAS Observe — performance monitoring (cold/warm start, TTFR, TTI, bundle load por rota) + Error Boundary | Brief pronto — retomado (Epic 5 travou em validação/resubmissão) |
| [epic-3-observability](./epic-3-observability/) | Crash reporting + product analytics (Sentry/BugSnag, PostHog/Amplitude/Firebase Analytics) | Aguarda decisão de ferramenta |
| [epic-4-bundle-analysis](./epic-4-bundle-analysis/) | Bundle analysis (Expo Atlas) | Backlog — não será executado agora |

## Ordem de dependência

```
Epic 1 (SDK upgrade) → Epic 5 (correção rejeição Apple) → Epic 2 (EAS Observe)
                                                        → Epic 3 (Observability)
Epic 4 é independente, mas não está sendo trabalhado agora.
```

Epic 5 furou a fila: o app está rejeitado na App Store e não pode ser lançado
até essa correção, então tem prioridade sobre o Epic 2 mesmo não fazendo parte
da cadeia original de observabilidade.
