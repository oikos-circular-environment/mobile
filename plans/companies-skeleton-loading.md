# Plano: Skeleton Loading — Companies

## Objetivo
Substituir todos os `ActivityIndicator` das telas de companies por componentes de skeleton loading, centralizados em `src/components/companies/skeletons/`.

## Levantamento dos estados de loading

| Tela               | Tipo de loading        | Variável               |
|--------------------|------------------------|------------------------|
| `company.tsx`      | Full-page (guard)      | `isLoadingCompany`     |
| `address.tsx`      | Full-page (guard)      | `isLoadingAddress`     |
| `business-hours.tsx` | Full-page (guard)    | `isLoadingBusinessHours` |
| `services.tsx`     | Inline (lista)         | `isLoadingServices`    |
| `waste-management.tsx` | Inline (lista)     | `isLoadingWastes`      |

## Componente base disponível
`src/components/ui/skeleton/index.tsx` — `Skeleton` + `SkeletonText`
- `Skeleton`: bloco retangular pulsante (`animate-pulse`, `bg-accent-foreground`)
- `SkeletonText`: linha(s) de texto (`_lines` prop, `bg-accent`)

## Componentes a criar

### `src/components/companies/skeletons/`

#### `field-skeleton.tsx` (primitivo reutilizável)
Label (h-4, w-1/3) + Input (h-10, w-full) — padrão repetido em todos os forms.

#### `company-form-skeleton.tsx`
Espelha `company.tsx`:
- Card com gap-3
- 6× FieldSkeleton (CNPJ, Razão Social, Nome Fantasia, Email, Telefone, Data)
- Button (h-10, mt-4)

#### `address-form-skeleton.tsx`
Espelha `address.tsx`:
- Heading (h-7, w-1/2)
- FieldSkeleton (CEP)
- Row: FieldSkeleton flex-1 (Rua) + FieldSkeleton w-20 (Número)
- FieldSkeleton (Complemento)
- FieldSkeleton (Bairro)
- FieldSkeleton (Cidade)
- Row: FieldSkeleton flex-1 (Estado) + FieldSkeleton w-16 (Sigla)
- Mapa: h-48 rounded-md
- Row: Button flex-1 (Cancelar) + Button flex-1 (Confirmar)

#### `business-hours-skeleton.tsx`
Espelha `business-hours.tsx`:
- Heading (h-7, w-1/2)
- 7× DaySkeleton: toggle (h-6 w-11 rounded-full) + label (h-5 flex-1) + time placeholders (h-9 w-20 × 2)

#### `services-list-skeleton.tsx` (inline)
Espelha a section de serviços cadastrados:
- Card com gap-3
- Heading (h-5, w-2/5)
- 3× ItemSkeleton: nome (h-4 flex-1) + preço (h-4 w-16) + ícone (h-4 w-4)

#### `waste-list-skeleton.tsx` (inline)
Mesmo padrão de `services-list-skeleton.tsx`.

#### `index.ts`
Barrel export de todos os skeletons.

## Screens a atualizar

| Arquivo                  | Mudança                                                               |
|--------------------------|-----------------------------------------------------------------------|
| `company.tsx`            | Guard `if (isLoadingCompany)` → `<CompanyFormSkeleton />`            |
| `address.tsx`            | Guard `if (isLoadingAddress)` → `<AddressFormSkeleton />`            |
| `business-hours.tsx`     | Guard `if (isLoadingBusinessHours)` → `<BusinessHoursSkeleton />`    |
| `services.tsx`           | Inline `isLoadingServices` → `<ServicesListSkeleton />`              |
| `waste-management.tsx`   | Inline `isLoadingWastes` → `<WasteListSkeleton />`                   |

## Critérios de implementação
- Usar exclusivamente `Skeleton`/`SkeletonText` do Gluestack (`@/components/ui/skeleton`)
- Styling via `className` (NativeWind) — sem estilos inline
- Nenhum ActivityIndicator deve restar nas telas de companies
- Os full-page skeletons devem usar as mesmas classes de container (`flex-1 bg-white`) das telas reais
- Os inline skeletons são componentes puros (sem props) que simplesmente rendem o placeholder
