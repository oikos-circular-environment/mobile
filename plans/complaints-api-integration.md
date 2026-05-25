# Plano: Integração de Denúncias com a API

## Mapeamento de endpoints utilizados

| Ação | Função SDK | Endpoint |
|---|---|---|
| Criar denúncia (dados) | `postV1Complaints` | `POST /v1/complaints` |
| Fazer upload da mídia | `postV1ComplaintsAttachments` | `POST /v1/complaints/attachments` (multipart) |
| Listar denúncias | `getV1Complaints` | `GET /v1/complaints` |
| Dashboard | `getV1ComplaintsDashboard` | `GET /v1/complaints/dashboard` |
| Detalhe | `getV1ComplaintsById` | `GET /v1/complaints/{id}` |
| Marcar resolvida | `patchV1ComplaintsByIdResolved` | `PATCH /v1/complaints/{id}/resolved` |
| Cancelar | `patchV1ComplaintsByIdCanceled` | `PATCH /v1/complaints/{id}/canceled` |

---

## Diferenças API x tipos locais a resolver

### Status
- **API (`complaint.status`)**: `"OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED" | "CANCELED"`
- **API (`dashboard`)**: `{ total, open, pending, resolved, canceled, rejected }` — `pending` é o equivalente a `IN_PROGRESS`
- **Local atual**: `"pending" | "resolved" | "canceled"` — incompleto
- **Ação**: substituir `ComplaintStatus` pelos valores da API (uppercase) e atualizar `ComplaintStatusComponent`

### Type (tipo da denúncia)
- **API**: `"IRREGULAR_DISPOSAL"` (UPPERCASE)
- **Local atual**: `"irregular_disposal"` (lowercase)
- **Ação**: ajustar `ComplaintType` para uppercase e atualizar `complaintTypeValues`, `reviewSchema`, `camera.tsx`

### Criação em dois passos
1. `postV1Complaints` → cria registro com geospatial, retorna `{ id }`
2. `postV1ComplaintsAttachments` → envia arquivo (multipart) vinculado ao `complaint_id`
- Cada captura do contexto gera um par independente de chamadas

---

## Etapas de implementação

### Etapa 1 — Alinhar tipos locais com a API
**Arquivo**: `src/libs/types/complaint.ts`

- `ComplaintType`: trocar para uppercase (`"IRREGULAR_DISPOSAL"` etc.)
- `ComplaintStatus`: substituir pelos valores da API: `"OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED" | "CANCELED"`
- Atualizar `complaintTypeValues` (os `value` viram uppercase)
- Atualizar `reviewSchema` em `review.tsx` com os novos valores uppercase

**Arquivo**: `src/components/complaints/complaint-status.tsx`
- Adicionar cases para `"OPEN"`, `"IN_PROGRESS"`, `"REJECTED"`

---

### Etapa 2 — Submissão real na tela de revisão
**Arquivo**: `src/app/(tabs)/complaints/(create)/review.tsx`

Substituir o `onSubmit` mock pela sequência real:

```
para cada captura em captures:
  1. postV1Complaints({ date, type, observations, geospatial })
     → obter complaint.id
  2. se captura.capture.object?.uri existir:
     postV1ComplaintsAttachments(FormData com complaint_id + arquivo)
```

- Usar `useMutation` do TanStack Query para cada passo
- Botão "Confirmar" desabilitado com loading durante a submissão
- Erro: exibir toast de erro (gluestack `Toast`), não navegar
- Sucesso: `clearDraft()` + `invalidateQueries(COMPLAINTS_QUERY_KEY)` + `invalidateQueries(DASHBOARD_QUERY_KEY)` + navegar para lista

---

### Etapa 3 — ComplaintsContext
**Arquivo novo**: `src/contexts/complaints-context.tsx`

```ts
type ComplaintsContextValue = {
  complaints: ApiComplaint[]
  dashboard: DashboardData | undefined
  activeFilter: ComplaintStatus | null   // null = todos
  setActiveFilter: (status: ComplaintStatus | null) => void
  filteredComplaints: ApiComplaint[]
  isLoadingComplaints: boolean
  isLoadingDashboard: boolean
  refetchAll: () => void
}
```

- `useQuery(COMPLAINTS_QUERY_KEY, getV1Complaints)` — lista completa
- `useQuery(DASHBOARD_QUERY_KEY, getV1ComplaintsDashboard)` — painel
- `filteredComplaints`: derivado via `useMemo` de `complaints` + `activeFilter`
- `activeFilter` gerenciado como estado local no contexto
- Provider envolvendo o layout de `complaints/_layout.tsx`
- Query keys exportados como constante para reuso em invalidações

---

### Etapa 4 — Expandir ComplaintPainel + filtros
**Arquivo**: `src/components/complaints/complaint-painel.tsx`

- Receber `dashboard` e `activeFilter` / `setActiveFilter` via props (ou consumir `ComplaintsContext` diretamente)
- Exibir todos os **6 cards**: Total, Aberta, Em andamento, Resolvida, Cancelada, Rejeitada
- Card "Total" limpa o filtro (`setActiveFilter(null)`)
- Cada card de status chama `setActiveFilter(status)` ao ser pressionado
- Card ativo recebe destaque visual (borda `lime-800` ou fundo levemente colorido)
- Card "Total" fica sempre em linha própria (largura 100%) ou em posição de destaque
- Exibir `Skeleton` enquanto `isLoadingDashboard`

Mapeamento dashboard → status:
| Campo dashboard | Status da API |
|---|---|
| `open` | `"OPEN"` |
| `pending` | `"IN_PROGRESS"` |
| `resolved` | `"RESOLVED"` |
| `canceled` | `"CANCELED"` |
| `rejected` | `"REJECTED"` |

---

### Etapa 5 — ComplaintCardContext
**Arquivo novo**: `src/contexts/complaint-card-context.tsx`

```ts
type ComplaintCardContextValue = {
  complaint: ApiComplaint
  isResolvingComplaint: boolean
  isCancelingComplaint: boolean
  resolveComplaint: () => void
  cancelComplaint: () => void
  openInMaps: () => void
}
```

- Provider recebe `complaint` como prop
- `useMutation` para resolver → `patchV1ComplaintsByIdResolved({ path: { id } })`
  - `onSuccess`: invalidar queries + toast de sucesso
  - `onError`: toast de erro
- `useMutation` para cancelar → `patchV1ComplaintsByIdCanceled({ path: { id } })`
  - `onSuccess`: invalidar queries + toast de sucesso
  - `onError`: toast de erro
- `openInMaps`:
  - **iOS**: `ActionSheetIOS.showActionSheetWithOptions` com opções: Google Maps, Waze, Apple Maps, Abrir no navegador
  - **Android**: `geo:` URI (OS abre o chooser nativo automaticamente)
  - Fallback: Google Maps Web (`https://www.google.com/maps/search/?api=1&query=lat,lng`)

---

### Etapa 6 — Atualizar ComplaintCard
**Arquivo**: `src/components/complaints/complaint-card.tsx`

- Envolver com `ComplaintCardContext.Provider` no map do `index.tsx`
- Consumir mutations reais em vez de `Alert.alert` estáticos
- Exibir `ActivityIndicator` no MenuItem enquanto mutação estiver ativa (`isResolvingComplaint` / `isCancelingComplaint`)
- Mostrar `attachment.url` como thumbnail no card quando houver mídia
- Atualizar `ComplaintStatusComponent` para todos os status da API

---

### Etapa 7 — Atualizar index.tsx (tela de listagem)
**Arquivo**: `src/app/(tabs)/complaints/index.tsx`

- Remover mock data (`complaintPainelValues`, array `complaint[]`)
- Consumir `ComplaintsContext`: `filteredComplaints`, `isLoadingComplaints`, `dashboard`, `isLoadingDashboard`
- Renderizar `filteredComplaints` no lugar do array mock
- Exibir skeletons de card enquanto `isLoadingComplaints`
- `useFocusEffect` para `refetchAll` ao voltar do modal de criação

---

## Ordem de execução recomendada

```
1 → 2 → 3 → 4 → 7 → 5 → 6
```

- **1** desbloqueia tipagem em todos os arquivos
- **2** entrega criação real antes de se preocupar com listagem
- **3** monta a infraestrutura de dados e filtro
- **4** expande o painel e conecta os filtros
- **7** conecta a lista real com filtros aplicados
- **5 + 6** adicionam as ações por card (resolve, cancela, mapa) com toast
