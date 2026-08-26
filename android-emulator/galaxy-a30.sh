#!/usr/bin/env bash
# ============================================================================
# galaxy-a30.sh — cria (se necessário) e inicia o emulador "galaxy-a30"
#
# Cada script deste diretório corresponde a EXATAMENTE um emulador:
#   galaxy-a30.sh  ->  AVD "galaxy-a30"  (Android API 35)
#
# Reproduz a geometria de tela e a navegação de um Samsung Galaxy A30
# (SM-A305GT) físico usado em teste (ver docs/device-analysis-samsung-sm-a305gt.md
# na raiz do projeto) — resolução, densidade e barra de navegação por 3 botões
# idênticas, para investigar bugs de layout que só aparecem nessa geometria
# (ex.: texto do splash cortado, botões colados na barra de navegação).
#
# O emulador é otimizado para performance e enxuto: após o boot, todos os
# apps não essenciais são removidos e o conteúdo de assets/ é injetado em
# /sdcard/Pictures/oikos/ (visível em Arquivos e na Galeria).
#
# Uso:
#   ./galaxy-a30.sh             # cria/inicia com janela
#   ./galaxy-a30.sh --headless  # boot sem janela (CI/automação)
#
# Porta adb fixa: emulator-5560
# Requisitos: bash, Android SDK (ANDROID_HOME ou caminhos padrão), KVM.
#
# Assets: injetados uma única vez (marcador /sdcard/.oikos-assets-injected).
# Para reinjetar após alterar assets/: adb shell rm /sdcard/.oikos-assets-injected
# ============================================================================
set -euo pipefail

# --- identificação do dispositivo (única parte que muda por script) ----------
API_LEVEL=35
DEVICE="galaxy-a30"
IMAGE="system-images;android-35;google_apis;x86_64"
DEVICE_PROFILE="pixel_5" # unico perfil base com resolucao 1080x2340 nativa

# --- parametrização de performance -------------------------------------------
# Resolucao/densidade replicam o Galaxy A30 (SM-A305GT) real: 1080x2340,
# ~420dpi, navegacao por 3 botoes on-screen (nao gestos, nao teclas fisicas).
RES_W=1080
RES_H=2340
DENSITY=420
RAM_MB=3840
CORES=4
DATA_PARTITION_MB=6144
PORT=5560

MODE="windowed"
[[ "${1:-}" == "--headless" ]] && MODE="headless"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/assets"
AVD_DIR="$HOME/.android/avd/$DEVICE.avd"
CONFIG="$AVD_DIR/config.ini"

log() { echo ">> $*"; }

# ---------------------------------------------------------------------------
# 1. Localizar o Android SDK
# ---------------------------------------------------------------------------
resolve_sdk() {
  local dir
  for dir in \
    "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" \
    "$HOME/Android/Sdk" "$HOME/Library/Android/sdk" \
    "/usr/local/share/android-sdk" "/opt/android-sdk"; do
    if [[ -n "$dir" && -d "$dir/emulator" ]]; then
      echo "$dir"
      return 0
    fi
  done
  echo "ERRO: Android SDK não encontrado. Defina ANDROID_HOME." >&2
  exit 1
}

SDK="$(resolve_sdk)"
EMULATOR="$SDK/emulator/emulator"
ADB="$SDK/platform-tools/adb"
SERIAL="emulator-$PORT"
ADB_DEV() { "$ADB" -s "$SERIAL" "$@"; }

find_tool() {
  local name="$1" p
  for p in "$SDK/cmdline-tools/latest/bin/$name" "$SDK/tools/bin/$name"; do
    [[ -x "$p" ]] && { echo "$p"; return 0; }
  done
  if compgen -G "$SDK/cmdline-tools/*/bin/$name" >/dev/null; then
    compgen -G "$SDK/cmdline-tools/*/bin/$name" | head -1
    return 0
  fi
  command -v "$name" && return 0
  echo "ERRO: $name não encontrado no SDK." >&2
  exit 1
}
SDKMANAGER="$(find_tool sdkmanager)"
AVDMANAGER="$(find_tool avdmanager)"

# ---------------------------------------------------------------------------
# 2. Garantir a imagem de sistema
# ---------------------------------------------------------------------------
if [[ ! -d "$SDK/${IMAGE//;//}" ]]; then
  log "Instalando imagem de sistema: $IMAGE"
  "$SDKMANAGER" "$IMAGE"
fi

# ---------------------------------------------------------------------------
# 3. Criar o AVD se não existir
# ---------------------------------------------------------------------------
if [[ ! -f "$CONFIG" ]]; then
  log "Criando AVD '$DEVICE' (API $API_LEVEL, perfil $DEVICE_PROFILE)..."
  echo no | "$AVDMANAGER" create avd \
    --name "$DEVICE" --package "$IMAGE" --device "$DEVICE_PROFILE" --force >/dev/null
fi

# ---------------------------------------------------------------------------
# 4. Aplicar tweaks de performance e geometria no config.ini (idempotente)
# ---------------------------------------------------------------------------
set_config() {
  local key="$1" value="$2"
  if grep -qE "^${key}=" "$CONFIG"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$CONFIG"
  else
    echo "${key}=${value}" >>"$CONFIG"
  fi
}

log "Aplicando configuração otimizada em '$CONFIG'"
set_config hw.lcd.width            "$RES_W"
set_config hw.lcd.height           "$RES_H"
set_config hw.lcd.density          "$DENSITY"
set_config hw.ramSize              "${RAM_MB}"
set_config hw.cpu.ncore            "$CORES"
set_config hw.gpu.enabled          yes
# swiftshader_indirect (software): -gpu host trava intermitentemente nesta GPU
# híbrida Intel+NVIDIA (erros "ColorBuffer"/"bad color buffer handle" no
# gfxstream, mesmo com boot bem-sucedido). Fica gravado no config.ini para que
# qualquer lançador (Android Studio, Expo, `emulator` direto) herde a mesma
# config estável, não só este script.
set_config hw.gpu.mode             swiftshader_indirect
set_config hw.keyboard             yes
set_config disk.dataPartition.size "${DATA_PARTITION_MB}M"
# mainKeys=no => sem teclas fisicas, o Android desenha a barra de navegacao
# on-screen (que forcamos para 3 botoes no passo 6, igual ao A30 real).
set_config hw.mainKeys              no

# ---------------------------------------------------------------------------
# 5. Iniciar o emulador
# ---------------------------------------------------------------------------
BOOT_FLAGS=(-no-boot-anim -gpu swiftshader_indirect)
if [[ "$MODE" == "headless" ]]; then
  BOOT_FLAGS+=(-no-window -no-audio -no-snapshot)
fi

log "Iniciando emulador '$DEVICE' ($MODE)..."
nohup "$EMULATOR" -avd "$DEVICE" "${BOOT_FLAGS[@]}" -port "$PORT" \
  </dev/null &>"/tmp/${DEVICE}.log" &
EMU_PID=$!
disown
echo "$EMU_PID" >"/tmp/${DEVICE}.pid"

log "Aguardando boot completo..."
for _ in $(seq 1 60); do
  if [[ "$(ADB_DEV shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; then
    log "Boot concluído."
    break
  fi
  sleep 5
done

# ---------------------------------------------------------------------------
# 6. Forçar navegação por 3 botões (o A30 real não usa gestos nem teclas físicas)
# ---------------------------------------------------------------------------
log "Ativando navegação por 3 botões (overlay threebutton)..."
ADB_DEV shell cmd overlay enable-exclusive \
  --category com.android.internal.systemui.navbar.threebutton \
  com.android.internal.systemui.navbar.threebutton >/dev/null 2>&1 || true
ADB_DEV shell cmd overlay enable com.android.internal.systemui.navbar.threebutton >/dev/null 2>&1 || true
ADB_DEV shell cmd overlay disable com.android.internal.systemui.navbar.gestural >/dev/null 2>&1 || true

# ---------------------------------------------------------------------------
# 7. Remover apps não essenciais (device enxuto — mesma lista dos outros AVDs)
# ---------------------------------------------------------------------------
BLOAT_APPS=(
  com.google.android.apps.maps
  com.google.android.apps.docs
  com.google.android.apps.wellbeing
  com.google.android.apps.youtube.music
  com.google.android.calendar
  com.google.android.contacts
  com.google.android.dialer
  com.google.android.gm
  com.google.android.youtube
  com.google.android.deskclock
  com.google.android.apps.messaging
  com.google.android.googlequicksearchbox
  com.google.android.markup
  com.google.android.apps.wallpaper
  com.google.android.apps.wallpaper.nexus
  com.google.android.apps.restore
  com.google.android.apps.safetyhub
  com.android.chrome
  com.google.android.tag
)

log "Removendo apps não essenciais..."
for pkg in "${BLOAT_APPS[@]}"; do
  if [[ "$(ADB_DEV shell pm uninstall --user 0 "$pkg" 2>/dev/null | tr -d '\r')" == "Success" ]]; then
    log "  removido: $pkg"
  fi
done

# ---------------------------------------------------------------------------
# 8. Injetar assets (uma única vez) em Arquivos/Galeria
# ---------------------------------------------------------------------------
inject_assets() {
  local marker="/sdcard/.oikos-assets-injected"
  if [[ ! -d "$ASSETS_DIR" || -z "$(ls -A "$ASSETS_DIR" 2>/dev/null)" ]]; then
    log "assets/ vazio — nada a injetar."
    return 0
  fi
  if [[ "$(ADB_DEV shell "test -f $marker && echo yes" 2>/dev/null | tr -d '\r')" == "yes" ]]; then
    log "Assets já injetados (marcador presente)."
    return 0
  fi
  log "Injetando assets/ em /sdcard/Pictures/oikos/ ..."
  ADB_DEV shell mkdir -p /sdcard/Pictures/oikos
  ADB_DEV push "$ASSETS_DIR/." /sdcard/Pictures/oikos/ >/dev/null
  ADB_DEV shell touch "$marker"
  for f in "$ASSETS_DIR"/*; do
    ADB_DEV shell am broadcast \
      -a android.intent.action.MEDIA_SCANNER_SCAN_FILE \
      -d "file:///sdcard/Pictures/oikos/$(basename "$f")" &>/dev/null || true
  done
  log "Assets disponíveis em Arquivos/Galeria."
}
inject_assets

log "$DEVICE pronto e enxuto (PID $EMU_PID, salvo em /tmp/${DEVICE}.pid). Log: /tmp/${DEVICE}.log"
log "Para encerrar: adb -s $SERIAL emu kill   (ou: kill \$(cat /tmp/${DEVICE}.pid))"
