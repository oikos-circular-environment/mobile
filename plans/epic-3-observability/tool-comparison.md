# Epic 3 — Comparativo de ferramentas (crash reporting + analytics)

Levantamento feito antes de decidir a ferramenta, para responder às restrições do
usuário: (1) nada que exija compilar nativo localmente — o projeto é managed
workflow (`ios/`/`android/` no `.gitignore`, não versionados; `eas build` faz o
prebuild na nuvem); (2) entender se dá pra rotear os dados para o stack Grafana
próprio já existente.

Decisão de ferramenta ainda **em aberto** — este documento é insumo para a
entrevista do `epic-brief`/`tech-plan` deste epic, não uma escolha feita.

## Crash reporting

| Ferramenta | Plugin Expo (managed) | RN 0.81 / New Arch | Free tier / preço | Caminho OTel/Grafana |
|---|---|---|---|---|
| **Sentry** | `@sentry/react-native/expo` — managed workflow nativo, EAS Build cuida do prebuild na nuvem | Suportado | 5K erros/mês grátis; $26/mês Team | Protocolo próprio, sem export nativo p/ Tempo/Loki |
| **BugSnag** | `@bugsnag/expo` config plugin | Suportado | Free limitado (~7.5K eventos/mês); planos sob consulta | Nenhum |
| **Firebase Crashlytics** | `@react-native-firebase/crashlytics` (pode precisar `expo-build-properties` p/ iOS, ainda via plugin) | Suportado | Grátis, ilimitado | Nenhum — só console Firebase |

## Analytics

| Ferramenta | Compat. managed | Deps nativas | Free tier | OTel/Grafana |
|---|---|---|---|---|
| **PostHog** | `posthog-react-native/expo` config plugin (inclui session replay); replay exige build dev/prod, não funciona no Expo Go | Peer deps são libs Expo (`expo-file-system`, `expo-device` etc.) | 1M eventos/mês, 5K replays/mês | Nenhum |
| **Amplitude** | SDK puro JS, sem plugin necessário | Nenhuma | Free tier por volume de eventos | Nenhum |
| **Firebase Analytics** | Mesmo plugin do Crashlytics | Compartilha módulo Firebase | Grátis, ilimitado | Nenhum |

## Opção nativa Grafana

Não existe agente oficial de RUM mobile/RN do Grafana. Grafana Faro é só web; o
único artefato mobile (`faro-otel-swift-exporter`) é iOS-only, prova de conceito,
sem equivalente Android. Existe um caminho DIY via OpenTelemetry JS SDK
instrumentado manualmente → OTel Collector → Tempo/Mimir/Loki, mas é engenharia
própria a construir e manter — nenhum vendor acima fala OTel nativamente.

## Escape hatch OTel do próprio EAS Observe

`expo.extra.eas.observe.endpointUrl` permite redirecionar para um backend
OTel-compatible. A ressalva de precisar `npx expo prebuild` **não é um bloqueio
real** aqui: como `ios/`/`android/` já estão no `.gitignore` e o EAS Build já roda
prebuild na nuvem a cada build, o próximo `eas build` normal absorve a mudança —
sem migrar para bare workflow.

## Conclusão prática

Nenhuma das 5 ferramentas exige compilação nativa local — todas via config plugin +
EAS Build cloud, mantendo o managed workflow atual. Nenhuma tem integração nativa
com Grafana; isso seria instrumentação customizada à parte.

### Fontes
- [Using Sentry - Expo Docs](https://docs.expo.dev/guides/using-sentry/)
- [Sentry for Expo](https://docs.sentry.io/platforms/react-native/sourcemaps/uploading/expo/)
- [BugSnag Expo docs](https://docs.bugsnag.com/platforms/react-native/expo/)
- [Using BugSnag - Expo Docs](https://docs.expo.dev/guides/using-bugsnag/)
- [Using Firebase - Expo Docs](https://docs.expo.dev/guides/using-firebase/)
- [react-native-firebase Crashlytics Android Setup](https://rnfirebase.io/crashlytics/android-setup)
- [PostHog React Native docs](https://posthog.com/docs/libraries/react-native)
- [PostHog Session Replay RN installation](https://posthog.com/docs/session-replay/installation/react-native)
- [Grafana Faro OSS](https://grafana.com/oss/faro/)
- [faro-otel-swift-exporter](https://github.com/grafana/faro-otel-swift-exporter)
- [OTEL instrumentation for React Native - CNCF](https://www.cncf.io/blog/2024/08/05/how-to-add-otel-instrumentation-to-a-react-native-app/)
- EAS Observe docs: [introduction](https://docs.expo.dev/eas/observe/introduction/), [get-started](https://docs.expo.dev/eas/observe/get-started/), [events](https://docs.expo.dev/eas/observe/events/), [configuration](https://docs.expo.dev/eas/observe/configuration/), [expo-router integration](https://docs.expo.dev/eas/observe/integrations/expo-router/), [troubleshooting](https://docs.expo.dev/eas/observe/reference/troubleshooting/)
- [Expo analytics guide](https://docs.expo.dev/guides/using-analytics/)
