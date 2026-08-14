# Android Studio — Otimizações

Diretório com o script e a documentação das otimizações aplicadas ao
**Android Studio** nesta máquina. Fica separado de `../android-emulator/`
de propósito: **performance de emulador** vive nos scripts `dev-*.sh`
(compartilhamento entre AVD/config.ini, flags de boot, enxugamento), enquanto
este diretório cuida da **performance da IDE** (JVM do Studio + launcher).

## O que foi feito de fato (histórico real)

| Item | Estado | O que é |
|---|---|---|
| Instalação do Studio Quail 2 (`2026.1.2`, AI-261) | Aplicado | Instalado em `/opt/android-studio` |
| Correção do launcher `.desktop` | Aplicado | `/usr/share/applications/jetbrains-studio.desktop` com `Exec="/opt/android-studio/bin/studio" %f`, `Icon` e `StartupWMClass` — remove o warning de abertura |
| Memória JVM do Studio (`studio64.vmoptions`) | **Aplicado em 2026-08-08** | `-Xmx2048m` → `-Xmx4096m` (+ `-Xms512m`, CodeCache 1024m, CICompilerCount 4) |

> Nota de transparência: antes do script, **nenhuma** configuração de performance
> do Studio havia sido alterada — só a instalação e o fix do launcher. A mudança
> de memória ficou pendente e agora foi aplicada via `optimize-android-studio.sh`.

## Configuração JVM recomendada × padrão

Aplicada em `/opt/android-studio/bin/studio64.vmoptions` (arquivo `root`,
vale para todos os usuários e persiste entre atualizações).

| Opção | Padrão (instalação) | Aplicada | Motivo |
|---|---|---|---|
| `-Xms` | 256m | **512m** | Heap inicial maior evita re-alocações no boot |
| `-Xmx` | 2048m | **4096m** | Host tem 31 GB; 4 GB dá folga sem engolir o Gradle (4096m) + emulador |
| `-XX:ReservedCodeCacheSize` | 512m | **1024m** | Compilação JIT do IDE (Kotlin/Java) usa bastante code cache |
| `-XX:CICompilerCount` | 2 | **4** | Host tem 20 núcleos; mais threads de compilação JIT |

`CICompilerCount` é calculado automaticamente como `núcleos/4`, limitado a 2–4.

## Script: `optimize-android-studio.sh`

Idempotente e auto-elevado (usa `sudo`/`pkexec` quando os arquivos são `root`).
Só toca em **dois arquivos**: o `studio64.vmoptions` e o launcher `.desktop`.

| Comando | O que faz |
|---|---|
| `./optimize-android-studio.sh` | Aplica vmoptions + garante `.desktop`; mostra o diff |
| `./optimize-android-studio.sh --dry-run` | Mostra o que mudaria **sem escrever nada** |
| `./optimize-android-studio.sh --memory 6144` | Aplica com `-Xmx6144m` em vez do padrão 4096 |

### Fluxo
1. Localiza o Studio em `/opt/android-studio` (ou `ANDROID_STUDIO_HOME`).
2. Se os alvos são `root` e está como usuário comum → re-executa com `sudo`/`pkexec`.
3. Ajusta `-Xms`, `-Xmx`, `ReservedCodeCacheSize`, `CICompilerCount` no
   `studio64.vmoptions` (idempotente: rerodar não duplica linhas).
4. Garante o `jetbrains-studio.desktop` correto (executa `update-desktop-database`).
5. Exibe o diff e a verificação final.

## Verificação

Depois de reiniciar o Studio, confirme o valor efetivo:

```bash
# O que o IDE vai usar na próxima abertura (arquivo global root):
grep -E '^-Xms|^-Xmx|ReservedCodeCacheSize|CICompilerCount' /opt/android-studio/bin/studio64.vmoptions

# De dentro do Studio: Help -> Edit Custom VM Options
# (se existir, o override em ~/.config/Google/AndroidStudio*/studio64.vmoptions
#  tem prioridade sobre o /opt — hoje não há override de usuário.)
```

Se quiser ver o heap do Studio rodando: `Help -> Diagnostic Tools -> IDE Memory Indicator`.

## Onde está cada coisa

| Assunto | Onde |
|---|---|
| Emuladores (AVD, flags, bloat, assets) | `../android-emulator/` + `emulator.md` |
| Performance da IDE Android Studio | `optimize-android-studio.sh` + este arquivo |
| Projeto/App (Hermes, CNG, `android/`) | raiz do projeto + `app.config.ts` |
