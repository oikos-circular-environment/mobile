# Plano: companies/services.tsx — Serviços

## Objetivo
Conectar a tela de serviços ao endpoint `getV1CompaniesServices` (GET) e `putV1CompaniesServices` (PUT upsert) via `UserCompanyContext`. A tela exibirá os serviços já cadastrados e permitirá adicionar/remover.

## Análise do estado atual
- Form para cadastro de um único serviço por vez
- `onSubmit` apenas faz `console.log` + monta payload local
- Não exibe lista dos serviços existentes

## Análise do SDK (shape atualizado)

**GET `/v1/companies/services`** retorna:
```ts
{
  services: Array<{
    id, name, description, price, unit, waste_type,
    sub_items, quantity, observations, created_at, updated_at
  }>
}
```
> `response.data.services` — array.

**PUT `/v1/companies/services`** — **upsert** (substitui toda a lista):
```ts
body: {
  services: Array<{
    name, description?, price, unit, waste_type, sub_items?, quantity, observations?
  }>
}
```
Retorna: `{ services: Array<{...}> }`

> **Sem POST separado** — o PUT faz upsert (substitui toda a lista de serviços).

## Estratégia de UX

A tela terá **duas seções**:

1. **Lista de serviços cadastrados** (acima do form): cards com nome, unidade e preço. Botão de remover em cada item.
2. **Formulário de novo serviço**: o form existente. Ao submeter, **adiciona** o novo serviço à lista existente via PUT com `[...existing, newService]`.

### Lógica de remover
Remover = PUT com lista filtrada: `services.filter(s => s.id !== id)`.

## Mapeamento form ↔ API
| Campo do form    | Campo da API   |
|------------------|----------------|
| `name`           | `name`         |
| `description`    | `description`  |
| `price`          | `price`        |
| `quantity`       | `quantity`     |
| `unit`           | `unit`         |
| `wasteType`      | `waste_type`   |
| `subItems`       | `sub_items`    |
| `observations`   | `observations` |

## Mudanças necessárias

### 1. Consumir UserCompanyContext
```tsx
const { services, isLoadingServices, saveServices, isSavingServices } = useUserCompanyContext();
```
`services` já é o array desembrulhado (`data.services`).

### 2. Adicionar lista de serviços existentes
Acima do form (antes do Card de "Informações principais"):
```tsx
{services && services.length > 0 && (
  <Card className="shadow-none gap-3">
    <Heading size="sm">Serviços cadastrados</Heading>
    {services.map(service => (
      <View key={service.id} className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-semibold">{service.name}</Text>
          <Text className="text-sm text-muted-foreground">
            {service.price} / {service.unit}
          </Text>
        </View>
        <Pressable onPress={() => handleRemove(service.id)}>
          <X size={18} />
        </Pressable>
      </View>
    ))}
  </Card>
)}
```

### 3. Remover serviço
```tsx
const handleRemove = async (serviceId: string) => {
  const remaining = (services ?? []).filter(s => s.id !== serviceId);
  await saveServices({
    services: remaining.map(s => ({
      name: s.name,
      description: s.description ?? null,
      price: s.price,
      quantity: s.quantity,
      unit: s.unit,
      waste_type: s.waste_type,
      sub_items: s.sub_items,
      observations: s.observations ?? null,
    })),
  });
};
```

### 4. Substituir `onSubmit`
```tsx
const onSubmit = async (data: ServiceFormValues) => {
  const existing = (services ?? []).map(s => ({
    name: s.name,
    description: s.description ?? null,
    price: s.price,
    quantity: s.quantity,
    unit: s.unit,
    waste_type: s.waste_type,
    sub_items: s.sub_items,
    observations: s.observations ?? null,
  }));

  await saveServices({
    services: [
      ...existing,
      {
        name: data.name.trim(),
        description: data.description.trim() || null,
        price: data.price,
        quantity: data.quantity,
        unit: data.unit,
        waste_type: data.wasteType,
        sub_items: data.subItems.length > 0 ? data.subItems : null,
        observations: data.observations.trim() || null,
      },
    ],
  });

  form.reset();
};
```

### 5. Loading / disabled states
- Skeleton na lista enquanto `isLoadingServices`
- `isDisabled={isSavingServices}` no botão "Cadastrar serviço"
- Desabilitar botões de remover enquanto `isSavingServices`

## Arquivos a modificar
- `src/app/(tabs)/(home)/companies/services.tsx`

## Dependências
- `UserCompanyContext` implementado
