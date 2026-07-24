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

**Por que existe um gate automático só do lado iOS**: a Apple trava a `version` assim que uma App Store Version é aprovada/fica ao vivo — não dá pra reabrir essa versão para anexar um novo build, só criando uma nova (bump obrigatório). O Google Play **não tem essa trava**: `versionName` pode ser reenviado livremente entre uploads, só `versionCode` precisa sempre subir. Por isso o workflow de produção (`.eas/workflows/build-and-submit.yml`, job `check_ios_version`) consulta a App Store Connect API antes de buildar e falha cedo se a `version` atual já estiver anexada a uma versão aprovada/ao vivo — e **os dois builds** (`build_android` e `build_ios`) dependem desse mesmo check, para que uma leva de release nunca suba pra uma loja com uma versão diferente da outra.

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
