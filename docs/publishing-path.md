# Caminho de Publicação — Oikos Mobile

> Documento de referência para planejar a publicação nativa do app nas duas lojas.
> Última revisão: junho/2026

---

## Contexto do Produto

O Oikos é uma **plataforma colaborativa para a economia circular do lixo**, conectando catadores, cooperativas, empresas geradoras de resíduos, órgãos públicos e cidadãos. O produto é resultado de pesquisa de mestrado (PPGES/UNIPAMPA) fundamentada em survey qualitativo com 16 participantes do ecossistema de reciclagem de Rondonópolis (MT).

**Atores do ecossistema:** catadores, cooperativas, empresas de reciclagem, empresas comuns, indústrias, cidadãos residenciais, órgãos públicos, ONGs.

**Funcionalidades centrais:** marketplace de resíduos, mapa de ecopontos, denúncia cidadã com geolocalização, gestão operacional de coletas, documentos de conformidade (MTR/SINIR), dashboards de governança.

**Mercado-alvo:** Brasil — lançamento em pt-BR, com foco inicial em cidades de médio porte.

---

## Estratégia de Monetização (decisão atual)

O Oikos Mobile será publicado inicialmente **sem nenhuma lógica de compra dentro do app**. Pagamentos serão processados exclusivamente na plataforma web, redirecionando o usuário pelo browser.

**Motivo:** evitar as comissões das lojas (15–30% Apple / 15% Google) e simplificar o lançamento inicial.

### Implicações por loja

**Google Play** — sem restrições. App gratuito sem IAP é aceito normalmente.

**Apple App Store** — o ponto de atenção histórico, mas que mudou em 2025:
- Por decisão judicial (Epic vs Apple), a Apple passou a permitir links externos para pagamento.
- Porém, se o app incluir um botão/link explícito de "compre no site", a Apple cobra **15% sobre qualquer compra feita no site nos 7 dias seguintes** ao clique — e exige uma entitlement especial.
- **Para o cenário atual (sem nenhum call-to-action de compra no app):** nenhuma comissão se aplica. A Apple só age quando há redirecionamento ativo dentro do app.

### Regra prática

| Situação no app | Comissão Apple |
|---|---|
| App gratuito, sem IAP, sem link de compra | Nenhuma |
| Botão/link explícito "Assine no site" | 15% nas compras em até 7 dias |
| IAP nativo (in-app purchase) | 15–30% |

### Quando monetização entrar em pauta

Revisar esta decisão antes de introduzir qualquer fluxo de pagamento. As opções serão:
1. **Link externo com entitlement** — 15% para Apple, livre no Google.
2. **IAP nativo** — 15–30% Apple, 15% Google (padrão das lojas).
3. **Manter tudo na web sem referência no app** — fora do escopo das comissões.

---

## Visão Geral dos Custos (Lançamento)

| Item | Valor | Recorrência |
|---|---|---|
| Apple Developer Program | US$ 99 | Anual |
| Google Play Developer | US$ 25 | **Taxa única** |
| EAS Free (15 builds/mês por plataforma) | US$ 0 | — |
| EAS Starter (builds ilimitados + CI/CD) | US$ 19/mês | Mensal |

---

## 1. Apple Developer Program

**Site**: developer.apple.com

### Custo e Conta
- US$ 99/ano — renovação automática anual obrigatória para manter o app na loja.
- A conta pode ser **individual** (CPF/nome pessoal) ou **organização** (CNPJ). Para um produto de negócio, preferir organização.
- Conta de organização exige **D-U-N-S number** (identificador Dun & Bradstreet), solicitado gratuitamente mas demora alguns dias úteis.

### CPF vs CNPJ
- Migração de Individual → Organização **é possível**, mas exige contato com o suporte da Apple e envio de documentação.
- Apps e certificados existentes são mantidos na conversão.
- **Recomendação:** se a empresa já existe ou abrirá em breve, cadastrar direto com CNPJ e evitar a migração.

### Requisitos de Build (2026)
- A partir de **28 de abril de 2026**, novos uploads no App Store Connect precisam ser compilados com o **iOS 26 SDK ou superior**.
- Build local exige Mac com Xcode atualizado.
- **Alternativa sem Mac**: usar EAS Build (ver seção 3).

### Processo de Revisão
- ~90% das submissões recebem resposta em 24h; 98% em 48h.
- Revisão automatizada (análise de binário, APIs, entitlements, privacy manifest) + revisão humana em dispositivo físico.
- Rejeições comuns: metadados imprecisos, dados de privacidade incompletos, crashes no fluxo básico do app.

### Certificados e Provisioning (via EAS)
- EAS Credentials gerencia automaticamente os certificados de distribuição e provisioning profiles — não é necessário fazê-lo manualmente pelo Xcode.

---

## 2. Google Play Developer Program

**Site**: play.google.com/console

### Custo e Conta
- **US$ 25 — taxa única, para sempre.** Não há renovação anual.
- Requer conta Google com verificação em duas etapas ativada.
- Requer documento de identidade (RG/CPF ou passaporte) para verificação pessoal.
- Conta de organização requer **D-U-N-S number** (mesmo que a Apple).

### CPF vs CNPJ
- Contas individuais que **monetizam apps não são elegíveis para transferência direta** de titularidade. Seria necessário criar uma nova conta PJ e transferir os apps manualmente.
- **Recomendação:** mesma da Apple — se a empresa abrirá em breve, esperar e cadastrar com CNPJ.
- Se o app for lançado sem monetização (cenário atual), a migração futura é menos urgente, mas ainda assim custosa.

### Requisitos de Build
- Android **não exige hardware específico** — builds locais funcionam em Windows, Mac ou Linux via Android Studio.
- Com EAS Build, o processo é 100% na nuvem, sem necessidade de ambiente local configurado.

### Processo de Revisão
- Menos restritivo que a Apple, mas passou a exigir **closed testing com 12 testadores por 14 dias** antes de abrir para produção (contas pessoais).
- Revisão costuma levar de horas a alguns dias úteis.
- Rejeições comuns: permissões desnecessárias declaradas no manifest, política de privacidade ausente, conteúdo inadequado.

### Google Service Account Key
- Para usar **EAS Submit** (submissão automatizada), é necessário criar uma **Google Service Account** no Google Cloud Console e vincular ao Play Console.
- A **primeira submissão do app precisa ser manual** via Play Console (upload do `.aab`). Submissões subsequentes podem ser totalmente automatizadas.

---

## 3. EAS — Expo Application Services

**Docs**: docs.expo.dev

O EAS resolve dois problemas principais: **build na nuvem** (sem necessidade de Mac para iOS) e **submissão automatizada** para as duas lojas.

### EAS Build
Compila o app na nuvem para iOS (`.ipa`) e Android (`.aab`).

| Plano | Preço | Builds incluídos |
|---|---|---|
| Free | US$ 0 | 15 iOS + 15 Android / mês |
| Starter | US$ 19/mês | Créditos de build + CI/CD |
| Production | US$ 199/mês | Mais créditos + suporte |

Para um app em estágio inicial, o **plano Free cobre bem** o ciclo de lançamento e iterações iniciais. Builds extras custam entre US$ 1–4 cada.

### EAS Submit
Envia o binário pronto diretamente para App Store Connect ou Google Play, sem precisar fazer upload manual.

```bash
# Compilar e já submeter para as lojas
eas build --platform all --auto-submit

# Ou submeter um build já existente
eas submit --platform ios
eas submit --platform android
```

### EAS Update (OTA)
Permite enviar atualizações de JavaScript/assets **sem passar pelo review das lojas**. Útil para correções rápidas de bugs que não alteram código nativo.

> Importante: atualizações que alteram permissões, código nativo ou comportamento substancial do app ainda precisam passar pelo processo normal de revisão.

### Configuração no `eas.json`
O arquivo `eas.json` na raiz do projeto define os perfis de build e submissão:

```json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "SEU_APP_ID_AQUI"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## 4. Caminho Recomendado para Publicação

### Fase 1 — Pré-requisitos (fazer uma vez)

- [ ] Criar conta no **Apple Developer Program** (US$ 99) — individual ou organização
- [ ] Criar conta no **Google Play Console** (US$ 25)
- [ ] Instalar e autenticar o CLI do EAS: `npm install -g eas-cli && eas login`
- [ ] Inicializar EAS no projeto: `eas build:configure`

### Fase 2 — Configuração das Lojas

**Apple:**
- [ ] Criar o app no App Store Connect (nome, bundle ID, categoria)
- [ ] Preencher metadados: descrição, screenshots, política de privacidade
- [ ] Configurar `ascAppId` no `eas.json`
- [ ] (Opcional) Distribuir via TestFlight para beta testers antes de publicar

**Google:**
- [ ] Criar o app no Google Play Console
- [ ] Criar Google Service Account e vincular ao Play Console
- [ ] Fazer o **primeiro upload manual** do `.aab` (exigência do Google)
- [ ] Abrir closed testing com 12 testadores e aguardar 14 dias
- [ ] Configurar `serviceAccountKeyPath` no `eas.json`

### Fase 3 — Build de Produção

```bash
# Build para as duas plataformas
eas build --platform all --profile production
```

### Fase 4 — Submissão

```bash
# Submeter para as duas lojas
eas submit --platform all --profile production
```

Ou combinar build + submissão em um único comando:

```bash
eas build --platform all --profile production --auto-submit
```

> **`eas submit` não envia para o App Review.** Por baixo ele roda `fastlane pilot`, que faz apenas o **upload do binário** para a App Store Connect (onde ele aparece no TestFlight). Criar a App Store Version, anexar o build, publicar metadata/screenshots e clicar em *Submit for Review* são etapas separadas — automatizadas pelo job `submit_for_review` (ver seção "Envio para o App Review").

### Fase 5 — Pós-aprovação

- [ ] Configurar EAS Update para OTA updates
- [ ] Monitorar ratings e crashes (Firebase Crashlytics ou Sentry)
- [ ] Definir processo de release: branch `production` → build → submit

---

## 5. Decisões de Publicação — Perguntas Respondidas pelo Contexto

### Localização em background
**Justificativa clara e defensável.** O uso de `expo-location` com background tracking serve a dois casos de uso centrais do produto:
1. **Catadores:** otimização de rotas de coleta em tempo real enquanto o app está em segundo plano.
2. **Cidadãos e mapa de ecopontos:** localização contínua para exibir pontos de coleta próximos.

Ao submeter nas lojas, a justificativa no formulário de privacidade deve ser exatamente essa: *"rastreamento de rotas de coleta de resíduos e exibição de ecopontos próximos ao usuário."* Tanto Apple quanto Google aceitam background location quando o uso é funcional e explícito — não será bloqueio para aprovação.

### Privacy Manifest (Apple) e declaração de permissões
O app usa APIs sensíveis que precisam ser declaradas no `PrivacyInfo.xcprivacy` gerado pelo EAS:

| Permissão | Uso no Oikos | Justificativa para as lojas |
|---|---|---|
| Localização (background) | Rotas de coleta, mapa de ecopontos | Funcionalidade central do produto |
| Câmera | Denúncia cidadã com foto, classificação por imagem | Funcionalidade central do produto |
| Notificações | Alertas de coleta, atualizações de denúncia | Comunicação operacional com o usuário |

Essas três permissões têm justificativa forte e direta. Nenhuma é ornamental — todas estão mapeadas no survey como funcionalidades essenciais pelos entrevistados.

### Política de Privacidade (LGPD)
O app coleta dados sensíveis: localização (incluindo background), fotos, perfil de usuário e potencialmente dados financeiros no futuro. É obrigatório ter uma **URL pública de política de privacidade** antes de submeter nas lojas.

O documento deve cobrir:
- Quais dados são coletados e por quê (localização, câmera, perfil)
- Por quanto tempo são retidos
- Com quem são compartilhados (ex.: órgãos públicos para denúncias)
- Direitos do titular (acesso, correção, exclusão — LGPD Art. 18)
- Canal de contato do DPO/responsável

**Onde hospedar:** na plataforma web do Oikos (mesma URL para iOS e Android).

### Classificação etária e categoria
- **Categoria recomendada:** `Utilities` (Google Play) / `Utilities` ou `Business` (App Store) — o app serve tanto uso pessoal (cidadão) quanto operacional (catador, empresa).
- **Classificação etária:** `Livre` / `4+` — sem conteúdo violento, adulto ou de risco. A funcionalidade de denúncia com foto de descarte irregular não configura conteúdo impróprio.

### Testadores para o Google Play (closed testing)
**Resolvido via mestrado.** Os 16+ participantes da pesquisa em Rondonópolis (catadores, empresas, órgãos públicos, cidadãos) constituem uma base natural de testadores reais, com perfis que representam exatamente os atores do ecossistema. Isso torna o período de 14 dias de closed testing também uma **validação de produto com o público-alvo real** — alinhado à metodologia do survey.

### Idioma e mercado-alvo
- Lançamento exclusivamente em **pt-BR**.
- Metadata das lojas (nome, descrição, keywords) em português.
- Foco inicial em cidades de médio porte do Brasil, com Rondonópolis como referência empírica.

### Staged rollout (Google Play)
Recomendado para o primeiro lançamento público: iniciar com **10–20% dos usuários**, monitorar crashes e feedback por 48–72h, depois ampliar para 100%. Isso é especialmente relevante dado que o app tem funcionalidades de localização em background — erros nessa área impactam bateria e podem gerar reviews negativos.

### Versionamento sincronizado entre iOS e Android
`app.config.ts` usa um único campo `version` (ex.: `1.0.1`), compartilhado pelas duas plataformas — não existem `ios.version`/`android.version` separados. Essa é a fonte de verdade da versão de marketing e deve ser bumpada nas duas plataformas juntas, nunca por loja.

**Build numbers não precisam (nem devem) ser sincronizados**: `ios.buildNumber` e `android.versionCode` são incrementados de forma independente pelo `autoIncrement: true` do `eas.json` — cada loja tem seu próprio histórico de builds e isso é esperado. Só a `version` de marketing (o que o usuário final vê) precisa ser idêntica nas duas lojas.

**Por que existe um gate automático só do lado iOS**: a Apple trava a `version` assim que uma App Store Version é aprovada/fica ao vivo — não dá pra reabrir essa versão para anexar um novo build, só criando uma nova (bump obrigatório). O Google Play **não tem essa trava**: `versionName` pode ser reenviado livremente entre uploads, só `versionCode` precisa sempre subir. Por isso o workflow de produção (`.eas/workflows/production.yml`, job `check_ios_version`) consulta a App Store Connect API antes de buildar e falha cedo se a `version` atual já estiver anexada a uma versão aprovada/ao vivo — e **os dois builds** (`build_android` e `build_ios`) dependem desse mesmo check, para que uma leva de release nunca suba pra uma loja com uma versão diferente da outra.

### Build nativo condicional (fingerprint) + OTA

Nem todo push para `production` precisa virar um build nativo novo. O workflow calcula um **fingerprint** do projeto (job `fingerprint`) — um hash do que é nativo: módulos nativos, plugins de config, permissões, versão do SDK. Mudanças só em JS/assets não alteram esse hash.

A cada push, o workflow (job `get-build` para cada plataforma) procura no histórico do EAS um build já existente compatível com o fingerprint atual:
- **Fingerprint bateu com um build existente** (JS-only): pula `check_ios_version`, `build_android`, `build_ios` e `submit_*` inteiramente — publica só um update OTA (`publish_update`) no canal `production`. Não passa pela App Store nem pelo Play Console.
- **Fingerprint não bateu** (mudou algo nativo): roda o fluxo normal completo — `check_ios_version` → `build_android`/`build_ios` → `submit_android`/`submit_ios`. Se qualquer uma das duas plataformas precisar de build nativo, as duas buildam juntas (mesma lógica de sincronia da seção anterior).

Isso só funciona de forma segura porque `runtimeVersion.policy` em `app.config.ts` é `"fingerprint"` (não `"appVersion"`) — o `expo-updates` no aparelho só aceita um OTA se o fingerprint do update bater com o fingerprint do binário instalado. Ou seja, a mesma checagem que decide "precisa buildar?" no CI é a que garante, em runtime, que um update nunca vai parar num binário que não tem o código nativo necessário.

Bump de `version` de marketing continua só sendo necessário quando `check_ios_version` falhar (fingerprint mudou **e** a versão atual já está travada na Apple) — não a cada push.

### Publicação na App Store

O release iOS é dividido entre o que o EAS já faz e o que precisamos injetar. A regra é: **tudo que o EAS cobre fica no EAS**.

| Etapa | Quem faz |
|---|---|
| Build | `eas build` |
| Upload do binário para a App Store Connect | `eas submit` (`fastlane pilot`) |
| Ficha, screenshots, revisão, categorias, classificação etária | **`eas metadata:push`** (`store.config.js`) |
| Anexar o build à App Store Version | `scripts/submit-ios-for-review.mjs` |
| Enviar para o App Review | `scripts/submit-ios-for-review.mjs` |

O job `submit_for_review` encadeia as três últimas linhas nesta ordem, e cada uma é idempotente:

1. `node scripts/submit-ios-for-review.mjs --skip-submit` — cria ou reutiliza a App Store Version da `version` do `app.config.ts`, espera o build chegar a `processingState: VALID` e o anexa. A espera existe porque o `eas submit` faz o upload com `skip_waiting_for_build_processing`, então o binário ainda está sendo processado quando o job começa. Timeout padrão de 45 min, ajustável por `ASC_BUILD_WAIT_TIMEOUT_MINUTES`.
2. `eas metadata:push` — publica a ficha inteira.
3. `node scripts/submit-ios-for-review.mjs` — cria a `reviewSubmission`, adiciona a versão como item e marca `submitted: true`.

Se a versão já estiver em `WAITING_FOR_REVIEW` ou `IN_REVIEW`, o script encerra com sucesso e não mexe em nada — é o caso de um release enviado manualmente.

#### `store.config.js` — a ficha da App Store

O [EAS Metadata](https://docs.expo.dev/eas/metadata/) é a fonte de verdade da ficha do iOS, apontado por `submit.production.ios.metadataPath` no `eas.json`. Ele cobre título, subtítulo, descrição, keywords, texto promocional, notas da versão, URLs, **screenshots**, categorias, o questionário de classificação etária e as informações para a equipe de revisão.

> A tabela "When to use EAS Metadata" da documentação do Expo ainda lista *Upload screenshots ✗*, mas a CLI já suporta — o `eas metadata:pull` baixa os screenshots e o `push` os envia. A doc está atrasada em relação ao código.

Usamos o formato **dinâmico** (`store.config.js`, e não `store.config.json`) por dois motivos concretos: as notas da versão e o contato vêm de `store/shared/`, compartilhados com a Google Play; e as credenciais da conta de demonstração vêm do ambiente, para não ficarem versionadas.

Para regenerar o config a partir do que está na loja — útil depois de qualquer edição manual no App Store Connect:

```bash
EXPO_APPLE_TEAM_ID=<team-id> eas metadata:pull
```

Isso escreve um `store.config.json` estático e baixa os screenshots para `store/apple/`. Trate como ferramenta de inspeção: o que vale é o `store.config.js`, e o resultado do pull deve ser conferido e reintegrado à mão, não commitado por cima.

#### Screenshots

Ficam em `store/ios/screenshots/<DISPLAY_TYPE>/`, e a ordem na ficha é a ordem do array em `store.config.js` — daí o prefixo numérico nos nomes.

A Apple nunca documentou os enums de `screenshotDisplayType` dos tamanhos novos: a própria App Store Connect classifica os assets de iPad 13" (2064×2752) como `APP_IPAD_PRO_3GEN_129` e os de iPhone 6.9" como `APP_IPHONE_67`. Para ver o que a ASC usa de fato neste app:

```bash
npm run asc:inspect
```

#### Conta de demonstração

Partes do app ficam atrás de login — registrar denúncia, votar na resolução e publicar resolução. A diretriz 2.1 da Apple exige que o revisor consiga exercitar todas as funcionalidades, então a App Store Connect precisa das credenciais de uma conta de teste.

Essas credenciais **não ficam no repositório**: `store.config.js` as lê do ambiente `production` do EAS, cadastradas como `sensitive`.

```bash
eas env:create production --name ASC_DEMO_ACCOUNT_NAME     --value <email> --visibility sensitive
eas env:create production --name ASC_DEMO_ACCOUNT_PASSWORD --value <senha> --visibility sensitive
```

#### Rodando na mão

```bash
npm run asc:inspect                                    # estado atual na App Store Connect
npm run asc:submit -- --dry-run --build-number=20      # não escreve nada
npm run asc:submit -- --build-number=20 --skip-submit  # cria a versão e anexa o build
npm run asc:metadata                                   # publica a ficha
npm run asc:submit -- --build-number=20                # envia para o App Review
```

### Dados de release em `store/`

```
store.config.js                  # ficha da App Store (EAS Metadata)
store/
├── shared/                      # o que é idêntico nas duas lojas
│   ├── contact.json             # e-mail de suporte, URL de suporte, site
│   └── whats-new/<version>.md   # notas da versão, um arquivo por versão
├── ios/
│   └── screenshots/<DISPLAY_TYPE>/NN-nome.jpg
└── android/
    ├── release.json             # idioma da ficha e das notas da versão
    ├── feature-graphic.jpg
    └── screenshots/
```

**Regra de resolução das notas da versão:** vale `store/<loja>/whats-new/<version>.md` se existir; senão, `store/shared/whats-new/<version>.md`. Como a Google limita as notas a **500 caracteres** (a Apple, a 4.000), o texto compartilhado precisa caber nos 500 — se algum release exigir mais na App Store, é só criar o override em `store/ios/`.

O que **não** é compartilhado, e por quê: descrição, keywords e texto promocional têm limites e campos distintos em cada loja; screenshots usam sistemas de classificação diferentes; conta de demonstração e contato de revisão só existem na Apple; trilha e rollout só existem na Google.

**Trilha, status e rollout do Android não ficam aqui** — ficam em `submit.production.android` no `eas.json`, porque o `eas submit` já os aplica. Duplicá-los criaria duas fontes de verdade para o mesmo destino.

### Publicação na Google Play

O `submit_android` do workflow (que é `eas submit` por baixo) entrega o `.aab` na trilha configurada em `eas.json` — diferente do iOS, onde o binário só chega ao TestFlight — e já aplica `track`, `releaseStatus` e `rollout` daquele perfil. O que ele **não** faz é publicar as notas da versão nem sincronizar os dados de contato da ficha. Disso cuida o job **`publish_android`**, que roda `scripts/publish-android-release.mjs`.

> O EAS Metadata **não** cobre a Google Play — está explícito no FAQ da documentação do Expo. Por isso a ficha do Android depende de código nosso, enquanto a do iOS não.

Toda escrita na Play passa por uma transação chamada *edit*, e só `edits.commit` a torna pública. O script abre um edit, aplica as mudanças e:

- **com `--dry-run`, ou em caso de erro** → descarta o rascunho, e a loja fica intacta;
- **sem diferença a publicar** → descarta o rascunho e informa "nada a publicar";
- **caso contrário** → faz o commit, publicando tudo de uma vez.

Isso torna o Android mais seguro que o iOS nesse ponto: não existe estado pela metade.

#### Trilha e rollout

Ficam em `submit.production.android` no `eas.json`:

```json
{ "track": "alpha" }
```

`releaseStatus` aceita `completed`, `draft`, `halted` e `inProgress`; `rollout` (0 a 1) só vale com `inProgress`. Para o staged rollout recomendado no primeiro lançamento público (ver [Staged rollout](#staged-rollout-google-play)):

```json
{ "track": "production", "releaseStatus": "inProgress", "rollout": 0.1 }
```

A trilha continua em `alpha` enquanto a conta não tiver acesso liberado à produção (ver [Testadores para o Google Play](#testadores-para-o-google-play-closed-testing)).

#### Credencial

A service account do Google Play está no ambiente `production` do EAS como variável do tipo `file`, e é a mesma que o `eas submit` já usa:

```bash
eas env:create production --name GOOGLE_SERVICE_ACCOUNT_KEY \
  --type file --value <caminho-do-json> --visibility secret
```

#### Rodando na mão

```bash
export GOOGLE_SERVICE_ACCOUNT_KEY=docs/<service-account>.json

npm run play:inspect              # trilhas, ficha, imagens, bundles
npm run play:publish -- --dry-run  # mostra o diff, não publica nada
npm run play:publish               # abre o edit e faz o commit
```

### Só existe workflow pra production

`.eas/workflows/production.yml` (o descrito acima) é o único workflow do EAS no projeto — dispara em push pra `production`. Um workflow só compensa quando orquestra múltiplos steps/jobs com dependência entre si (é o caso: quality checks → fingerprint → decidir build-vs-OTA → submit); pra uma ação manual e pontual como "builda o dev client agora", ele seria só uma casca em volta do próprio `eas build`, sem ganho nenhum.

**Dev client (`development`/`development-simulator`)**: continue rodando direto:
```bash
eas build --profile development --platform ios
eas build --profile development-simulator --platform ios   # simulador
eas build --profile development --platform android
```

**`preview`** (profile que já está no `eas.json`, `distribution: "internal"` sem dev client embutido): sem workflow nem uso hoje. Resolveria o caso de dar um build standalone pra alguém sem Expo dev client testar sem precisar do servidor local rodando — mas não há esse consumidor agora: development builds (com o dev client, testado com o modo desenvolvedor do iPhone habilitado) cobrem o teste em hardware real, e testers externos usam TestFlight/trilha do Play, que já passam pela loja. Se essa necessidade aparecer (ex.: dar um `.apk`/build pra alguém não-dev testar uma PR), aí sim vale um `.eas/workflows/preview.yml` disparado em `pull_request` — vale lembrar que `preview` em iOS ainda exigiria registro de UDID por aparelho (build ad-hoc), enquanto Android instala livremente via `.apk`.

---

## 6. Comparativo Rápido: Apple vs Google

| Aspecto | Apple App Store | Google Play |
|---|---|---|
| Custo | US$ 99/ano | US$ 25 (único) |
| Hardware para build local | Mac obrigatório | Qualquer SO |
| Revisão humana | Sim, rigorosa | Sim, mais permissiva |
| Tempo médio de revisão | 24–48h | Horas a alguns dias |
| Política de privacidade | Obrigatória + labels detalhados | Obrigatória |
| Primeira submissão via API | Automática (com API Key) | Manual (depois automática) |
| Closed testing obrigatório | **Não** — TestFlight é opcional | Sim (12 testadores, 14 dias) |
| OTA updates (EAS Update) | Permitido (JS/assets) | Permitido (JS/assets) |

---

## 6. Referências

- [Expo EAS Build — Docs oficiais](https://docs.expo.dev/build/introduction/)
- [Expo EAS Submit — Docs oficiais](https://docs.expo.dev/submit/introduction/)
- [Expo Pricing](https://expo.dev/pricing)
- [Apple Developer Program](https://developer.apple.com/programs/)
- [Google Play Console](https://play.google.com/console)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Upcoming SDK Requirements — Apple](https://developer.apple.com/news/upcoming-requirements/)
- [Apple permite links externos para pagamento — TechCrunch](https://techcrunch.com/2025/05/02/apple-changes-us-app-store-rules-to-let-apps-redirect-users-to-their-own-websites-for-payments/)
- [App-to-web external purchases guide — RevenueCat](https://www.revenuecat.com/blog/engineering/app-to-web-purchase-guidelines/)
- [Transferência de conta — Google Play Console Help](https://support.google.com/googleplay/android-developer/answer/16909862?hl=en)
