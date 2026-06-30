# Epic Brief — EAS Build & Submit Pipeline

## Resumo

O app Oikos (React Native/Expo) precisa de um pipeline de build e distribuição funcional para chegar às lojas oficiais. Atualmente o projeto tem o EAS configurado para builds de desenvolvimento e preview, mas nenhum binário de produção foi gerado e as configurações de submissão para as lojas estão vazias. O objetivo deste epic é estabelecer o pipeline completo de `eas build` + `eas submit` para Android e iOS, com credenciais de assinatura gerenciadas pelo EAS, permitindo que builds de produção sejam enviados ao Google Play (Internal Testing) e ao TestFlight de forma automatizada a partir deste ponto.

## Contexto & Problema

**Quem é afetado:** A equipe de desenvolvimento do Oikos — atualmente sem capacidade de distribuir o app para testadores reais ou para as lojas.

**Onde no produto:** Infraestrutura de CI/CD e distribuição — não afeta o código do app em si, apenas o pipeline de entrega.

**A dor atual:**
- O Google Play Console já tem listagem e 2 usuários de teste no Internal Testing Track, mas nenhum build foi submetido — os testadores não conseguem acessar o app.
- O App Store Connect ainda não tem o app criado, bloqueando qualquer distribuição iOS.
- As credenciais de assinatura (keystore Android e certificado iOS) não existem — precisam ser geradas e armazenadas de forma segura pelo EAS.
- O campo `submit.production` no `eas.json` está vazio, sem configuração de conta de serviço Google nem de `ascAppId` Apple.

**Resultado esperado:** Após este epic, um único comando (`eas build --platform all --auto-submit --profile production`) é suficiente para gerar e submeter builds às lojas, com todas as credenciais centralizadas no EAS.

## Estado atual do `eas.json`

```json
{
  "cli": {
    "version": ">= 18.3.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal", "..." : "..." },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": true, "environment": "production" }
  },
  "submit": {
    "production": {}
  }
}
```

## Configuração alvo do `eas.json` (submit)

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./google-service-account.json",
      "track": "internal"
    },
    "ios": {
      "ascAppId": "XXXXXXXXXX",
      "ascApiKeyPath": "./keys/api-key.p8",
      "ascApiKeyIssuerId": "XXXX-XXXX-XXXX",
      "ascApiKeyId": "XXXXXXXXXX"
    }
  }
}
```

## Decisões tomadas

| Decisão | Escolha |
|---|---|
| Credenciais de assinatura | EAS Managed (keystore Android + cert iOS gerados e armazenados pelo EAS) |
| Autenticação App Store Connect | API Key (.p8) — recomendado para automação/CI |
| Track Android inicial | Internal Testing |
| Destino iOS inicial | TestFlight |
| Primeira submissão Android | Manual (restrição da API do Google — obrigatório uma vez) |

## Sequência macro de execução

```
ANDROID                                      iOS
────────────────────────────────────────     ────────────────────────────────────────
1. Criar Google Service Account key          1. Criar app no App Store Connect
2. Conceder permissão no Play Console        2. Obter ascAppId (Apple ID numérico)
3. eas build --platform android              3. Criar API Key (.p8) no App Store Connect
   (EAS gera keystore gerenciado + .aab)     4. eas build --platform ios
4. Download e upload manual do .aab             (EAS gera certificado + provisioning)
   → Internal Testing track                  5. Configurar eas.json com ascAppId e keys
5. Configurar eas.json com service account   6. eas submit --platform ios
6. eas submit --platform android                → vai para TestFlight
   (automatizado a partir daqui)
```
