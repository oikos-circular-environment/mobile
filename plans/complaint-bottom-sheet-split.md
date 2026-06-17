# Refactor: Dividir complaint-bottom-sheet em diretório com componentes separados

## Objetivo
Transformar o arquivo único `complaint-bottom-sheet.tsx` em um diretório
`complaint-bottom-sheet/` com cada sub-componente e utilitário em seu próprio arquivo.

## Componentes identificados no arquivo atual

| Componente/Utilitário | Arquivo de destino |
|---|---|
| `haversineKm`, `formatDistance`, `getAddress`, tipo `Attachment` | `utils.ts` |
| `AttachmentPreview` + `AttachmentPreviewProps` | `attachment-preview.tsx` |
| `ResolutionCardSkeleton` | `resolution-card-skeleton.tsx` |
| `SwipeEditAction` | `swipe-edit-action.tsx` |
| `SwipeDeleteAction` | `swipe-delete-action.tsx` |
| `ComplaintBottomSheet` (componente principal) | `index.tsx` |

## Estrutura final

```
src/components/complaints/complaint-bottom-sheet/
├── index.tsx
├── attachment-preview.tsx
├── resolution-card-skeleton.tsx
├── swipe-edit-action.tsx
├── swipe-delete-action.tsx
└── utils.ts
```

## Impacto nos importadores

`index.tsx` ficará em `complaint-bottom-sheet/index.tsx`, então o import em
`src/app/(tabs)/complaints/index.tsx` continua funcionando sem alteração:
`@/components/complaints/complaint-bottom-sheet` resolve para o `index.tsx` do diretório.

O arquivo `complaint-bottom-sheet.tsx` atual será deletado após a criação do diretório.
