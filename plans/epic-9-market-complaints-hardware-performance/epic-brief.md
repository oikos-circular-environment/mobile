# Epic Brief — Performance/UX em Market e Denúncias (hardware fraco)

## Resumo

Quatro bugs distintos encontrados numa investigação ao vivo (agent-device + logcat
real, emulador Android **e** um Samsung Galaxy A30/SM-A305GT físico) nas telas
"Pontos de coleta" (market) e "Denúncias" (complaints), incluindo o fluxo de criar
denúncia. Agrupados nesta branch (`fix/market-complaints-hardware-performance`,
criada a partir de `origin/development`) porque foram descobertos na mesma sessão
de investigação e todos se manifestam com mais gravidade em hardware fraco — mas
são independentes entre si e podem ser revisados como commits separados:

1. **Race condition no refresh token** deixa um toast de erro preso na tela,
   bloqueando toques na bottom tab bar.
2. **Dois `MapView` nativos** (aba Denúncias + formulário de criar denúncia)
   causam uma NullPointerException real no ciclo de vida do Google Maps SDK e não
   mostram nenhum feedback de carregamento durante o mount nativo.
3. **Race condition no `ComplaintsListBottomSheet`** — chamada imperativa de
   `snapToIndex` no mount corre contra a prontidão do componente nativo; em
   hardware lento o sheet fica invisível até o usuário selecionar uma denúncia.
4. **Imagens sem fallback visual** — inclusive o avatar do próprio usuário logado
   quebra silenciosamente quando a URL retorna 404.

Confirmado com dados reais do EAS Observe: TTI de cold start no Android tem
mediana de 3,27s (meta `<3s`), com outliers de até **13,73s no próprio
SM-A305GT** usado nesta investigação.

## Contexto & Problema

### Bug 1 — Race condition de refresh token + toast preso

Em `src/libs/api/oikos-api.ts`, `setAuthToken`/`setRefreshToken` (linhas 42-62)
chamam `saveAuthToken`/`saveRefreshToken` **sem `await`** — escrita no
SecureStore é fire-and-forget. `src/contexts/auth-context.tsx:126-127` chama
essas duas funções e, na sequência, já dispara
`Promise.all([getV1Profiles(), getV1UsersMe()])` sem esperar a escrita
assentar. Se qualquer request nessa janela recebe 401, o interceptor de
resposta (`oikos-api.ts:163-165`) ignora o valor **síncrono já disponível em
memória** (`getRefreshToken()`, linhas 64-66) e lê do SecureStore de forma
assíncrona — se a escrita ainda não completou, retorna vazio e lança
`throw new Error("No refresh token")`.

Esse erro é capturado no `onError` do `signInMutation`
(`auth-context.tsx:173`) e dispara `toast.error(...)`. Confirmado ao vivo: esse
toast específico fica preso na tela (sem auto-dismiss visível) com seu
retângulo sobrepondo a bottom tab bar — com o toast ativo, um tap na tab
"Denúncias" não navegou; após fechar o toast manualmente, o mesmo tap
funcionou em 1,8s. Mecanismo exato do posicionamento (por que aparece embaixo
ao invés de `placement="top"` como configurado) ainda não confirmado — provável
candidato é o `PortalProvider` compartilhado do gluestack, entre o toast e os
bottom sheets da tela de Denúncias.

### Bug 2 — Dois `MapView`, NullPointerException nativa, zero feedback

3 instâncias de `MapView` (react-native-maps) no projeto:
`src/app/(tabs)/complaints/index.tsx:338-391` (único com `onMapReady`, usado só
para animação/câmera, nunca para skeleton), `src/components/wrapper-map.tsx:149-165`
(formulário de criar denúncia, sem `onMapReady`), e
`src/components/complaints/complaint-map.tsx:38-51` (telas de detalhe, sem
`onMapReady`). Nenhuma mostra skeleton durante o mount nativo do mapa.

Ao navegar de Denúncias → Criar Denúncia, o logcat registrou uma
NullPointerException nativa real (capturada, não fatal) durante
`MapView.doDestroy()` do mapa da aba sendo desmontado
(`DeferredLifecycleHelper.onPause` → `LinkedList.isEmpty()` em objeto nulo) —
evidência de que a janela de sobreposição entre desmontar um `MapView` e
montar outro em sequência rápida quebra o ciclo de vida nativo do SDK do
Google Maps.

**Confirmado em hardware físico (SM-A305GT)**: a mesma transição gerou ~17s de
instabilidade sustentada — 3 blocos de frame-drop (148, 48 e 79 frames
pulados) intercalados com GCs de até 1,033s, muito mais grave que no emulador
x86.

### Bug 3 — Race condition no `ComplaintsListBottomSheet`

`src/components/complaints/complaints-list-bottom-sheet/index.tsx:24-30`:

```tsx
useEffect(() => {
    if (selectedMapComplaint) {
        ref.current?.snapToIndex(0);
    } else {
        ref.current?.snapToIndex(1);
    }
}, [selectedMapComplaint]);
```

O sheet monta com `index={0}` (15%) e esse efeito, no mount (já que
`selectedMapComplaint` começa `null`), deveria chamar `snapToIndex(1)` para
expandir a 42% imediatamente. É uma chamada **imperativa** via `ref.current`,
que depende do `BottomSheet`/Reanimated já estarem prontos internamente.

**Confirmado em hardware físico**: durante a mesma janela de jank pesado do
Bug 2 (frame-drops + GC de mais de 1s), essa chamada de mount muito
provavelmente disparou antes do ref estar pronto — vira um no-op silencioso, e
o sheet fica preso na posição pequena inicial (efetivamente invisível atrás da
tab bar). Ao tocar numa denúncia no mapa, `selectedMapComplaint` muda,
reexecuta o efeito — dessa vez com o app já assentado — e `snapToIndex(0)`
funciona, fazendo o sheet "aparecer". Reproduzido e observado ao vivo pelo
usuário no device físico.

### Bug 4 — Imagens sem fallback (inclusive avatar do usuário)

`Avatar`/`AvatarImage` (`src/components/ui/avatar/index.tsx`) já usa
`expo-image` e o `AvatarImage` do gluestack já trata erro internamente — para
de renderizar a imagem sem quebrar, mas **não sobra nada visível no lugar**: o
wrapper do projeto nunca expôs `AvatarFallbackText` (`createAvatar` mapeia
`FallbackText: View` mas só `{ Avatar, AvatarImage }` é exportado).

Duas libs de imagem coexistem: RN `Image` nativo (Glide) em 5 arquivos
(`market/index.tsx`, `market/[companyId].tsx`, `resolution-card.tsx`,
`company-picker-bottom-sheet.tsx`, `resolution.tsx`) vs. `expo-image` no resto
do app. Só `src/components/medias-preview/media-thumbnail.tsx` trata erro
(`onLoad`/`onError` + placeholder) — é o modelo de referência.

Confirmado ao vivo: até o avatar do próprio usuário logado retornou 404 do
backend local e ficou em branco, sem nenhum indicador.

## Objetivo / Resultado esperado

- Login não deixa mais nenhum toast de erro preso sobre a bottom tab bar; taps
  nas tabs funcionam imediatamente após o login.
- Telas com `MapView` mostram skeleton durante o mount nativo do mapa; a NPE de
  ciclo de vida do Google Maps deixa de aparecer (ou reduz drasticamente de
  frequência) na transição Denúncias → Criar Denúncia.
- `ComplaintsListBottomSheet` aparece de forma confiável no mount, independente
  da velocidade do hardware.
- Nenhuma imagem quebrada aparece em branco — avatar do usuário e demais
  avatares mostram um fallback visual quando a URL falha.

## Fora de escopo

- Retry do CameraX ao inicializar a câmera (~5,6s) — considerado comportamento
  específico de emulador, decisão explícita do usuário.
- Destruição completa da Activity (`ReactHost.onHostDestroy`) observada uma
  vez durante a investigação — não foi possível reproduzir de forma confiável
  (um ciclo limpo de background→foreground de 12s não reproduziu). Fica como
  observação lateral, não vira ticket.
- Investigar a causa dos 404 de imagem em si — é dado de seed/storage do
  backend, fora do escopo do mobile.
- Escolha de ferramenta de crash reporting (Epic 3, ainda em aberto) — sem ela,
  não é possível cruzar a NPE do Bug 2 com stack traces de produção; esta epic
  trabalha só com o que foi observado ao vivo nesta investigação.

## Impacto

- **Usuário**: login sem travar a navegação, telas de mapa com feedback visual
  em vez de parecer travadas, lista de denúncias sempre visível, sem espaços
  em branco no lugar de avatares/fotos quebradas.
- **Performance**: reduz jank nas transições mais citadas pelo usuário
  (Denúncias, Criar Denúncia), especialmente em hardware fraco — o mesmo perfil
  documentado em `docs/device-analysis-samsung-sm-a305gt.md` e corroborado
  pelos outliers de TTI do EAS Observe no SM-A305GT.
