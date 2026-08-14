# Emuladores Android — Oikos

Diretório com os scripts para criar e subir os emuladores Android usados no
desenvolvimento do app. **1 script por dispositivo** (kebab-case). Todos são
**idempotentes e autocontidos**: se o AVD foi apagado, o script recria tudo do
zero (imagem de sistema → AVD → otimização → boot → enxugamento → assets).

## Dispositivos

| Script | AVD criado | Dispositivo | Resolução | RAM | Porta adb fixa |
|---|---|---|---|---|---|
| `dev-phone-35.sh` | `dev-phone-35` | Phone (pixel_2) | 1080x1920 @ 420dpi | 4 GB | `emulator-5554` |
| `dev-phone-36.sh` | `dev-phone-36` | Phone (pixel_2) | 1080x1920 @ 420dpi | 4 GB | `emulator-5556` |
| `dev-tablet-36.sh` | `dev-tablet-36` | Tablet (pixel_tablet) | 2560x1600 @ 320dpi | 6 GB | `emulator-5558` |

Cada script fixa sua porta (`-port`) e roda todos os comandos `adb` com
`-s emulator-<porta>`, então vários emuladores podem ficar abertos ao mesmo
tempo sem que os comandos caiam no dispositivo errado.

O emulador é iniciado com `nohup`/`disown` (detached da sessão do terminal),
então continua rodando mesmo depois que o terminal que rodou o script é
fechado — o script termina assim que o boot + enxugamento + injeção de
assets acabam, sem prender o terminal. O PID fica salvo em
`/tmp/<device>.pid`. Para encerrar manualmente:

```bash
adb -s emulator-<porta> emu kill
# ou
kill $(cat /tmp/<device>.pid)
```

### GPU: por que `swiftshader_indirect` e não `-gpu host`

`-gpu host` (passthrough de GPU real) trava o emulador de forma intermitente
nesta máquina (GPU híbrida Intel iGPU + NVIDIA dGPU): o boot completa
normalmente, mas o processo às vezes morre segundos depois com erros do
gfxstream (`ColorBuffer`/`bad color buffer handle`). Isso derruba o
emulador não só rodando pelos scripts, mas por **qualquer** lançador —
Android Studio, `emulator -avd ...` direto, ou o auto-launch do Expo CLI —
e explica erros como `CommandError: Failed to get properties for device` /
`Error [ERR_STREAM_UNABLE_TO_PIPE]` ao rodar `npm start`/`npm run android`
logo depois do emulador cair.

Por isso os scripts gravam `hw.gpu.mode=swiftshader_indirect` direto no
`config.ini` do AVD (passo 4), em vez de só passar `-gpu` na linha de
comando: como fica persistido no AVD, qualquer lançador herda a config
estável, não só quem passou a flag. É renderização por software — mais
lenta que GPU real, mas sem os crashes aleatórios.

## Como funciona cada script

1. **Imagem de sistema** — instala `system-images;android-<api>;google_apis;x86_64`
   somente se não estiver instalada no SDK.
2. **AVD** — cria via `avdmanager` se não existir (`~/.android/avd/<device>.avd`).
3. **Otimização** — grava no `config.ini`: resolução/densidade, 4 GB/6 GB RAM,
   4 cores, GPU por software (`swiftshader_indirect`, ver seção abaixo),
   teclado físico, partição data 6 GB.
4. **Boot** — com `-no-boot-anim` (e KVM no Linux), aguarda `sys.boot_completed=1`.
5. **Enxugamento** — remove apps não essenciais com
   `pm uninstall --user 0` (persiste entre reboots). **A galeria
   (`com.google.android.apps.photos`) é preservada.**
6. **Assets** — injeta `assets/` em `/sdcard/Pictures/oikos/` (visível em
   Arquivos e na Galeria), **uma única vez**.

### Assets

- Local no emulador: `/sdcard/Pictures/oikos/`
- Marcador de injeção: `/sdcard/.oikos-assets-injected`
- Para reinjetar após alterar arquivos em `assets/`, apague o marcador e rode o script:

```bash
adb shell rm /sdcard/.oikos-assets-injected
```

- Os arquivos são indexados automaticamente no MediaStore (ficam em "Recents"
  no app Files e disponíveis no seletor de imagens).

## Tabela de comandos e flags

### Scripts do diretório

| Comando | O que faz | Flags |
|---|---|---|
| `./dev-phone-35.sh` | Cria (se preciso) e inicia o emulador API 35 com janela | — |
| `./dev-phone-36.sh` | Cria (se preciso) e inicia o emulador API 36 com janela | — |
| `./dev-tablet-36.sh` | Cria (se preciso) e inicia o tablet API 36 com janela | — |
| `./<script>.sh --headless` | Boot sem janela (CI/automação) | `--headless` |

Todos os scripts aceitam `--headless` no final. Sem ele, o modo é `windowed`.

### Emulador (CLI do SDK)

| Comando | O que faz | Flags/exemplo |
|---|---|---|
| `emulator -list-avds` | Lista os AVDs existentes | `emulator -list-avds` |
| `emulator -avd <nome>` | Inicia um AVD diretamente (sem os extras do script) | `emulator -avd dev-phone-36` |
| `-no-boot-anim` | Desativa a animação de boot (boot mais rápido) | `emulator -avd dev-phone-36 -no-boot-anim` |
| `-no-window` | Roda sem janela (headless) | combo CI: `-no-window -no-audio -no-snapshot -gpu swiftshader_indirect` |
| `-no-snapshot` | Ignora snapshots (boot frio determinístico) | `emulator -avd dev-phone-36 -no-snapshot` |
| `-no-audio` | Sem áudio | `-no-audio` |
| `-gpu host` | GPU do host (GLES) — **evitar** nesta máquina, trava intermitente | `-gpu host` |
| `-gpu swiftshader_indirect` | GPU por software — estável, usada por padrão nos scripts | `-gpu swiftshader_indirect` |
| `-memory <MB>` | Sobrescreve RAM | `-memory 4096` |
| `-cores <n>` | Sobrescreve número de cores | `-cores 4` |
| `-wipe-data` | Formata os dados do AVD (útil se corromper) | `-avd dev-phone-36 -wipe-data` |

> Os scripts já aplicam a combinação ideal (`-no-boot-anim -gpu swiftshader_indirect`
> no windowed; mais `-no-window -no-audio -no-snapshot` no headless) e persistem
> `hw.gpu.mode=swiftshader_indirect` no `config.ini`. Use o `emulator` direto só
> para casos pontuais.

### adb (Android Debug Bridge)

| Comando | O que faz | Flags/exemplo |
|---|---|---|
| `adb devices` | Lista dispositivos conectados | `adb devices` |
| `adb shell` | Abre shell no dispositivo | `adb shell ls /sdcard` |
| `adb install -r <apk>` | Instala/atualiza o app | `adb install -r app-debug.apk` |
| `adb push <origem> <destino>` | Copia arquivos para o emulador | `adb push assets/. /sdcard/Pictures/oikos/` |
| `adb shell pm uninstall --user 0 <pkg>` | Remove app de usuário (persistente) | `adb shell pm uninstall --user 0 com.android.chrome` |
| `adb shell pm list packages` | Lista pacotes instalados | `adb shell pm list packages \| grep photos` |
| `adb reverse tcp:8081 tcp:8081` | Expõe o Metro bundler para o app | `adb reverse tcp:8081 tcp:8081` |
| `adb logcat` | Logs do sistema/app | `adb logcat \| grep ReactNative` |
| `adb shell getprop sys.boot_completed` | `1` = boot concluído | `adb shell getprop sys.boot_completed` |
| `adb exec-out screencap -p > tela.png` | Tira screenshot (viewport) | `adb exec-out screencap -p > /tmp/tela.png` |
| `adb shell screencap -p /sdcard/tela.png` | Screenshot salvo no dispositivo | `adb shell screencap -p /sdcard/tela.png` |
| `adb shell content query --uri content://media/external/images/media` | Consulta MediaStore (imagens indexadas) | `adb shell content query --uri content://media/external/images/media --projection _display_name` |
| `adb shell rm /sdcard/.oikos-assets-injected` | Reativa a injeção de assets no próximo script | `adb shell rm /sdcard/.oikos-assets-injected` |
| `adb -s emulator-<porta> <cmd>` | Mira um emulador específico (com vários abertos) | `adb -s emulator-5558 shell wm size` |
| `adb emu kill` | Encerra o emulador conectado | `adb emu kill` |

> ⚠️ `adb emu kill` derruba o **dispositivo alvo do adb** (em geral `emulator-5554`).
> Com mais de um emulador aberto, especifique com `-s`:
> `adb -s emulator-5558 emu kill`.

### App (dev com Expo)

| Comando | O que faz | Flags/exemplo |
|---|---|---|
| `npx expo run:android` | Build nativo e instala no emulador ativo | `npx expo run:android` |
| `npx expo start` | Sobe o Metro bundler | `npx expo start` |
| `npx expo prebuild` | Regenera `android/` (CNG) a partir do `app.config.ts` | `npx expo prebuild --no-install` |

> `android/` é gerado e ignorado pelo git (CNG). Configuração nativa **deve** ser
> feita no `app.config.ts` (ex.: plugin `expo-build-properties`), não nos arquivos
> gerados — senão é sobrescrita no próximo prebuild e não chega ao EAS.

## Requisitos

- Linux com KVM (para aceleração)
- Android SDK em `ANDROID_HOME`, `~/Android/Sdk` ou caminhos padrão
- Imagens `google_apis` (Play Services presentes) instaladas via `sdkmanager`
