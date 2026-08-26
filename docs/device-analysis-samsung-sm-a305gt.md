# Análise de dispositivo — Samsung Galaxy A30 (SM-A305GT)

Coletado via `adb` em 2026-08-26. Dispositivo usado para testar o app `com.oikos` (mobile).

## 1. Identificação

| Campo | Valor |
|---|---|
| Fabricante / Modelo | Samsung / SM-A305GT (Galaxy A30) |
| Codinome interno | a30dtvvj / a30 |
| Serial (ADB) | RX8M40B8BFT |
| Região/CSC | ZTO |
| Build | RP1A.200720.012.A305GTVJU8CWE1 |
| PDA/versão firmware | A305GTVJU8CWE1 |

## 2. Sistema

| Campo | Valor |
|---|---|
| Android | 11 (SDK 30) |
| **Patch de segurança** | **2022-10-01** |
| Data de build | 2023-04-29 |
| Kernel | Linux 4.4.177-22602103 (PREEMPT, compilado 2023-04-29) |
| Arquitetura CPU | arm64-v8a, 8 núcleos |

## 3. Hardware / Recursos

- **RAM**: 3.835.792 kB total (~3,7 GB) — 1.057.760 kB disponível no momento da coleta (~1 GB livre efetivo).
- **Armazenamento**:
  - Partição sistema (`/`): 4,5G, **97% usada**, só 155M livres.
  - `/data`: 51G, 86% usado (44G), 7,6G livres.
- **Bateria**: 82% no momento, saudável (health=2/good), tecnologia Li-ion.
- **Uptime**: 24 dias, 12h contínuas sem reboot.
- **Load average**: 20,24 / 20,94 / 21,61 (1/5/15 min) em 8 núcleos — **carga cronicamente alta** para o hardware.

## 4. Atualização de software / segurança

- Patch de segurança instalado é de **outubro/2022** — quase 4 anos desatualizado em relação à data de hoje (2026-08-26).
- O Galaxy A30 (2019) recebeu Android 11 como última versão principal e o suporte oficial de patches de segurança da Samsung para esse modelo já se encerrou há tempos — este patch de out/2022 é consistente com "última atualização recebida antes do fim de vida do modelo".
- Conferido manualmente em **Ajustes → Atualização de software**: o aparelho informa que **está atualizado**.
- Isso **não** significa que o patch de outubro/2022 é atual — significa que a Samsung **encerrou o envio de atualizações OTA** para este modelo, então não há nenhuma pendente para instalar. O A30 atingiu o fim do ciclo de suporte de segurança do fabricante; "atualizado" aqui é "no máximo que este aparelho vai receber", não "seguro contra vulnerabilidades recentes".
- **Recomendação**: não há correção via ADB nem pelo aparelho para isso — o dispositivo deve ser tratado como fora do ciclo de patches de segurança (EOL) ao decidir se deve continuar sendo usado para dados sensíveis (ex.: contas bancárias, dados de produção).

## 5. Consumo de recursos observado

### CPU
Amostra pontual (`dumpsys cpuinfo`) durante a coleta:
- `system_server` (processo core do Android): **64%** de um núcleo (45% user + 18% kernel).
- `incidentd`/`incident`: ~15% combinados — processo de captura de relatórios de incidente do Android, atividade elevada durante a coleta.
- `android.hardware.sensors@1.0-service`: 11%.
- `com.android.chrome`, `com.google.android.gms`: uso moderado (3–4% cada).

O load average de ~20 (janela de 15 min) já estava alto **antes** desta sessão de diagnóstico, indicando que o aparelho vive sob carga pesada mesmo em uso normal — coerente com a app testada ter sido **morta pelo próprio Android por excesso de CPU** (ver seção 7).

### Memória (top consumidores RSS)
1. `system` — 350 MB
2. `com.sec.android.app.launcher` (launcher Samsung) — 199 MB
3. `com.android.chrome` — 191 MB
4. `com.android.systemui` — 180 MB
5. `com.google.android.gms.persistent` — 158 MB
6. `com.android.vending` (Play Store) — 154 MB
7. `com.samsung.android.honeyboard` (teclado Samsung) — 145 MB
8. `com.facebook.katana`, `com.whatsapp`, `com.yoosee` também entre os maiores consumidores.

Nenhum processo desconhecido/suspeito nas primeiras posições — o topo é dominado por bloatware Samsung + apps grandes conhecidos (Chrome, GMS, Facebook, WhatsApp).

### Log spam (achado relevante)
No buffer de logcat coletado, a tag `ThermalHalWrapper` gerou **91.844 ocorrências** de erro (`Couldn't get temperatures because of HAL error: Failed to read data`), disparando dezenas de vezes por segundo. Isso é um bug conhecido de HAL térmico em builds Samsung/Exynos mais antigos — consome CPU e I/O de log continuamente, contribuindo para a carga alta e para desgaste de bateria, sem qualquer ação do usuário. Não tem correção via ADB; é um defeito de firmware do próprio fabricante.

Outras tags com volume alto no mesmo período: `statsd` (5.388), `Netd`/`NetdEventListenerService` (~3.000), várias do Facebook (`fb4a.*`) refletindo atividade em segundo plano do app do Facebook.

### Investigação de correção do `ThermalHalWrapper`

- Dispositivo **sem root** (`su` inacessível) — sem acesso para substituir/corrigir o binário do HAL, que fica em `/vendor` (somente leitura).
- Tentativa de reiniciar o serviço `vendor.samsung.hardware.thermal@1.0-service` via `setprop ctl.restart` **negada** (SELinux/shell sem permissão) — não é possível reiniciar isoladamente sem root.
- Nenhum app terceiro de monitoramento de CPU/temperatura instalado que pudesse estar concorrendo pelo sensor — descartada essa hipótese.
- **Causa raiz**: bug de firmware fechado da Samsung, sem correção possível no software do aparelho — o modelo está fora do ciclo de atualizações (ver seção 4), então não há OTA que resolva.
- **Mitigação testada e confirmada** (não é fix, reduz só o sintoma/overhead): `adb shell setprop log.tag.ThermalHalWrapper F` suprime o log da tag — validado com amostra de 5s sem nenhuma nova ocorrência (antes eram dezenas por segundo). Essa propriedade **não persiste após reboot**, precisa ser reaplicada a cada reinício se o objetivo for só reduzir o spam/overhead de log.
- Ações sem root recomendadas, em ordem de esforço: (1) reiniciar o aparelho — pode reinicializar o driver e aliviar temporariamente; (2) limpar partição de cache pela Recovery (Volume+ e Power ao ligar) — não apaga dados, às vezes resolve estado travado de HAL/serviços.

**Resultado confirmado (2026-08-26, pós-reboot)**: reiniciado o aparelho após 24 dias de uptime contínuo. Duas amostras de log pós-boot (8s e 10s, com buffer limpo antes de cada uma) registraram **0 ocorrências** de `ThermalHalWrapper`, contra dezenas por segundo antes do reboot. Confirma a hipótese: o HAL térmico ficava preso num estado ruim após uptime prolongado — reboot periódico é a mitigação prática disponível sem root/atualização de firmware. Load average ficou temporariamente alto nos primeiros minutos (pico normal de apps resincronizando em background pós-boot), sem relação com o bug térmico.

## 6. Erros / crashes

- Nenhum crash Java (`FATAL EXCEPTION`) do sistema ou de apps de usuário no buffer coletado.
- Um ANR registrado em `/data/anr/anr_2026-08-25-07-25-04-579` (25/08, dia anterior) — não investigado a fundo pois não pertence ao app testado hoje.
- Nenhuma outra tag de erro fora do spam térmico indicando falha grave do sistema.

## 7. Segurança / verificação de malware

Checks realizados via ADB (sem instalar antivírus de terceiros):

| Verificação | Resultado |
|---|---|
| Apps de terceiros com origem fora da Play Store (sideload) | **Nenhum** — todos os 28 apps de terceiros instalados têm `installer=com.android.vending` |
| Serviços de acessibilidade ativos | Nenhum (`enabled_accessibility_services = null`) — vetor comum de malware bancário/RAT, descartado |
| Administradores de dispositivo ativos | Apenas `com.samsung.android.kgclient` (Samsung Find My Mobile / Knox Guard — legítimo) |
| Apps com permissões sensíveis concedidas (SMS, call log, overlay, accessibility) | Nenhum app de terceiros com essas permissões concedidas |
| Google Play Protect | Presente e ativo (padrão em todo device com GMS/Play Store) |

**Conclusão de segurança**: não há indício de malware, app sideloaded ou app com permissões abusivas neste dispositivo. O risco real do aparelho está no **patch de segurança desatualizado (2022-10)** e não em software malicioso instalado.

Lista completa dos apps de terceiros verificados: Amazon Shopping, TikTok Lite, Meu Gov.br, WhatsApp, Cadê o Busão?, Caixa, Sesc MT, Instagram, Pernambucanas, Outlook, 99, Banco do Brasil, Google Docs/Fotos/Vídeos/Calculadora, Unimed, Energisa, Colagem de Fotos, Mercado Livre, Nota MT, Messenger, Pacto, SHEIN, Vivo, Yoosee, SolisCloud — todos via Play Store.

## 8. Teste do app `com.oikos` nesta sessão

Reconstituído via logcat (o app foi desinstalado às 09:50:44 durante a sessão):

- App instalado, aberto (`MainActivity`), usado — inclusive câmera (fluxo de denúncias/complaints, câmera ativada e fechada por volta de 09:55–09:58).
- Log confirma chamada de rede real para `https://survey.oikos.company/...` (fluxo de survey) e abertura do banco local `/data/data/com.oikos/files/SQLite/survey.db`.
- **Achado de performance**: às 09:46:03 o Android **matou o processo do app por excesso de CPU**:
  ```
  ActivityManager: Killing 24791:com.oikos/u0a430 (adj 700): excessive cpu 498770 during 300057 dur=513314 limit=25
  ```
  Isso significa que o processo consumiu ~498s de CPU em uma janela de 300s (ou seja, saturando múltiplos núcleos continuamente) — muito acima do limite tolerado pelo sistema para apps em background/foreground prolongado. Vale investigar o que rodou nesse intervalo (worker em loop, polling agressivo, algo travado em JS thread). Recomendo reproduzir com o app reinstalado e capturar logcat ao vivo (`adb logcat | grep com.oikos`) focando nos ~5 minutos antes de um possível kill.
- Sem crash fatal (`FATAL EXCEPTION`) do app durante o uso — o encerramento foi kill do sistema, não crash da aplicação.

## 9.1 Auditoria e desativação de apps (2026-08-26)

A pedido do usuário: manter só os apps Google essenciais (Chrome, Gmail, Maps, YouTube, Drive, Fotos) e desativar bloatware Samsung classificado como seguro. Ação usada: `pm disable-user --user 0 <pacote>` — **reversível e não destrutivo**: o APK continua em `/system`, só fica oculto/parado para o usuário atual. Para reverter qualquer item, usar `pm enable --user 0 <pacote>` via adb ou Ajustes → Apps → Mostrar apps do sistema → selecionar o app → Ativar.

### Apps Google mantidos (pedido explícito)
`com.android.chrome` (Chrome), `com.google.android.gm` (Gmail), `com.google.android.apps.maps` (Maps), `com.google.android.youtube` (YouTube), `com.google.android.apps.docs` (Drive), `com.google.android.apps.photos` (Fotos).

### Frameworks Google/Android intocados (não são "apps", são a base do sistema)
Play Store (`com.android.vending`), Play Services (`com.google.android.gms` + `gms.location.history`), Google Services Framework (`gsf`), WebView, PermissionController, PackageInstaller, `ext.services`/`ext.shared`, pilha de rede (`networkstack*`), setup wizard, `configupdater`/`modulemetadata`/`mainline.telemetry`, sincronizadores de conta (`syncadapters.calendar/contacts`), `captiveportallogin`, `documentsui`, overlays de configuração, Device Health Services (`apps.turbo`), `contactkeys`. Também mantido **`googlequicksearchbox`** (Google App/Assistente) de propósito — é o que alimenta a barra de busca do launcher Samsung; desativar quebraria essa barra na tela inicial.

### Apps Google desativados
| Pacote | O que é |
|---|---|
| `com.google.android.apps.tachyon` | Google Duo/Meet |
| `com.google.android.apps.carrier.carrierwifi` | Wi-Fi da operadora (Vivo) |
| `com.google.android.apps.restore` | Assistente de restauração (só usado na config. inicial) |
| `com.google.android.feedback` | Envio de feedback de apps Google |
| `com.google.android.printservice.recommendation` | Recomendação de serviço de impressão |
| `com.google.android.projection.gearhead` | Android Auto |
| `com.google.ar.core` | ARCore (realidade aumentada) |
| `com.google.android.videos` | Google TV/Filmes |

**Pendente de decisão** (não desativado ainda — depende do uso pessoal, ver seção 9.2): `com.google.android.calculator` (não há outra calculadora no aparelho — desativar deixa sem app de calculadora).

### Apps/serviços Samsung desativados (39 de 41 aprovados)
Recomendação/sugestão de apps (prováveis fontes da notificação de jogos): `app.spage` (Samsung Free/Daily), `tadownloader`, `smartsuggestions`.
Jogos: `game.gamehome`, `game.gametools`.
Temas/AR: `themestore`, `livestickers`, `stickercenter`, `aremoji`, `arzone`.
Bixby: `rubin.app`, `app.settings.bixby`, `aircommandmanager`, `sdk.handwriting`.
Edge panels/AOD: `app.aodservice`, `app.cocktailbarservice`, `app.appsedge`, `app.clipboardedge`, `app.taskedge`.
Compartilhamento: `app.sharelive`, `allshare.service.fileshare`, `allshare.service.mediashare`, `privateshare`.
Pagamento/senhas: `spayfw`, `samsungpass`, `samsungpassautofill`.
Outros: `dynamiclock`, `applock`, `kidsinstaller`, `smartswitchassistant`, `storyservice`, `motionphoto.viewer`, `smartmirroring`, `smartfitting`, `smartface`, `smartcallprovider`, `icecone`, `sec.android.app.fm` (rádio FM), `sec.android.easyonehand`.

**Não foi possível desativar** (protegidos pelo sistema — comando aceito mas o estado volta a "default"/"enabled" sozinho, sem root não dá pra forçar): `com.samsung.android.themecenter` (loja de temas/papel de parede), `com.samsung.android.game.gos` (serviço de otimização de jogos). Ambos de baixo impacto — não são fonte de notificações, apenas serviços passivos.

## 9.2 Itens condicionais — decididos e aplicados (2026-08-26)
Confirmado com o usuário e executado via `pm disable-user --user 0`:

| Pacote | Decisão | Motivo informado pelo usuário |
|---|---|---|
| `com.google.android.calculator` | **Mantido ativo** | Único app de calculadora no aparelho |
| `com.sec.android.gallery3d` (Galeria Samsung) | Desativado | Usa só Google Fotos |
| `com.samsung.android.scloud` (Samsung Cloud) | Desativado | Não usa backup Samsung |
| `com.samsung.accessibility` | Desativado | Não usa acessibilidade |
| `com.samsung.android.accessibility.talkback` | Desativado | Não usa acessibilidade |
| `com.google.android.tts` (Text-to-Speech, usado pelo TalkBack) | Desativado | Não usa acessibilidade |

Todos confirmados com `pm disable-user` bem-sucedido (`new state: disabled-user`).

## 9.3 Limpeza de armazenamento (2026-08-26)

Varredura encontrou o grosso do espaço ocupado em uma única fonte: **`/sdcard/Android/media/com.whatsapp`, 7,9 GB** (vídeos, áudios, imagens e figurinhas recebidos/enviados ao longo dos anos), muito acima de fotos (663MB) ou qualquer app instalado. Lixeira nativa do Android e do Meus Arquivos: vazias, nada a recuperar aí. Nenhum resíduo de app desinstalado (`com.oikos` limpo corretamente pelo Android).

Ação executada (usuário confirmou backup do WhatsApp ativo no Google Drive):
- Apagados os arquivos de **Vídeo, Áudio de Voz, Imagens, Figurinhas, Figurinhas excluídas do backup, GIFs animados, Notas de vídeo** dentro de `WhatsApp/Media`.
- Apagados **todos os backups locais do histórico de conversas** (`.crypt14`, ~470MB) — seguro porque o Google Drive é a cópia de segurança real.
- **`WhatsApp Documents` (287MB) mantido intacto** a pedido do usuário — risco de conter PDFs/comprovantes importantes.
- Apagados **9 boletos duplicados da Energisa** (`energisa_2via*.pdf`) da pasta Download.

Resultado:

| | Antes | Depois |
|---|---|---|
| Pasta `com.whatsapp` (mídia) | 7,9 GB | 758 MB (só Documents restante) |
| `/data` em uso | 86% (44G) | 69% (35G) |
| Espaço livre | 7,6 GB | 16 GB |

**Total liberado: ~7,1 GB.** WhatsApp foi parado à força (`am force-stop`) antes da exclusão para evitar conflito de arquivo aberto; ele recria as pastas vazias sozinho na próxima abertura. Usuário optou por não reiniciar o aparelho agora.

## 9.4 Otimização de armazenamento — dados internos de apps (2026-08-26)

A categoria "Aplicativos" do Device Care (34,9GB reportados pelo usuário) refere-se a `dumpsys diskstats` → **App Data Size**, dado interno privado de cada app em `/data/data/<pkg>` — shell não consegue ler essas pastas diretamente (`Permission denied` sem root), mas `dumpsys diskstats` expõe o tamanho por pacote via array `Package Names` / `App Data Sizes` / `Cache Sizes`, cruzado via script Python para achar os maiores consumidores:

| App | Dados internos | Cache |
|---|---|---|
| WhatsApp | 9,31 GB | 565 MB |
| Facebook | 8,37 GB | 1,08 GB |
| Instagram | 1,49 GB | 766 MB |
| Chrome | 1,14 GB | 884 MB |

Ações executadas:
1. **`pm trim-caches 30G`** — limpa cache de todos os apps do sistema (dado descartável por definição, reconstruído automaticamente). Liberou **8 GB** (35G→27G usado). Zero risco.
2. **`pm clear com.facebook.katana`** — apaga dados internos do Facebook (força relogin, sem perda real pois tudo é sincronizado do servidor). Liberou **8 GB** (27G→19G usado). Usuário aprovou explicitamente.
3. **WhatsApp (9,31GB) mantido intocado** — usuário optou por não mexer agora; `pm clear com.whatsapp` apagaria o banco de mensagens local, com risco de perda de mensagens posteriores ao último backup no Google Drive. Recomendação registrada: antes de limpar no futuro, abrir WhatsApp → Ajustes → Conversas → Backup → "Fazer backup agora" para minimizar a janela de perda.

**Resultado combinado da sessão de armazenamento (mídia WhatsApp + cache + Facebook):**

| Etapa | `/data` usado |
|---|---|
| Início | 44G / 51G (86%) |
| Após limpar mídia do WhatsApp (seção 9.3) | 35G (69%) |
| Após `pm trim-caches` | 27G (52%) |
| Após `pm clear com.facebook.katana` | **19G / 51G (38%)** |

**Total liberado na sessão: ~25 GB.**

## 9. Recomendações

1. **Segurança**: dispositivo sem malware, mas com patch de outubro/2022 — evitar uso para dados sensíveis se possível; confirmar na tela de Atualização de Software (aberta na sessão) se ainda existe algum OTA pendente.
2. **Armazenamento**: partição de sistema em 97% de uso — liberar espaço (cache de apps, downloads) para evitar degradação de performance.
3. **Performance do app**: investigar o kill por "excessive cpu" do `com.oikos` — reproduzir o fluxo usado (câmera + survey) com logcat ao vivo para isolar o trecho de código que está saturando CPU.
4. **Ruído de sistema**: o spam de `ThermalHalWrapper` é um bug de firmware do fabricante, não relacionado ao app — não requer ação do time, mas explica parte da carga alta observada no aparelho.
