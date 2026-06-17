# Refactor: Centralizar estado de denúncia selecionada no Zustand

## Problema

`selectedComplaint` vive como estado local em `useComplaintsMap`, forçando 7 props no
`ComplaintBottomSheet` e 5+ params de rota desnecessários em `resolution.tsx`.

## Arquivos envolvidos

- `src/stores/complaints-store.ts`
- `src/components/complaints/hooks/use-complaints-map.ts`
- `src/components/complaints/complaint-bottom-sheet.tsx`
- `src/app/(tabs)/complaints/index.tsx`
- `src/app/(tabs)/complaints/resolution.tsx`

## Passos

### 1. Store — adicionar slice `mapSelection`

Adicionar ao `complaints-store.ts`:

```typescript
type MapSelectionState = {
  selectedMapComplaint: MapComplaint | null;
};
type MapSelectionActions = {
  setSelectedMapComplaint: (c: MapComplaint | null) => void;
  patchSelectedMapComplaintVoteCounts: (delta: {
    previousVote: VoteType | null;
    nextVote: VoteType | null;
  }) => void;
};
```

Também adicionar slice `resolutionDraft` para edição:

```typescript
type ResolutionDraftState = {
  resolutionDraft: {
    description: string;
    companyJson?: string;
    attachmentsJson?: string;
  } | null;
};
type ResolutionDraftActions = {
  setResolutionDraft: (draft: ResolutionDraftState["resolutionDraft"]) => void;
  clearResolutionDraft: () => void;
};
```

### 2. `useComplaintsMap` — remover estado local de seleção e voto

- Remover `useState<MapComplaint | null>` local
- Ler/gravar via `setSelectedMapComplaint` / `selectedMapComplaint` da store
- `handleVote` usa `selectedMapComplaint` da store e chama `patchSelectedMapComplaintVoteCounts`
- Retornar apenas `{ complaints, isLoadingMap }` — o resto é consumido diretamente da store

### 3. `ComplaintBottomSheet` — remover todos os props

Props removidos: `isOpen`, `onClose`, `complaint`, `currentVote`, `onVote`,
`isPendingVote`, `userLocation`.

O componente passa a:
- Ler `selectedMapComplaint` da store (isOpen = `!!selectedMapComplaint`)
- Fechar com `setSelectedMapComplaint(null)`
- Votar via `useComplaintVote` (novo hook pequeno, ou lógica inline)
- Ler `userLocation` de `useGeospatial()`
- Ao navegar para resolução em modo edição, gravar `resolutionDraft` na store

### 4. `index.tsx` — limpar

- Remover destructuring de `currentVote`, `handleVote`, `isPendingVote`, `setSelectedComplaint`
- Usar `setSelectedMapComplaint` da store diretamente no `onPress` do marker
- `<ComplaintBottomSheet />` sem props

### 5. `resolution.tsx` — ler da store em vez de params

- Ler `type`, `status`, `address`, `date` de `selectedMapComplaint` da store
- Params de rota ficam: `id` (obrigatório) — apenas para confirmar qual denúncia
- Modo edição: ler `resolutionDraft` da store em vez de `resolutionCompanyJson` / `resolutionAttachmentsJson`
- Ao montar, limpar `resolutionDraft` da store após usar

## Resultado esperado

| Antes | Depois |
|---|---|
| 7 props em `ComplaintBottomSheet` | 0 props |
| 5+ params de rota em `resolution.tsx` | 1 param (`id`) |
| `selectedComplaint` em estado local do hook | na store, acessível por qualquer componente |
| `userLocation` reroteado via prop | consumido diretamente do contexto |
