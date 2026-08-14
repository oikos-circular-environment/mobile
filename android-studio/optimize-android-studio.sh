#!/usr/bin/env bash
# ============================================================================
# optimize-android-studio.sh — aplica as otimizações de performance do
# Android Studio (JVM do IDE + garantia do launcher .desktop).
#
# O que faz (idempotente):
#   1. Ajusta /opt/android-studio/bin/studio64.vmoptions:
#        -Xms256m           -> -Xms512m
#        -Xmx2048m          -> -Xmx4096m   (padrão; sobrescreva com --memory)
#        ReservedCodeCacheSize=512m -> 1024m
#        CICompilerCount=2  -> 4          (auto conforme nº de cores)
#   2. Garante /usr/share/applications/jetbrains-studio.desktop correto
#      (Exec/Icon/StartupWMClass — remove o warning de launcher).
#
# Os alvos são root: o script se re-eleva sozinho via sudo ou pkexec.
# Não altera nada fora desses dois arquivos.
#
# Obs.: na elevação (sudo/pkexec) o ambiente é resetado — portanto um caminho
# customizado via ANDROID_STUDIO_HOME não sobrevive à re-execução como root.
# O valor de --memory é repassado via "$@", então esse sobrevive.
#
# Uso:
#   ./optimize-android-studio.sh             # aplica
#   ./optimize-android-studio.sh --dry-run   # só mostra o que mudaria
#   ./optimize-android-studio.sh --memory 6144   # Xmx customizado
#
# Requisitos: Android Studio em /opt/android-studio (ou ANDROID_STUDIO_HOME),
#             sudo ou pkexec disponíveis.
# ============================================================================
set -euo pipefail

STUDIO="${ANDROID_STUDIO_HOME:-/opt/android-studio}"
VMO="$STUDIO/bin/studio64.vmoptions"
DESKTOP="/usr/share/applications/jetbrains-studio.desktop"
XMX=4096
DRY=0

# --- flags ---------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY=1; shift ;;
    --memory) XMX="${2:?--memory requer um valor em MB}"; shift 2 ;;
    *) echo "Uso: $0 [--dry-run] [--memory <MB>]" >&2; exit 1 ;;
  esac
done

log() { echo ">> $*"; }

# --- 1. validar instalação ------------------------------------------------
if [[ ! -f "$VMO" ]]; then
  echo "ERRO: studio64.vmoptions não encontrado em '$VMO'." >&2
  echo "Defina ANDROID_STUDIO_HOME se o Studio estiver em outro caminho." >&2
  exit 1
fi

# --- 2. auto-elevação -----------------------------------------------------
# vmoptions e .desktop são root: se não houver escrita, re-executa como root.
# (dry-run só lê os arquivos — não precisa de root.)
if [[ $DRY -eq 0 ]] && [[ $EUID -ne 0 ]] && { [[ ! -w "$VMO" ]] || [[ ! -w "$DESKTOP" ]]; }; then
  if command -v sudo >/dev/null && sudo -n true 2>/dev/null; then
    log "Arquivos exigem root — elevando via sudo..."
    exec sudo "$0" "$@"
  elif command -v pkexec >/dev/null; then
    log "Arquivos exigem root — elevando via pkexec..."
    exec pkexec "$0" "$@"
  else
    echo "ERRO: '$VMO' e '$DESKTOP' são root. Rode com sudo ou pkexec." >&2
    exit 1
  fi
fi

# --- 3. vmoptions ----------------------------------------------------------
apply_vm() {
  local key="$1" pat="$2" value="$3"
  if grep -qE "$pat" "$VMO"; then
    sed -i -E "s|$pat|$value|" "$VMO"
  else
    echo "$value" >>"$VMO"
  fi
}

CORES="$(nproc)"
CC="$(( CORES / 4 ))"; [[ $CC -lt 2 ]] && CC=2; [[ $CC -gt 4 ]] && CC=4

VMS_OLD="$(mktemp)"
cp "$VMO" "$VMS_OLD"

if [[ $DRY -eq 1 ]]; then
  log "DRY-RUN — alterações propostas em $VMO:"
  sed -E \
    -e "s|^-Xms[0-9]+m$|-Xms512m|" \
    -e "s|^-Xmx[0-9]+m$|-Xmx${XMX}m|" \
    -e "s|^-XX:ReservedCodeCacheSize=.*|-XX:ReservedCodeCacheSize=1024m|" \
    -e "s|^-XX:CICompilerCount=.*|-XX:CICompilerCount=$CC|" \
    "$VMS_OLD" | diff -u "$VMS_OLD" - | sed 's/^/    /' || true
else
  apply_vm xms      '^-Xms[0-9]+m$'               "-Xms512m"
  apply_vm xmx      '^-Xmx[0-9]+m$'               "-Xmx${XMX}m"
  apply_vm codecache '^-XX:ReservedCodeCacheSize=.*' "-XX:ReservedCodeCacheSize=1024m"
  apply_vm cicompiler '^-XX:CICompilerCount=.*'   "-XX:CICompilerCount=$CC"
  log "vmoptions aplicado ($VMO): -Xms512m, -Xmx${XMX}m, CodeCache 1024m, CICompilerCount=$CC"
  diff -u "$VMS_OLD" "$VMO" | sed 's/^/    /' || true
fi
rm -f "$VMS_OLD"

# --- 4. launcher .desktop --------------------------------------------------
DESKTOP_CONTENT='[Desktop Entry]
Version=1.0
Type=Application
Name=Android Studio
Icon='"$STUDIO"'/bin/studio.svg
Exec="'"$STUDIO"'/bin/studio" %f
Comment=The Drive to Develop
Categories=Development;IDE;
Terminal=false
StartupWMClass=jetbrains-studio
StartupNotify=true
'

desktop_needs_fix() {
  [[ -f "$DESKTOP" ]] || return 0
  grep -q "Exec=\"$STUDIO/bin/studio\" %f" "$DESKTOP" || return 0
  grep -q 'StartupWMClass=jetbrains-studio' "$DESKTOP" || return 0
  return 1
}

if desktop_needs_fix; then
  if [[ $DRY -eq 1 ]]; then
    log "DRY-RUN — $DESKTOP seria regravado com o launcher correto."
  else
    log "Corrigindo $DESKTOP..."
    install -m 644 /dev/null "$DESKTOP"
    printf '%s' "$DESKTOP_CONTENT" >"$DESKTOP"
    update-desktop-database /usr/share/applications 2>/dev/null || true
  fi
else
  log "$DESKTOP já está correto (nenhuma mudança)."
fi

# --- 5. verificação --------------------------------------------------------
if [[ $DRY -eq 0 ]]; then
  log "Verificação:"
  grep -E '^-Xms|^-Xmx|ReservedCodeCacheSize|CICompilerCount' "$VMO" | sed 's/^/    /'
  log "Feche e reabra o Android Studio para aplicar. Confirme em:"
  log "    Help -> Edit Custom VM Options  (ou ~/.config/Google/AndroidStudio*/studio64.vmoptions)"
fi
