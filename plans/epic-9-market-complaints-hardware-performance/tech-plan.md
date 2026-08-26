# Tech Plan — Epic 9: Performance/UX em Market e Denúncias

## Abordagem arquitetural

Cada bug é corrigido na camada onde a causa raiz vive, sem introduzir
abstração nova além do estritamente necessário:

- Bug 1 é uma correção de sequenciamento assíncrono (await + fallback em
  memória) na camada de auth/API — não mexe em UI.
- Bug 2 e Bug 3 compartilham o mesmo padrão de causa: uma **API imperativa
  (ref) chamada antes do componente nativo estar pronto**, agravado por
  contenção pesada de main-thread em hardware fraco. A correção segue o mesmo
  princípio nos dois casos: expor um sinal declarativo de prontidão
  (`onMapReady`, ou gate por foco de tela) em vez de assumir que a chamada
  imperativa sempre "pega" no primeiro disparo.
- Bug 4 reaproveita a infraestrutura de fallback que o próprio gluestack já
  oferece (`AvatarFallbackText`), só nunca foi ligada no wrapper do projeto.

### Por que `refreshToken ?? await getStoredRefreshToken()` resolve o Bug 1

O valor em memória (`refreshToken`, `oikos-api.ts:31`) é atualizado
sincronamente por `setRefreshToken` antes mesmo da escrita assíncrona no
SecureStore completar. Preferir esse valor no interceptor 401 remove a
dependência da latência do SecureStore para o caso comum (token acabou de ser
setado). Tornar `setAuthToken`/`setRefreshToken` `async` e aguardar no
`signInMutation` fecha a janela na origem; o fallback em memória no
interceptor é defesa em profundidade para qualquer outro caminho que dispare
401 antes da escrita assentar.

### Por que `onMapReady` + skeleton resolve a falta de feedback (Bug 2)

`react-native-maps` expõe `onMapReady` como o único sinal confiável de que a
instância nativa terminou de inicializar — é exatamente o que
`complaints/index.tsx` já usa para lógica de câmera/animação, só nunca foi
usado para controlar um skeleton visual. Replicar esse padrão em
`WrapperMap`/`ComplaintMap` não introduz mecanismo novo, só estende o já
validado.

### Por que atrasar o mount do `WrapperMap` é uma mitigação (não correção) da NPE

A exceção acontece dentro do SDK nativo do Google Maps
(`DeferredLifecycleHelper.onPause`), fora do controle do código do app.
Reduzir a janela de sobreposição entre o `doDestroy()` do mapa anterior e o
mount do próximo (via `useIsFocused` + `InteractionManager.runAfterInteractions`)
diminui a chance de corrida, mas não elimina a causa — por isso o ticket exige
validação observacional (repetir a navegação e comparar frequência no
logcat), não uma alegação de "resolvido".

### Por que a mesma lógica de gate resolve o Bug 3

O `ComplaintsListBottomSheet` tem o mesmo formato de bug do Bug 2: uma chamada
imperativa (`ref.current?.snapToIndex(...)`) disparada dentro de um
`useEffect` de mount, sem nenhuma garantia de que o `BottomSheet` já
terminou sua própria inicialização interna (Reanimated worklets, medidas de
layout). A correção não precisa de um mecanismo novo — só evitar o disparo
prematuro guardando o efeito atrás de uma condição de prontidão (ex.: só
chamar `snapToIndex` depois que o `BottomSheet` sinalizar `onChange`/`onLayout`
pela primeira vez, ou usar o `animateOnMount` declarativo do próprio
`@gorhom/bottom-sheet` em vez do disparo imperativo no mount).

### Por que `AvatarFallbackText` resolve o Bug 4 sem reescrever nada

O gluestack já implementa o padrão fallback-quando-erro dentro do
`AvatarImage` — a lacuna é puramente de exportação/estilização no wrapper do
projeto (`src/components/ui/avatar/index.tsx`). Expor e estilizar esse
subcomponente (ícone genérico, seguindo o padrão já usado em
`company-card.tsx:23-32`) resolve o caso mais visível (avatar do usuário) sem
tocar em nenhuma lógica de rede/cache. Migrar os 5 usos de `Image` nativo do
RN para `Avatar`/`AvatarImage` resolve o fallback E a duplicação de lib de
imagem (Glide legado + expo-image) ao mesmo tempo, em vez de reimplementar
`onError` manualmente em cada arquivo.

## Modelo de dados / assinaturas

```ts
// oikos-api.ts — antes (fire-and-forget)
export function setAuthToken(token: string | null) {
	authToken = token;
	if (token) saveAuthToken(token); else removeAuthToken();
}

// depois (async, aguardável)
export async function setAuthToken(token: string | null) {
	authToken = token;
	if (token) await saveAuthToken(token); else await removeAuthToken();
}
```

```ts
// interceptor 401 — antes
const storedRefreshToken = await getStoredRefreshToken();

// depois — prefere o valor em memória
const storedRefreshToken = refreshToken ?? (await getStoredRefreshToken());
```

```tsx
// padrão de skeleton de mapa, replicado em WrapperMap / ComplaintMap /
// complaints/index.tsx
const [isMapReady, setIsMapReady] = useState(false);
// ...
<MapView onMapReady={() => setIsMapReady(true)} ... />
{!isMapReady && <MapSkeleton className="..." />}
```

## Arquitetura de componentes / arquivos

**Bug 1**
- `src/libs/api/oikos-api.ts` — `setAuthToken`, `setRefreshToken`, interceptor
  401 (linha 164).
- `src/contexts/auth-context.tsx` — `signInMutation.mutationFn` (linhas
  126-127); demais call sites (266-267, 312-313) passam a usar as versões
  async sem mudança de lógica.
- `src/components/toast.tsx` — só se o diagnóstico ao vivo confirmar que o
  posicionamento ainda falha após a correção da race condition.

**Bug 2**
- `src/components/ui/map-skeleton.tsx` (novo) — segue o padrão de
  `src/components/companies/company-card-skeleton.tsx`.
- `src/components/complaints/complaint-map.tsx` — `onMapReady` + overlay.
- `src/components/wrapper-map.tsx` — `onMapReady` + overlay, compondo com o
  branch existente de `isResolvingLocation` (linha 140).
- `src/app/(tabs)/complaints/index.tsx` — usar o `isMapReady` já existente
  (linha 192) para o overlay.
- `src/app/(tabs)/complaints/(create)/index.tsx` — `useIsFocused` +
  `InteractionManager.runAfterInteractions` para atrasar o mount do
  `WrapperMap` (linha 527-531).

**Bug 3**
- `src/components/complaints/complaints-list-bottom-sheet/index.tsx` —
  `useEffect` de mount (linhas 24-30).

**Bug 4**
- `src/components/ui/avatar/index.tsx` — expor/estilizar fallback.
- `src/app/(tabs)/market/index.tsx`, `src/app/(tabs)/market/[companyId].tsx`,
  `src/components/complaints/complaint-bottom-sheet/resolution-card.tsx`,
  `src/components/complaints/company-picker-bottom-sheet.tsx`,
  `src/app/(tabs)/complaints/resolution.tsx` — migrar de `Image` (RN) para
  `Avatar`/`AvatarImage`.

## Riscos / atenção

- **Bug 1**: mudar a assinatura de `setAuthToken`/`setRefreshToken` para
  `async` exige checar todos os call sites (`grep -rn "setAuthToken\|setRefreshToken" src/`)
  antes de mudar — o interceptor de refresh (`oikos-api.ts:176-181`) já faz
  `await Promise.all([saveAuthToken, saveRefreshToken])` diretamente, pode
  passar a chamar as novas versões async em vez de duplicar.
- **Bug 2**: `onMapReady` dispara na instância nativa pronta, não nos tiles
  renderizados — skeleton pode sumir um pouco antes do mapa parecer 100%
  carregado; aceitável, mesmo comportamento que a lógica de animação já
  assume. Atrasar o mount do `WrapperMap` pode adicionar latência perceptível
  ao abrir "Criar Denúncia" — o skeleton deve mitigar a sensação.
- **Bug 3**: qualquer correção precisa ser validada especificamente em
  hardware fraco (o bug não se manifesta no emulador rápido) — usar o
  SM-A305GT físico já configurado para validar.
- **Bug 4**: migrar de Glide (RN Image) para expo-image pode mudar
  comportamento de cache — validar visualmente que não há
  flicker/recarregamento excessivo nas listas. Maior superfície dos 4 bugs —
  dividir em commits menores.

## Validação

- `npx tsc --noEmit` e `npm run lint` limpos após cada ticket.
- `npm test` — suítes de auth e dos componentes tocados.
- Reprodução ao vivo via `agent-device`, tanto no emulador quanto no
  SM-A305GT físico (sessão `a30` já configurada): login → Denúncias → Criar
  Denúncia, conferindo logcat a cada passo, comparando com os números já
  coletados nesta investigação (frame-drops, GC pauses, presença/ausência da
  NPE).
