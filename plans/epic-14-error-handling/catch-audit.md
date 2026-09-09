# Auditoria de try/catch — epic-14

Levantamento completo dos blocos `catch` do app (excluindo `src/tests/` e código gerado) mais
uma checagem direcionada de chamadas de risco sem try/catch nenhum. Referência:
[epic-brief.md](./epic-brief.md).

## Resumo

- **48 pontos brutos encontrados** (46 blocos `catch` + 2 chamadas de risco sem try/catch).
- **6 excluídos** (5 catches em código gerado `brasil-api-sdk/**/*.gen.ts` + 1 script vendor de
  terceiro).
- **5 já resolvidos** nesta mesma branch (`217-upgrade-expo-57-observe-errors`, ver seção
  abaixo).
- **39 classificados** nesta auditoria:
  - **19 `silencioso-ok`** — catch já correto, erro esperado/recuperável, sem ação.
  - **18 `precisa Observe.reportError`** — erro real, não bloqueante, falta telemetria.
  - **2 `precisa erro visível ao usuário`** — usuário acha que deu certo quando não deu.

A varredura de "chamadas de risco sem try/catch" (parte 2 do escopo) foi **direcionada**, não
exaustiva: cobri as superfícies citadas no ticket (SecureStore, AsyncStorage, expo-camera,
expo-location, fetch direto, `axios`/oikosApi) com grep + leitura de contexto, não linha por
linha de todo o app. O achado de `src/libs/api/oikos-api.ts` (abaixo) é o resultado principal
dessa parte — vale revisitar com mais tempo se aparecer novo incidente de sessão/login.

## Já resolvido nesta sessão (não precisa de ação nova)

| Arquivo:linha | O quê |
|---|---|
| `src/components/camera/camera.tsx:112,135` | `Observe.reportError` nos catches de `takePictureAsync`/`recordAsync` |
| `src/libs/survey/queue/outbox.ts:307` | `Observe.reportError` no catch de `sendOutboxItem` |
| `src/libs/survey/queue/lifecycle.ts` (`triggerDrain`) | `.catch(error => Observe.reportError(error))` |
| `src/components/error-boundary.tsx` (boundary de root, `componentDidCatch`) | `recordAppError` com severidade `"fatal"` |

Infraestrutura nova desta sessão (não é catch de negócio, não entra na auditoria):
`src/libs/moderation/*`, `src/components/screen-error-boundary.tsx`,
`src/app/(tabs)/complaints/index.tsx` (`ErrorBoundary` local do mapa),
`src/app/(tabs)/complaints/(create)/camera.tsx` (`ErrorBoundary` local da câmera),
`src/libs/moderation/global-error-handler.ts`.

## Excluídos

| Arquivo:linha | Motivo |
|---|---|
| `src/libs/brasil-api-sdk/client/client.gen.ts:109` | Código gerado (`@hey-api/openapi-ts`) |
| `src/libs/brasil-api-sdk/core/queryKeySerializer.gen.ts:44` | Código gerado |
| `src/libs/brasil-api-sdk/core/serverSentEvents.gen.ts:160,208,241` | Código gerado |
| `src/components/ui/gluestack-ui-provider/script.ts:16` | Script vendor do gluestack-ui, roda só em ambiente web (`document`/`window`), indentação de 2 espaços confirma que é arquivo copiado, não escrito pelo projeto |

## Tabela de classificação

### Survey

| Arquivo:linha | Operação | Comportamento atual | Impacto se falha silenciosa | Classificação | Ação concreta |
|---|---|---|---|---|---|
| `src/components/survey/delete-survey-data-sheet.tsx:70` | rede/API (tRPC delete) | `toast.error` já mostrado ao usuário | Nenhum — já visível, mas sem telemetria | precisa Observe.reportError | Adicionar `Observe.reportError(error)` no catch |
| `src/libs/survey/restore-session.ts:95` | rede/API + fallback de cache | `console.warn` + usa cache local | Funcional, fallback cobre | precisa Observe.reportError | Adicionar `Observe.reportError(error)` |
| `src/libs/survey/restore-session.ts:129` | rede/API, sem fallback de cache disponível | `console.warn`, segue sem dados de protocolo | Sessão pode não restaurar corretamente | precisa Observe.reportError | Adicionar `Observe.reportError(error)` |
| `src/libs/survey/restore-session.ts:153` | storage local (SQLite, `deleteLocalSurveyData`) | `console.warn` | Cosmético (lixo local órfão) | precisa Observe.reportError | Adicionar `Observe.reportError(error)` |
| `src/libs/survey/synthetic-participant.ts:56` | rede/API (geocode reverso) | `console.warn`, retorna `null` | Cosmético — endereço do participante sintético fica vazio | precisa Observe.reportError | Adicionar `Observe.reportError(error)` |
| `src/app/survey/consent.tsx:146` | rede/API (provisionar participante) | `console.error` + `toast.error` já mostrado | Nenhum — já visível, funil crítico sem telemetria | precisa Observe.reportError | Adicionar `Observe.reportError(error)` |

### Geoespacial/mapas

| Arquivo:linha | Operação | Comportamento atual | Impacto se falha silenciosa | Classificação | Ação concreta |
|---|---|---|---|---|---|
| `src/components/wrapper-map.tsx:100` | permissão/GPS (`Location.requestForegroundPermissionsAsync`/`getCurrentPositionAsync`) | Seta `permissionDenied=true` (UI reage) | Mascara causa real (pode ser timeout de GPS, não permissão) | precisa Observe.reportError | Adicionar `Observe.reportError(error)` antes de setar o estado |
| `src/contexts/geospatial-context.tsx:101` | hardware (bússola/`watchHeadingAsync`) | Comentário explícito: hardware ausente é esperado, sem efeito colateral | Nenhum | silencioso-ok | Nada — já documentado como esperado |
| `src/contexts/geospatial-context.tsx:135` | rede/API (`reverseGeocodeAsync`) | Seta `reverseGeocodeError` (consumido por quem exibe endereço) | Cosmético | silencioso-ok | Nada — já tem sinal de estado |
| `src/contexts/geospatial-context.tsx:142` | permissão/GPS (`watchPositionAsync`) | Seta `permissionDenied=true` | Mascara causa real; contexto usado no app inteiro | precisa Observe.reportError | Adicionar `Observe.reportError(error)` |
| `src/libs/open-in-maps.ts:24` | deep link app externo (Google Maps iOS) | Fallback pra URL web | Nenhum — fallback funcional | silencioso-ok | Nada |
| `src/libs/open-in-maps.ts:41` | deep link app externo (`geo:` scheme) | Fallback pra URL web | Nenhum — fallback funcional | silencioso-ok | Nada |
| `src/libs/google/reverse-geocode.ts:55` | rede/API (Google Geocoding) | Nada, retorna `null` (nem log) | Cosmético — endereço não aparece | precisa Observe.reportError | Adicionar `Observe.reportError(error)` |
| `src/libs/google/geocode-address.ts:23` | rede/API (Google Geocoding) | Nada, retorna `null` (nem log) | Empresa pode ser salva sem lat/lng | precisa Observe.reportError | Adicionar `Observe.reportError(error)` |

### Complaints/denúncia

| Arquivo:linha | Operação | Comportamento atual | Impacto se falha silenciosa | Classificação | Ação concreta |
|---|---|---|---|---|---|
| `src/components/complaints/complaint-details-header.tsx:114` | deep link app externo (mapas) | `Alert.alert` | Nenhum — visível | silencioso-ok | Nada |
| `src/components/complaints/hooks/use-complaint-card.ts:38` | deep link app externo (Google Maps) | `Alert.alert` | Nenhum — visível | silencioso-ok | Nada |
| `src/components/complaints/hooks/use-complaint-card.ts:46` | deep link app externo (Apple Maps) | `Alert.alert` | Nenhum — visível | silencioso-ok | Nada |
| `src/components/denunciation/hooks/use-create-denunciation.ts:64` | rede/API (upload de anexo) | Marca flag, `toast.warning` depois no `onSuccess` | Já visível, mas sem causa raiz (qual anexo, por quê) | precisa Observe.reportError | Adicionar `Observe.reportError(error)` no catch do loop |
| `src/app/(tabs)/complaints/resolution.tsx:120` | parsing JSON (draft local, `companyJson`) | Comentário explícito "ignore malformed JSON" | Cosmético — draft não restaura empresa selecionada | silencioso-ok | Nada |
| `src/app/(tabs)/complaints/resolution.tsx:129` | parsing JSON (draft local, `attachmentsJson`) | Comentário explícito | Cosmético | silencioso-ok | Nada |
| `src/app/(tabs)/complaints/resolution.tsx:334` | filesystem/mídia (`compressMedia` no submit) | Reseta `uploadProgress` para `null`, **sem toast nem log nenhum** | Usuário vê a barra de progresso sumir sem explicação — acha que travou | **precisa erro visível ao usuário** | `toast.error("Falha ao processar mídia", ...)` + `Observe.reportError(error)` |
| `src/app/(tabs)/complaints/(create)/index.tsx:298` | rede/API (CEP) | Comentário explícito "silently fail — user fills manually" | Cosmético — usuário preenche endereço manual | silencioso-ok | Nada |
| `src/app/(tabs)/complaints/(create)/index.tsx:340` | filesystem/mídia (galeria, iCloud) | `toast.error` já mostrado, mensagem específica (iCloud) | Nenhum — visível e acionável pelo usuário | silencioso-ok | Nada |

### Suporte

| Arquivo:linha | Operação | Comportamento atual | Impacto se falha silenciosa | Classificação | Ação concreta |
|---|---|---|---|---|---|
| `src/components/support/hooks/use-create-support-request.ts:64` | rede/API (upload de anexo) | Marca flag, `toast.warning` depois | Já visível, mas sem causa raiz | precisa Observe.reportError | Adicionar `Observe.reportError(error)` no catch do loop |

### Perfil/empresa

| Arquivo:linha | Operação | Comportamento atual | Impacto se falha silenciosa | Classificação | Ação concreta |
|---|---|---|---|---|---|
| `src/app/(tabs)/(home)/profile.tsx:326` | rede/API (submit perfil/avatar) | `console.log` — mas `profileMutation`/`profileAvatarMutation` já têm `onError` próprio com `toast.error` + `logProfileEvent` | Redundante — catch externo é só rede de segurança contra unhandled rejection, erro já tratado nas mutations internas | silencioso-ok | Nada — já coberto nas mutations |
| `src/app/(tabs)/(home)/profile.tsx:366` | rede/API (CEP) | `toast.error` já mostrado | Nenhum — visível | silencioso-ok | Nada |
| `src/app/(tabs)/(home)/companies/[companyId]/address.tsx:137` | rede/API (CEP) | `toast.error` já mostrado | Nenhum — visível | silencioso-ok | Nada |
| `src/app/(tabs)/(home)/companies/[companyId]/services/form.tsx:124` | rede/API (submit serviços) | Comentário explícito "handled by context mutation's onError" | Nenhum — já coberto | silencioso-ok | Nada |
| `src/app/(tabs)/(home)/companies/[companyId]/company.tsx:722` | parsing (data digitada, máscara `dd/MM/yyyy`) | Ignora input inválido enquanto usuário digita | Nenhum — UX esperado de campo mascarado | silencioso-ok | Nada |

### Mídia/câmera

| Arquivo:linha | Operação | Comportamento atual | Impacto se falha silenciosa | Classificação | Ação concreta |
|---|---|---|---|---|---|
| `src/components/medias-preview/media-thumbnail.tsx:96` | filesystem/mídia (gerar thumbnail de vídeo) | Seta estado `"failed"` (placeholder exibido) | Cosmético | precisa Observe.reportError | Adicionar `Observe.reportError(error)` |
| `src/libs/media-validation.ts:30` | filesystem (`getFileSize`) | Comentário explícito, caller trata `undefined` | Nenhum | silencioso-ok | Nada |
| `src/libs/media-compression.ts:29` | verificação de native module linkado | Retorna `false` (default seguro) | Nenhum | silencioso-ok | Nada |
| `src/libs/media-compression.ts:46` | filesystem/mídia (compressão de imagem) | Retorna `uri` original sem comprimir | Funcional mas silencioso — upload maior sem ninguém saber que a compressão falhou | precisa Observe.reportError | Adicionar `Observe.reportError(error)` |
| `src/libs/media-compression.ts:61` | filesystem/mídia (compressão de vídeo) | Retorna `uri` original sem comprimir | Funcional mas silencioso | precisa Observe.reportError | Adicionar `Observe.reportError(error)` |

### Auth (categoria nova — não coberta pelas áreas do brief)

| Arquivo:linha | Operação | Comportamento atual | Impacto se falha silenciosa | Classificação | Ação concreta |
|---|---|---|---|---|---|
| `src/contexts/auth-context.tsx:97` | storage (SecureStore) + rede (`refetch` do perfil) | `console.error` | Usuário só vê estado deslogado, sem explicação — aceitável como fallback, mas sem telemetria | precisa Observe.reportError | Adicionar `Observe.reportError(error)` |

### Boot/atualização (categoria nova)

| Arquivo:linha | Operação | Comportamento atual | Impacto se falha silenciosa | Classificação | Ação concreta |
|---|---|---|---|---|---|
| `src/components/boot-splash-screen.tsx:247` | EAS Update (`Updates.reloadAsync`) | `console.warn`, comentário explícito: fallback é seguir com bundle atual, retoma no próximo boot | Cosmético — só atrasa a atualização OTA em 1 boot | precisa Observe.reportError | Adicionar `Observe.reportError(error)` — útil pra saber taxa de falha de update OTA |

### Infra/Observe

| Arquivo:linha | Operação | Comportamento atual | Impacto se falha silenciosa | Classificação | Ação concreta |
|---|---|---|---|---|---|
| `src/libs/observe-events.ts:10` | telemetria (`Observe.logEvent` em si) | `console.warn` | Nenhum — não dá pra reportar ao Observe que o próprio Observe falhou (circular) | silencioso-ok | Nada |

## Chamadas de risco sem try/catch nenhum

| Arquivo:linha | Operação | Comportamento atual | Impacto se falha silenciosa | Classificação | Ação concreta |
|---|---|---|---|---|---|
| `src/libs/api/oikos-api.ts:30` (`getStoredToken().then(...)`, carregamento do módulo) | storage (`SecureStore.getItemAsync` via `storage.ts`) | Nenhum try/catch, nenhum `.catch()` na promise solta | App inicia como se estivesse deslogado se a leitura falhar — sem log, sem telemetria | precisa Observe.reportError | Adicionar `.catch(err => Observe.reportError(err))` na promise |
| `src/libs/api/oikos-api.ts:34-41` (`setAuthToken`), chamado sem `await`/`.catch()` em `src/contexts/auth-context.tsx:119,180` (login/cadastro) | storage (`SecureStore.setItemAsync`/`deleteItemAsync`) | Nenhum try/catch na função; call sites são fire-and-forget | **Funcional** — usuário completa login normalmente, mas o token pode não persistir; no próximo cold start ele aparece deslogado sem explicação nenhuma | **precisa erro visível ao usuário** (mínimo: Observe.reportError) | `await setAuthToken(token)` nos 2 call sites + try/catch com `Observe.reportError`; avaliar se falha aqui deve impedir a conclusão visual do login |
