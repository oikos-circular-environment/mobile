# EAS Build: "Runtime version calculated on local machine not equal to runtime version calculated during build"

Runbook de diagnóstico para quando um build EAS falha na fase `CONFIGURE_EXPO_UPDATES` com esse erro. Já aconteceu mais de uma vez neste projeto, com sintomas ligeiramente diferentes — este documento existe pra não precisar reconstruir a investigação do zero cada vez.

## Sintoma

Build iOS (ou Android) falha na fase `CONFIGURE_EXPO_UPDATES` com:

```
Runtime version mismatch:
- Runtime version calculated on local machine: <hash A>
- Runtime version calculated on EAS: <hash B>

Difference between local and EAS fingerprints:
[...]
Runtime version calculated on local machine not equal to runtime version calculated during build.
```

Acontece porque `app.config.ts` usa `runtimeVersion: { policy: "fingerprint" }`. O EAS CLI calcula um fingerprint (hash) do projeto na sua máquina antes de subir o build, e o worker do EAS recalcula o mesmo fingerprint do lado dele depois de clonar o repo. Se os dois hashes não baterem, o build falha de propósito — a ideia é impedir que uma OTA update publicada localmente seja considerada compatível com um binário que na verdade tem runtime diferente.

## Causa raiz real (confirmada e resolvida em 2026-09-10)

**Não é sobre a pasta `ios/`/`android/` existir ou não existir localmente.** Essa foi a primeira hipótese e é um beco sem saída — ver seção "Pista falsa" abaixo.

A causa real: **build nativo local (`npm run android`, ou qualquer coisa que rode Gradle) reescreve arquivos dentro de `node_modules` permanentemente**, e isso contamina o cálculo do fingerprint mesmo pra build de **iOS**.

Caso concreto encontrado: `node_modules/@react-native-masked-view/masked-view/android/src/main/AndroidManifest.xml` tinha o atributo `package` removido localmente (mutação feita pelo Android Gradle Plugin durante o merge de manifest, ao migrar pra `namespace` no `build.gradle`):

```diff
- <manifest xmlns:android="http://schemas.android.com/apk/res/android">
+ <manifest package="org.reactnative.maskedview" xmlns:android="http://schemas.android.com/apk/res/android">
```

O `@expo/fingerprint` (fonte com reason `rncoreAutolinkingIos`, ver `node_modules/@expo/fingerprint/build/sourcer/Bare.js` → `getCoreAutolinkingSourcesFromExpoIos`) faz hash da pasta **inteira** de cada pacote autolinkado — incluindo o lado Android — mesmo sendo uma fonte usada só pro runtime version do **iOS**. Então um build Android local (que existiu aqui: a pasta `android/` chegou a ter 1,5GB no disco) suja o `node_modules` de um jeito que quebra o fingerprint de iOS também.

O worker do EAS sempre faz `npm ci` num checkout limpo, então nunca vê essa mutação — só a máquina local, que fica com esse `node_modules` "usado" depois de um `npm run android`/`npm run ios`.

### Como foi confirmado

```bash
# 1. gerar fingerprint local e comparar com o hash "local" do erro do build
npx expo-updates fingerprint:generate --platform ios --debug > fp_before.json

# 2. reinstalar limpo (igual o que o worker do EAS faz)
mv node_modules node_modules.bak
npm ci --no-audit --no-fund

# 3. gerar de novo e comparar
npx expo-updates fingerprint:generate --platform ios --debug > fp_after.json

# 4. achar o arquivo exato que mudou
diff -rq node_modules.bak/@react-native-masked-view/masked-view node_modules/@react-native-masked-view/masked-view
```

O hash de `node_modules/@react-native-masked-view/masked-view` bateu exatamente com o hash "EAS" do diff do erro depois do `npm ci` limpo — prova direta.

### Fix

**Sempre rodar `npm ci` (não `npm install`) antes de `eas build`, especialmente depois de ter rodado build nativo local (`npm run android`/`npm run ios`) no mesmo `node_modules`.**

Isso vale pra qualquer profile (`development`, `preview`, `production`) — não é um problema específico de dev build. Trocar a `runtimeVersion.policy` pra fugir disso só empurraria o problema pra frente sem resolver a causa.

## Pista falsa: `ios`/`android` como `bareNativeDir` no diff

O diff do erro pode mostrar algo assim:

```json
{
  "op": "added",
  "addedSource": { "type": "dir", "filePath": "ios", "reasons": ["bareNativeDir"], "hash": null }
}
```

Isso **não é a causa do hash diferente**. Direção do diff: `diffFingerprints(local, eas)` em `node_modules/@expo/fingerprint/build/Fingerprint.js` — `op: "added"` significa presente no **segundo** argumento (EAS), ausente no primeiro (local). Ou seja, essa pasta `ios` existe do lado do worker do EAS (gerada pela fase `PREBUILD`, que roda **antes** de `CALCULATE_EXPO_UPDATES_RUNTIME_VERSION` — confirmado na ordem de fases do log do build), não da sua máquina.

Mas isso **não contribui pro hash final**: em `node_modules/@expo/fingerprint/build/hash/Hash.js`, `createFingerprintFromSourcesAsync` só soma ao hash combinado as fontes com `hash != null`:

```js
for (const source of fingerprintSources) {
  if (source.hash != null) {
    hasher.update(createSourceId(source));
    hasher.update(source.hash);
  }
}
```

A fonte `bareNativeDir` da pasta `ios`, sob workflow `managed`, sempre tem `hash: null` (conteúdo todo coberto por `ignorePaths: ['ios/**/*']` que o `expo-updates` aplica — ver `node_modules/expo-updates/utils/src/createFingerprintAsync.ts`). Aparece no diff como ruído informativo, mas não é o que derruba o build. **Não gaste tempo tentando "sincronizar" a existência da pasta `ios`/`android` entre local e EAS — isso não resolve nada.**

(Detalhe técnico à parte: `getFileBasedHashSourceAsync` em `Utils.js` só faz `fs.stat` na pasta — não respeita `.fingerprintignore` nem `ignorePaths` pra decidir se a fonte existe, só pro hash do conteúdo. É por isso que a pasta aparece no diff mesmo sob `managed` workflow.)

## Checklist de diagnóstico rápido pra próxima vez

1. Baixar o log do build (`eas build:list --json` pra achar `logFiles[0]`, é uma URL assinada do GCS com `content-encoding: br` — precisa `zlib.brotliDecompressSync`, não é texto puro nem gzip).
2. Achar a fase `CONFIGURE_EXPO_UPDATES` no log decodificado e ler a mensagem de erro + o diff de fingerprint completo.
3. Pra cada entrada do diff com `op: "changed"` (não `"added"`/`"removed"` de pasta `ios`/`android` — essas geralmente são ruído, ver seção acima): essa é a fonte real do hash diferente. Anotar o `filePath` e a `reason`.
4. Rodar localmente `npx expo-updates fingerprint:generate --platform <ios|android> --debug` e conferir se o hash da fonte bate com o `beforeSource.hash` (local) do diff do erro — confirma reprodução local.
5. `mv node_modules node_modules.bak && npm ci` e gerar de novo. Se o hash da fonte suspeita bater agora com `afterSource.hash` (EAS) do diff, causa confirmada: `node_modules` local estava sujo.
6. `diff -rq` entre o `node_modules.bak` e o novo pra achar o arquivo exato mutado, se quiser entender o mecanismo específico dessa vez (pode não ser o mesmo arquivo/pacote da vez anterior).
7. Fix: `npm ci` antes do próximo `eas build`. Se o build já foi disparado com `node_modules` sujo, é só rodar `npm ci` e tentar de novo — não precisa mexer em `app.config` nem em `.fingerprintignore`.

## Outras correções feitas na mesma investigação (não relacionadas à causa raiz acima, mas no mesmo branch)

- `.easignore`: ao existir, **substitui completamente** o `.gitignore` no processo de upload do `eas build` (não é aditivo — ver comentário em `node_modules/eas-cli/build/vcs/local.js`: *"if .easignore exists, .gitignore files are not used"*). Um `.easignore` incompleto fez o upload saltar pra 510MB porque `android/` (que o `.gitignore` ignorava) parou de ser ignorado. Corrigido replicando todo o `.gitignore` dentro do `.easignore`, mais pastas extras irrelevantes pro build (`docs/`, `plans/`, `.claude/`, `.opencode/`, etc.) que são versionadas mas não entram no processo de build do EAS.
- `.fingerprintignore`: adicionado `node_modules/**/android/build/**/*`, `node_modules/**/android/.cxx/**/*`, `node_modules/**/ios/build/**/*` — útil pra outros cenários de sujeira de build (diretórios de output), mas não resolve o caso do `AndroidManifest.xml` mutado in-place (não é um diretório de build, é o próprio arquivo fonte do pacote sendo reescrito).
- Removidas as pastas `ios/`/`android/` que existiam soltas no repo local (geradas por `npm run ios`/`npm run android` anteriores, não versionadas). Boa prática de higiene geral, mas — reforçando — não é o que resolve o mismatch de fingerprint.
