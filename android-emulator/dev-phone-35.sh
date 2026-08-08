#!/usr/bin/env bash
# ============================================================================
# dev-phone-35.sh — cria (se necessário) e inicia o emulador "dev-phone-35"
#
# Cada script deste diretório corresponde a EXATAMENTE um emulador:
#   dev-phone-35.sh  ->  AVD "dev-phone-35"  (Android API 35)
#
# O emulador é otimizado para performance e enxuto: após o boot, todos os
# apps não essenciais são removidos e o conteúdo de assets/ é injetado em
# /sdcard/Pictures/oikos/ (visível em Arquivos e na Galeria).
#
# Uso:
#   ./dev-phone-35.sh             # cria/inicia com janela
#   ./dev-phone-35.sh --headless  # boot sem janela (CI/automação)
#
# Porta adb fixa: emulator-5554
# Requisitos: bash, Android SDK (ANDROID_HOME ou caminhos padrão), KVM.
#
# Assets: injetados uma única vez (marcador /sdcard/.oikos-assets-injected).
# Para reinjetar após alterar assets/: adb shell rm /sdcard/.oikos-assets-injected
# ============================================================================
set -euo pipefail

# --- identificação do dispositivo (única parte que muda por script) ----------
API_LEVEL=35
DEVICE="dev-phone-35"
IMAGE="system-images;android-35;google_apis;x86_64"
DEVICE_PROFILE="pixel_2"

# --- parametrização de performance -------------------------------------------
RES_W=1080
RES_H=1920
DENSITY=420
RAM_MB=4096
CORES=4
DATA_PARTITION_MB=6144
PORT=5554

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
  log "Criando AVD '$DEVICE' (API $API_LEVEL)..."
  echo no | "$AVDMANAGER" create avd \
    --name "$DEVICE" --package "$IMAGE" --device "$DEVICE_PROFILE" --force >/dev/null
fi

# ---------------------------------------------------------------------------
# 4. Aplicar tweaks de performance no config.ini (idempotente)
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
set_config hw.gpu.mode             host
set_config hw.keyboard             yes
set_config disk.dataPartition.size "${DATA_PARTITION_MB}M"

# ---------------------------------------------------------------------------
# 5. Iniciar o emulador
# ---------------------------------------------------------------------------
BOOT_FLAGS=(-no-boot-anim)
if [[ "$MODE" == "headless" ]]; then
  BOOT_FLAGS+=(-no-window -no-audio -no-snapshot -gpu swiftshader_indirect)
else
  # -feature -Vulkan: GPU do host via GLES (estável em GPUs híbridas Intel+NVIDIA)
  BOOT_FLAGS+=(-gpu host -feature -Vulkan)
fi

log "Iniciando emulador '$DEVICE' ($MODE)..."
"$EMULATOR" -avd "$DEVICE" "${BOOT_FLAGS[@]}" -port "$PORT" &>"/tmp/${DEVICE}.log" &
EMU_PID=$!
trap 'kill "$EMU_PID" 2>/dev/null || true' EXIT

log "Aguardando boot completo..."
for _ in $(seq 1 60); do
  if [[ "$(ADB_DEV shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; then
    log "Boot concluído."
    break
  fi
  sleep 5
done

# ---------------------------------------------------------------------------
# 6. Remover apps não essenciais (device enxuto)
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
# 7. Injetar assets (uma única vez) em Arquivos/Galeria
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

log "$DEVICE pronto e enxuto. Log: /tmp/${DEVICE}.log"
wait "$EMU_PID"
