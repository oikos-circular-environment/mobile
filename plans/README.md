# Plans — Observabilidade

Índice dos epics derivados do plano original de observabilidade, após a liberação do
EAS Observe (plano Expo Starter) e o levantamento de que ele cobre só performance,
não crash/analytics/replay.

| Epic | Escopo | Status |
|---|---|---|
| [epic-1-sdk-upgrade](./epic-1-sdk-upgrade/) | Upgrade Expo SDK 54 → 55 → 56 (bloqueia os demais) | Em andamento |
| [epic-2-eas-observe](./epic-2-eas-observe/) | EAS Observe — performance monitoring (cold/warm start, TTFR, TTI, bundle load por rota) | Aguarda Epic 1 |
| [epic-3-observability](./epic-3-observability/) | Crash reporting + product analytics (Sentry/BugSnag, PostHog/Amplitude/Firebase Analytics) | Aguarda decisão de ferramenta |
| [epic-4-bundle-analysis](./epic-4-bundle-analysis/) | Bundle analysis (Expo Atlas) | Backlog — não será executado agora |

## Ordem de dependência

```
Epic 1 (SDK upgrade) → Epic 2 (EAS Observe)
                     → Epic 3 (Observability)
Epic 4 é independente, mas não está sendo trabalhado agora.
```
