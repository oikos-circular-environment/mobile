# EAS Build & Submit Pipeline — Oikos Mobile

## Resumo

O app Oikos (React Native/Expo) precisa de um pipeline de build e distribuição funcional para chegar às lojas oficiais. O objetivo deste epic é estabelecer o pipeline completo de `eas build` + `eas submit` para Android e iOS, com credenciais de assinatura gerenciadas pelo EAS, permitindo que builds de produção sejam enviados ao Google Play (Closed Testing Alpha) e ao TestFlight de forma automatizada.

## Contexto & Problema

**Quem é afetado:** A equipe de desenvolvimento do Oikos — sem capacidade de distribuir o app para testadores reais ou para as lojas.

**Onde no produto:** Infraestrutura de CI/CD e distribuição — não afeta o código do app em si, apenas o pipeline de entrega.

**Resultado esperado:** Um único comando (`eas build --platform all --auto-submit --profile production`) gera e submete builds às lojas, com todas as credenciais centralizadas no EAS.

---

## Decisões tomadas

| Decisão | Escolha |
|---|---|
| Credenciais de assinatura | EAS Managed (keystore Android + cert iOS gerados e armazenados pelo EAS) |
| Autenticação App Store Connect | API Key (.p8) — recomendado para automação/CI |
| Track Android | Closed Testing Alpha |
| Destino iOS | TestFlight |
| Primeira submissão Android | Manual (restrição da API do Google — obrigatório uma vez) |
| Incremento de versão durante testes | `autoIncrement: "version"` — incrementa o patch (1.0.0 → 1.0.1 → 1.0.2) |

---

## `eas.json` — configuração final

```json
{
  "cli": {
    "version": ">= 18.3.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": "version",
      "environment": "production",
      "channel": "production"
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./docs/oikos-circular-economy-76798dd51e52.json",
        "track": "alpha"
      },
      "ios": {
        "ascAppId": "6786017565",
        "ascApiKeyPath": "./docs/AuthKey_WH824CT5G7.p8",
        "ascApiKeyIssuerId": "4c9b4692-ac79-43ae-b954-21bac9566bec",
        "ascApiKeyId": "WH824CT5G7"
      }
    }
  }
}
```

---

## Credenciais e arquivos sensíveis

| Arquivo | Plataforma | Localização | Coberto pelo .gitignore |
|---|---|---|---|
| `oikos-circular-economy-76798dd51e52.json` | Android (Google Service Account) | `docs/` | ✓ `docs/oikos-circular-economy-*.json` |
| `AuthKey_WH824CT5G7.p8` | iOS (App Store Connect API Key) | `docs/` | ✓ `*.p8` |

**iOS API Key:**
- Key ID: `WH824CT5G7`
- Issuer ID: `4c9b4692-ac79-43ae-b954-21bac9566bec`
- ascAppId: `6786017565`

**Android Service Account:**
- client_email: `oikos-circular-economy@oikos-circular-economy.iam.gserviceaccount.com`
- project_id: `oikos-circular-economy`

---

## App Store Connect — informações do app

| Campo | Valor |
|---|---|
| Nome | Oikos Economia Circular |
| SKU | oikos-circular-economy-app |
| Bundle ID | com.oikos |
| Apple ID | 6786017565 |
| Idioma principal | Português (Brasil) |
| Categoria | Utilidades / Educação |
| Classificação etária | 4+ |

---

## Histórico de execução

### Builds gerados (30/06/2026)

| ID | Plataforma | Status | versionCode / buildNumber |
|---|---|---|---|
| `0eb1d389` | Android | ✓ finished | versionCode 4 |
| `dc89071a` | iOS | ✓ finished | buildNumber 4 |

- Android build ID: `0eb1d389-9a34-4e49-861c-cbf54af30778`
- iOS build ID: `dc89071a-d3f1-4013-834c-66b45a25cc5b`

### Submissões realizadas

| Plataforma | Método | Track/Destino | Status |
|---|---|---|---|
| Android | Upload manual do `.aab` | Closed Testing Alpha | Em análise pelo Google |
| iOS | Pendente | TestFlight | — |

---

## Problemas encontrados e correções aplicadas

### 1. `expo doctor` — dependências desatualizadas
**Correção:** Atualizado `expo`, `expo-font`, `expo-localization`, `expo-router`, `expo-updates` para versões esperadas pelo SDK 54.

### 2. `expo doctor` — `react-native-compressor` não testado na New Architecture
**Correção:** Adicionado a `expo.doctor.reactNativeDirectoryCheck.exclude` no `package.json`. Biblioteca mantida pois não há alternativa direta.

### 3. `@types/jest` e `react-native-gesture-handler` fora do range esperado
**Correção:** Adicionados a `expo.install.exclude` no `package.json` — versões à frente do esperado mas compatíveis.

### 4. EAS Update sem `channel` configurado
**Correção:** Adicionado `"channel": "production"` ao perfil `production` no `eas.json`.

### 5. Track no `eas.json` incorreto (`internal` vs `alpha`)
**Contexto:** O upload manual foi feito no track Alpha (não Internal Testing). O `eas.json` foi corrigido para `"track": "alpha"` para que submissões futuras via `eas submit` vão para o lugar certo.

### 6. Ícone com dimensões incorretas
**Problema:** `src/assets/icons/icon.png` está em 512×512 px (RGBA). A Apple exige 1024×1024 px sem canal alpha (RGB com fundo sólido).
**Status:** Pendente — o ícone precisa ser substituído antes do próximo build iOS para aparecer corretamente no App Store Connect.

---

## Pendências

- [ ] **Ícone iOS:** substituir `src/assets/icons/icon.png` por versão 1024×1024 px RGB sem transparência (fundo `#274E2D`)
- [ ] **Submit iOS:** rodar `eas submit --platform ios --profile production` após corrigir o ícone e gerar novo build
- [ ] **Testadores Android:** adicionar 10+ testadores no Closed Testing Alpha (mínimo 12 por 14 dias para ir à produção)
- [ ] **Screenshots App Store:** capturar telas via iPhone (TestFlight) e compor nos tamanhos exigidos (6.9" e iPad 13")
- [ ] **Regulamento dos Serviços Digitais:** configurar no App Store Connect (DSA — declarar conteúdo gerado por usuários)
- [ ] **Política de privacidade:** URL pública obrigatória antes da submissão para revisão (iOS e Android)
- [ ] **Subtítulo do app (iOS):** preencher no App Store Connect (ex: "Economia circular e reciclagem")
- [ ] **Conta de desenvolvedor Android:** resolver alerta de risco de encerramento por inatividade no Play Console

---

## Comandos de referência

```bash
# Build para todas as plataformas
eas build --platform all --profile production

# Submeter iOS para TestFlight
eas submit --platform ios --profile production

# Submeter Android para o track alpha
eas submit --platform android --profile production

# Build + submit em um único comando
eas build --platform all --profile production --auto-submit

# Verificar builds recentes
eas build:list --limit 5

# Registrar dispositivo iOS para desenvolvimento
eas device:create
```

---

## Contexto: App Store Connect — seções e o que fazer

| Seção | Ação para o Oikos |
|---|---|
| Criptografia do app | Nada — `ITSAppUsesNonExemptEncryption: false` já declarado no `app.config.ts` |
| Classificações etárias | ✓ Preenchido (4+) |
| Regulamento dos Serviços Digitais | Configurar — declarar conteúdo gerado por usuários (denúncias, marketplace) |
| Dispositivos médicos | Ignorar |
| Notificações do servidor | Ignorar (sem IAP) |
| Segredo compartilhado | Ignorar (sem assinaturas) |
| Screenshots | Capturar via iPhone/TestFlight — tamanhos: 1320×2868 (6.9") e 2064×2752 (iPad 13") |

---

## Contexto: Google Play — requisitos para produção

- Closed Testing Alpha com **mínimo 12 testadores por 14 dias corridos** antes de poder publicar em produção
- Os participantes da pesquisa de mestrado em Rondonópolis são a base natural de testadores
- Staged rollout recomendado no primeiro lançamento público: iniciar com 10–20% dos usuários
