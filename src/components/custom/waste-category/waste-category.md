# WasteCategory — Skill

Sistema de seleção de categorias de resíduo. Compound component baseado em TVA + StyleContext, seguindo o padrão Gluestack. Todos os sub-componentes **devem** estar dentro de `<WasteCategory>` — o root é um Context Provider que expõe categorias, estado de seleção e callbacks.

---

## Importação

```tsx
import {
  WasteCategory,
  WasteCategorySkeleton,
  WasteCategoryChips,
  WasteCategoryChip,
  WasteCategoryChipText,
  WasteCategoryContent,
  WasteCategoryDescription,
  WasteCategoryCaption,
  WasteCategoryHazardLevel,
  WasteCategoryHazardLevelIcon,
  WasteCategoryHazardLevelText,
  WasteCategorySubcategoryCard,
  type WasteCategoryProps,
  type HazardLevelVariant,
} from "@/components/custom/waste-category";
```

---

## Regra 1: WasteCategory é obrigatório como raiz

Todos os sub-componentes lêem do contexto. Usar qualquer deles fora de `<WasteCategory>` lança um erro em runtime.

### Correto

```tsx
<WasteCategory defaultCategoryId="cat-123" onSelectionChange={cat => setValue("waste_category_id", cat.id)}>
  <ScrollView horizontal>
    <WasteCategoryChips>
      {category => (
        <WasteCategoryChip key={category.id} category={category}>
          <WasteCategoryChipText>{category.name}</WasteCategoryChipText>
        </WasteCategoryChip>
      )}
    </WasteCategoryChips>
  </ScrollView>
  <WasteCategoryContent />
</WasteCategory>
```

### Incorreto

```tsx
// ❌ Sub-componente fora do provider — lança erro em runtime
<WasteCategoryContent />

// ❌ Contexto não existe aqui
<WasteCategoryChips>
  {category => <WasteCategoryChip category={category} />}
</WasteCategoryChips>
```

---

## Regra 2: Modo de seleção — discriminated union

`WasteCategory` tem dois modos com tipos distintos. O TypeScript enforça o tipo correto de `onSelectionChange`.

| Prop | Modo `"single"` (padrão) | Modo `"multiple"` |
|---|---|---|
| `selectionMode` | omitido ou `"single"` | `"multiple"` (obrigatório) |
| `defaultCategoryId` | `string` (opcional) | — |
| `defaultCategoryIds` | — | `string[]` (opcional) |
| `onSelectionChange` | `(cat: WasteCategory) => void` | `(cats: WasteCategory[]) => void` |

### Correto — single (formulários de resíduo/serviço)

```tsx
<WasteCategory
  defaultCategoryId={initialData?.waste_category_id}
  onSelectionChange={cat =>
    setValue("waste_category_id", cat.id, { shouldValidate: true })
  }
>
  {/* chips e content */}
</WasteCategory>
```

### Correto — multiple (formulário de denúncia)

```tsx
<WasteCategory
  selectionMode="multiple"
  defaultCategoryIds={editingComplaint?.categories.map(c => c.id)}
  onSelectionChange={cats => setSelectedCategoryIds(cats.map(c => c.id))}
>
  {/* chips */}
</WasteCategory>
```

### Incorreto

```tsx
// ❌ Passar defaultCategoryIds sem selectionMode="multiple"
<WasteCategory defaultCategoryIds={["id-1", "id-2"]}>
  {/* o TypeScript vai reclamar — defaultCategoryIds não existe no tipo single */}
</WasteCategory>

// ❌ Callback errado para o modo
<WasteCategory
  selectionMode="multiple"
  onSelectionChange={(cat: WasteCategory) => setValue("id", cat.id)}
  // ^ O callback recebe WasteCategory[], não WasteCategory
>
</WasteCategory>
```

---

## Regra 3: WasteCategoryChips usa render-prop — nunca tem layout próprio

`WasteCategoryChips` itera as categorias do contexto e chama `children` para cada uma. Layout (ScrollView, FlatList, flex-wrap) é responsabilidade do caller.

### Correto

```tsx
// Horizontal scrollável
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-0.5">
  <WasteCategoryChips>
    {category => (
      <WasteCategoryChip key={category.id} category={category}>
        <WasteCategoryChipText>{category.name}</WasteCategoryChipText>
      </WasteCategoryChip>
    )}
  </WasteCategoryChips>
</ScrollView>

// Chips com wrap (grid)
<View className="flex-row flex-wrap gap-2">
  <WasteCategoryChips>
    {category => (
      <WasteCategoryChip key={category.id} category={category}>
        <WasteCategoryChipText>{category.name}</WasteCategoryChipText>
      </WasteCategoryChip>
    )}
  </WasteCategoryChips>
</View>

// Chip com hazard level dentro
<WasteCategoryChips>
  {category => (
    <WasteCategoryChip key={category.id} category={category}>
      <WasteCategoryChipText>{category.name}</WasteCategoryChipText>
      {category.hazard_levels.map(hazard => (
        <WasteCategoryHazardLevel
          key={hazard}
          variant={hazard.toLowerCase() as HazardLevelVariant}
        >
          <WasteCategoryHazardLevelIcon />
        </WasteCategoryHazardLevel>
      ))}
    </WasteCategoryChip>
  )}
</WasteCategoryChips>
```

### Incorreto

```tsx
// ❌ WasteCategoryChips sem children como função
<WasteCategoryChips />

// ❌ Chamar children com children estáticos — WasteCategoryChips não aceita ReactNode
<WasteCategoryChips>
  <WasteCategoryChip category={someCategory} />
</WasteCategoryChips>

// ❌ Esquecer o key no chip renderizado — React vai reclamar
<WasteCategoryChips>
  {category => (
    <WasteCategoryChip category={category}> {/* ❌ falta key */}
      <WasteCategoryChipText>{category.name}</WasteCategoryChipText>
    </WasteCategoryChip>
  )}
</WasteCategoryChips>
```

---

## Regra 4: WasteCategoryChip exige prop `category`

O chip lê o estado de seleção do contexto comparando `category.id`. Sem `category`, não há como determinar se está selecionado.

`WasteCategoryChipText` lê o estado (`"selected" | "unselected"`) do StyleContext do chip-pai — deve estar **dentro** de `WasteCategoryChip`.

### Correto

```tsx
<WasteCategoryChip key={category.id} category={category}>
  <WasteCategoryChipText>{category.name}</WasteCategoryChipText>
</WasteCategoryChip>
```

### Incorreto

```tsx
// ❌ WasteCategoryChip sem category
<WasteCategoryChip key={category.id}>
  <WasteCategoryChipText>{category.name}</WasteCategoryChipText>
</WasteCategoryChip>

// ❌ WasteCategoryChipText fora do WasteCategoryChip — useStyleContext retorna undefined
<WasteCategoryChip key={category.id} category={category} />
<WasteCategoryChipText>{category.name}</WasteCategoryChipText>

// ❌ Aplicar estilo de seleção manualmente — o StyleContext já faz isso
<WasteCategoryChip key={category.id} category={category} className="bg-lime-800">
  <WasteCategoryChipText className="text-white">{category.name}</WasteCategoryChipText>
</WasteCategoryChip>
```

---

## Regra 5: WasteCategoryHazardLevel — variant obrigatório, children opcionais

Por padrão renderiza `<WasteCategoryHazardLevelIcon /> + <WasteCategoryHazardLevelText />`. Passe `children` para customizar.

`WasteCategoryHazardLevelIcon` aceita a prop `as` para trocar o ícone mantendo as classes de cor do variant.

### Variantes e cores

| variant | Fundo | Borda | Texto/Ícone | Ícone padrão | Label padrão |
|---|---|---|---|---|---|
| `"low"` | `bg-lime-50` | `border-lime-200` | `text-lime-600` | `ChevronDownIcon` | "Baixa" |
| `"medium"` | `bg-yellow-50` | `border-yellow-200` | `text-yellow-600` | `MinusIcon` | "Média" |
| `"high"` | `bg-orange-50` | `border-orange-200` | `text-orange-600` | `ChevronUpIcon` | "Alta" |
| `"very_high"` | `bg-red-50` | `border-red-200` | `text-red-600` | `ChevronsUpIcon` | "Muito alta" |

### Correto

```tsx
// Uso mínimo — renderiza ícone + label padrão do variant
<WasteCategoryHazardLevel variant="high" />

// Só ícone (sem label)
<WasteCategoryHazardLevel variant="low">
  <WasteCategoryHazardLevelIcon />
</WasteCategoryHazardLevel>

// Ícone customizado mantendo cores do variant
<WasteCategoryHazardLevel variant="very_high">
  <WasteCategoryHazardLevelIcon as={SkullIcon} />
  <WasteCategoryHazardLevelText />
</WasteCategoryHazardLevel>

// Label customizado
<WasteCategoryHazardLevel variant="medium">
  <WasteCategoryHazardLevelIcon />
  <WasteCategoryHazardLevelText>Atenção</WasteCategoryHazardLevelText>
</WasteCategoryHazardLevel>

// Mapeando de hazard_levels da API
{category.hazard_levels.map(hazard => (
  <WasteCategoryHazardLevel
    key={hazard}
    variant={hazard.toLowerCase() as HazardLevelVariant}
  />
))}
```

### Incorreto

```tsx
// ❌ WasteCategoryHazardLevel sem variant
<WasteCategoryHazardLevel />

// ❌ Passar string livre sem cast — TypeScript não aceita
<WasteCategoryHazardLevel variant={hazard_level} />
// correto: variant={hazard_level.toLowerCase() as HazardLevelVariant}

// ❌ WasteCategoryHazardLevelIcon ou Text fora do WasteCategoryHazardLevel
// useStyleContext retorna undefined e as classes de cor não funcionam
<WasteCategoryHazardLevelIcon />
<WasteCategoryHazardLevelText />

// ❌ Hardcode de cor no ícone — o StyleContext já aplica a cor do variant
<WasteCategoryHazardLevel variant="high">
  <WasteCategoryHazardLevelIcon className="text-orange-600" />
</WasteCategoryHazardLevel>
```

---

## Regra 6: WasteCategoryContent é para modo single

`WasteCategoryContent` exibe grau de periculosidade, descrição, observações e subcategorias da categoria **selecionada**. Em modo `"multiple"` o campo `selectedWasteCategory` reflete a última categoria tocada, o que pode confundir o usuário. Use-o apenas em modo `"single"`.

### Correto

```tsx
// Formulário de resíduo/serviço (single)
<WasteCategory defaultCategoryId={initialData?.waste_category_id} onSelectionChange={...}>
  <ScrollView horizontal contentContainerClassName="gap-2 py-0.5">
    <WasteCategoryChips>
      {category => (
        <WasteCategoryChip key={category.id} category={category}>
          <WasteCategoryChipText>{category.name}</WasteCategoryChipText>
        </WasteCategoryChip>
      )}
    </WasteCategoryChips>
  </ScrollView>
  <WasteCategoryContent />
</WasteCategory>
```

### Incorreto

```tsx
// ❌ WasteCategoryContent em modo multiple — comportamento impreciso
<WasteCategory selectionMode="multiple" onSelectionChange={...}>
  <WasteCategoryChips>{...}</WasteCategoryChips>
  <WasteCategoryContent /> {/* mostra dados da última categoria tocada */}
</WasteCategory>
```

---

## Referência de componentes

| Componente | Props obrigatórias | Props opcionais | Precisa estar dentro de |
|---|---|---|---|
| `WasteCategory` | — | `selectionMode`, `defaultCategoryId`, `defaultCategoryIds`, `onSelectionChange` | — |
| `WasteCategorySkeleton` | — | — | — (independente) |
| `WasteCategoryChips` | `children: (cat) => ReactNode` | — | `WasteCategory` |
| `WasteCategoryChip` | `category` | `className`, demais `PressableProps` | `WasteCategory` |
| `WasteCategoryChipText` | — | `className`, demais `TextProps` | `WasteCategoryChip` |
| `WasteCategoryContent` | — | — | `WasteCategory` |
| `WasteCategoryDescription` | — | — | `WasteCategory` |
| `WasteCategoryCaption` | — | — | — (independente) |
| `WasteCategoryHazardLevel` | `variant` | `className`, `children` | — (independente) |
| `WasteCategoryHazardLevelIcon` | — | `as`, `size`, `className` | `WasteCategoryHazardLevel` |
| `WasteCategoryHazardLevelText` | — | `className`, `children` | `WasteCategoryHazardLevel` |
| `WasteCategorySubcategoryCard` | `subItem` | — | — (independente) |

---

## Padrões de uso por contexto

### Formulário com seleção única (waste/form, services/form)

```tsx
<WasteCategory
  defaultCategoryId={initialData?.waste_category_id}
  onSelectionChange={cat =>
    setValue("waste_category_id", cat.id, { shouldValidate: true, shouldDirty: true })
  }
>
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerClassName="gap-2 py-0.5"
  >
    <WasteCategoryChips>
      {category => (
        <WasteCategoryChip key={category.id} category={category}>
          <WasteCategoryChipText>{category.name}</WasteCategoryChipText>
        </WasteCategoryChip>
      )}
    </WasteCategoryChips>
  </ScrollView>
  <WasteCategoryContent />
</WasteCategory>
```

### Formulário com seleção múltipla (complaints/(create))

```tsx
<WasteCategory
  selectionMode="multiple"
  defaultCategoryIds={editingComplaint?.categories.map(c => c.id)}
  onSelectionChange={cats => setSelectedCategoryIds(cats.map(c => c.id))}
>
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerClassName="gap-2 py-0.5"
  >
    <WasteCategoryChips>
      {category => (
        <WasteCategoryChip key={category.id} category={category}>
          <WasteCategoryChipText>{category.name}</WasteCategoryChipText>
          {category.hazard_levels.map(hazard => (
            <WasteCategoryHazardLevel
              key={hazard}
              variant={hazard.toLowerCase() as HazardLevelVariant}
            >
              <WasteCategoryHazardLevelIcon />
            </WasteCategoryHazardLevel>
          ))}
        </WasteCategoryChip>
      )}
    </WasteCategoryChips>
  </ScrollView>
</WasteCategory>
```

### Badge de periculosidade isolado (listas, cards)

```tsx
// Não precisa de WasteCategory — WasteCategoryHazardLevel é independente
{item.waste_category.hazard_levels.map(hazard_level => (
  <WasteCategoryHazardLevel
    key={`${item.id}-${hazard_level}`}
    variant={hazard_level.toLowerCase() as HazardLevelVariant}
  />
))}
```

---

## Arquitetura interna

```
WasteCategory (Context Provider)
│  Lê dados: useWasteCategories() → React Query
│  Estado: selectedCategory, selectedCategories
│  Expõe: categories, selectionMode, selectedWasteCategory,
│          selectedWasteCategories, onSelect
│
├── WasteCategoryChips (render-prop mapper)
│   └── children(category) → caller define o JSX
│       └── WasteCategoryChip (TVA + withStyleContext CHIP_SCOPE)
│           ├── Lê: WasteCategoryContext (selectionMode, seleção, onSelect)
│           ├── Expõe: state="selected"|"unselected" via StyleContext
│           └── WasteCategoryChipText (TVA, parentVariants via CHIP_SCOPE)
│
├── WasteCategoryContent (lê selectedWasteCategory)
│   ├── WasteCategoryHazardLevel (independente, TVA + withStyleContext HAZARD_SCOPE)
│   │   ├── WasteCategoryHazardLevelIcon (parentVariants via HAZARD_SCOPE, prop `as`)
│   │   └── WasteCategoryHazardLevelText (parentVariants via HAZARD_SCOPE)
│   ├── WasteCategorySubcategoryCard
│   └── WasteCategoryCaption
│
└── WasteCategoryDescription (lê selectedWasteCategory)
```

**Fonte de dados**: `src/components/companies/hooks/use-waste-categories.ts`
**Tipos**: `src/libs/types/waste-category.ts`
