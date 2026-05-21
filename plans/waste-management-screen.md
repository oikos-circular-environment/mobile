# Plano: companies/waste-management.tsx — Gestão de Resíduos

## Objetivo
Conectar a tela de gestão de resíduos ao endpoint `getV1CompaniesWastes` (GET) e `putV1CompaniesWastes` (PUT upsert) via `UserCompanyContext`. A tela exibirá os resíduos já cadastrados e permitirá adicionar/remover.

## Análise do estado atual
- Form para cadastro de um único resíduo por vez
- `onSubmit` apenas faz `console.log` + monta payload local
- Não exibe lista dos resíduos existentes

## Análise do SDK (shape atualizado)

**GET `/v1/companies/wastes`** retorna:
```ts
{
  wastes: Array<{
    id, name, description, price, unit, waste_type, sub_items, created_at, updated_at
  }>
}
```
> `response.data.wastes` — array.

**PUT `/v1/companies/wastes`** — **upsert** (substitui toda a lista):
```ts
body: {
  wastes: Array<{
    name, description?, price, unit, waste_type, sub_items?
  }>
}
```
Retorna: `{ wastes: Array<{...}> }`

> **Sem POST separado** — o PUT faz upsert (substitui toda a lista de resíduos).

## Estratégia de UX (mesma do services.tsx)

1. **Lista de resíduos cadastrados** (acima do form): cards com nome, preço e unidade. Botão de remover em cada item.
2. **Formulário de novo resíduo**: o form existente. Ao submeter, **adiciona** à lista via PUT com `[...existing, newWaste]`.

### Lógica de remover
Remover = PUT com lista filtrada: `wastes.filter(w => w.id !== id)`.

## Mapeamento form ↔ API
| Campo do form | Campo da API  |
|---------------|---------------|
| `name`        | `name`        |
| `description` | `description` |
| `price`       | `price`       |
| `unit`        | `unit`        |
| `waste_type`   | `waste_type`  |
| `subItems`    | `sub_items`   |

## Mudanças necessárias

### 1. Consumir UserCompanyContext
```tsx
const { wastes, isLoadingWastes, saveWastes, isSavingWastes } = useUserCompanyContext();
```
`wastes` já é o array desembrulhado (`data.wastes`).

### 2. Adicionar lista de resíduos existentes
Acima do form (antes do Card de "Informações principais"):
```tsx
{wastes && wastes.length > 0 && (
  <Card className="shadow-none gap-3">
    <Heading size="sm">Resíduos cadastrados</Heading>
    {wastes.map(waste => (
      <View key={waste.id} className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-semibold">{waste.name}</Text>
          <Text className="text-sm text-muted-foreground">
            {waste.price} / {waste.unit}
          </Text>
        </View>
        <Pressable onPress={() => handleRemove(waste.id)}>
          <X size={18} />
        </Pressable>
      </View>
    ))}
  </Card>
)}
```

### 3. Remover resíduo
```tsx
const handleRemove = async (wasteId: string) => {
  const remaining = (wastes ?? []).filter(w => w.id !== wasteId);
  await saveWastes({
    wastes: remaining.map(w => ({
      name: w.name,
      description: w.description ?? null,
      price: w.price,
      unit: w.unit,
      waste_type: w.waste_type,
      sub_items: w.sub_items,
    })),
  });
};
```

### 4. Substituir `onSubmit`
```tsx
const onSubmit = async (data: WasteManagementFormValues) => {
  const existing = (wastes ?? []).map(w => ({
    name: w.name,
    description: w.description ?? null,
    price: w.price,
    unit: w.unit,
    waste_type: w.waste_type,
    sub_items: w.sub_items,
  }));

  await saveWastes({
    wastes: [
      ...existing,
      {
        name: data.name.trim(),
        description: data.description.trim() || null,
        price: data.price,
        unit: data.unit,
        waste_type: data.waste_type,
        sub_items: data.subItems.length > 0 ? data.subItems : null,
      },
    ],
  });

  form.reset();
};
```

### 5. Loading / disabled states
- Skeleton na lista enquanto `isLoadingWastes`
- `isDisabled={isSavingWastes}` no botão "Cadastrar resíduo"
- Desabilitar botões de remover enquanto `isSavingWastes`

## Arquivos a modificar
- `src/app/(tabs)/(home)/companies/waste-management.tsx`

## Dependências
- `UserCompanyContext` implementado
