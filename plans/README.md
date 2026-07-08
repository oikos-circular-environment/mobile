# Plans — Observabilidade

Índice dos epics derivados do plano original de observabilidade, após a liberação do
EAS Observe (plano Expo Starter) e o levantamento de que ele cobre só performance,
não crash/analytics/replay.

| Epic | Escopo | Status |
|---|---|---|
| [epic-1-sdk-upgrade](./epic-1-sdk-upgrade/) | Upgrade Expo SDK 54 → 55 → 56 (bloqueia os demais) | PR aberta (#62) |
| [epic-5-appstore-rejection-fix](./epic-5-appstore-rejection-fix/) | Correção da rejeição da Apple (Guidelines 5.1.5 + 2.1(a)) — bloqueia o lançamento | **Resubmetido com sucesso** (iOS `apple_app_id: 6786017565`, Android `com.oikos`) — aguardando resultado da review manual da Apple. Validação em iPad nunca foi feita (usuário assumiu o risco) |
| [epic-2-eas-observe](./epic-2-eas-observe/) | EAS Observe — performance monitoring (cold/warm start, TTFR, TTI, bundle load por rota) + Error Boundary | **Todos os 5 tickets concluídos** — build/submit de produção OK nas duas plataformas, métricas iOS confirmadas via CLI (Android ainda sem eventos, aguardando uso real) |
| [epic-3-observability](./epic-3-observability/) | Crash reporting + product analytics (Sentry/BugSnag, PostHog/Amplitude/Firebase Analytics) | Aguarda decisão de ferramenta |
| [epic-4-bundle-analysis](./epic-4-bundle-analysis/) | Bundle analysis (Expo Atlas) | Backlog — não será executado agora |
| [epic-6-address-form-ux](./epic-6-address-form-ux/) | UX de formulários de endereço — Enter confirma CEP/CNPJ, lat/long via Google Geocoding, hook `useCepLookup` compartilhado (profile, company, complaints) | **Código concluído** (5/5 tickets, `feat/epic-6-address-form-ux`) — typecheck/lint/suíte de testes (201/201) OK. Falta só validação manual do mapa em complaints (sem device/simulador neste ambiente) |

## Ordem de dependência

```
Epic 1 (SDK upgrade) → Epic 5 (correção rejeição Apple) → Epic 2 (EAS Observe)
                                                        → Epic 3 (Observability)
Epic 4 é independente, mas não está sendo trabalhado agora.
Epic 6 é independente (não faz parte da cadeia de observabilidade).
```

Epic 5 furou a fila: o app está rejeitado na App Store e não pode ser lançado
até essa correção, então tem prioridade sobre o Epic 2 mesmo não fazendo parte
da cadeia original de observabilidade.
