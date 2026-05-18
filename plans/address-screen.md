# Plano: companies/address.tsx — Endereço da Empresa

## Objetivo
Conectar o formulário de endereço ao endpoint `getV1CompaniesAddresses` (GET) e `putV1CompaniesAddresses` (PUT upsert) via `UserCompanyContext`.

## Análise do estado atual
- Formulário completo com `react-hook-form` + `zod`
- `address` é um estado local `useState<Partial<Address>>` com campos em branco
- `onSubmit` apenas faz `console.log`

## Análise do SDK (shape atualizado)

**GET `/v1/companies/addresses`** retorna:
```ts
{ address: { id, zip_code, street, number, complement, district,
  city_ibge_id, city, state_ibge_id, state, state_code,
  latitude, longitude, created_at, updated_at } | null }
```
> `response.data.address` — pode ser `null` se endereço ainda não cadastrado.

**PUT `/v1/companies/addresses`** — agora é **upsert** (cria OU atualiza):
```ts
body: {
  zip_code: string;      // OBRIGATÓRIO
  street: string;        // OBRIGATÓRIO
  number: string;        // OBRIGATÓRIO
  complement?: string | null;
  district: string;      // OBRIGATÓRIO
  city_ibge_id: number;  // OBRIGATÓRIO
  city: string;          // OBRIGATÓRIO
  state_ibge_id: number; // OBRIGATÓRIO
  state: string;         // OBRIGATÓRIO
  state_code: string;    // OBRIGATÓRIO
  latitude?: number | null;
  longitude?: number | null;
}
```
Retorna: `{ address: {...} }`

> **Sem POST separado** — `postV1CompaniesAddresses` foi removido. O PUT faz upsert.

## Nota sobre city_ibge_id / state_ibge_id
O SDK exige `city_ibge_id` e `state_ibge_id` (number), mas o formulário atual não os inclui. 
Estratégia: enviar `0` como placeholder até que uma integração com API de CEP (ViaCEP ou similar) seja implementada para preencher esses IDs automaticamente.

## Mapeamento form ↔ API
| Campo do form | Campo da API    | Notas                         |
|---------------|-----------------|-------------------------------|
| `zip_code`    | `zip_code`      |                               |
| `street`      | `street`        |                               |
| `number`      | `number`        |                               |
| `complement`  | `complement`    |                               |
| `district`    | `district`      |                               |
| `city`        | `city`          |                               |
| `state`       | `state`         |                               |
| `state_code`  | `state_code`    |                               |
| `latitude`    | `latitude`      |                               |
| `longitude`   | `longitude`     |                               |
| _(ausente)_   | `city_ibge_id`  | enviar `0` como placeholder   |
| _(ausente)_   | `state_ibge_id` | enviar `0` como placeholder   |

## Mudanças necessárias

### 1. Consumir UserCompanyContext
```tsx
const { address, isLoadingAddress, saveAddress, isSavingAddress } = useUserCompanyContext();
```
`address` já é o objeto desembrulhado (`data.address`) — o contexto faz a extração.

### 2. Remover `useState` local de `address`
Substituir pelo dado vindo do contexto.

### 3. Atualizar `defaultValues` (useMemo)
```tsx
const defaultValues = useMemo<AddressFormValues>(() => ({
  zip_code: address?.zip_code ?? "",
  street: address?.street ?? "",
  number: address?.number ?? "",
  complement: address?.complement ?? null,
  district: address?.district ?? "",
  city: address?.city ?? "",
  state: address?.state ?? "",
  state_code: address?.state_code ?? "",
  latitude: address?.latitude ?? null,
  longitude: address?.longitude ?? null,
}), [address]);
```

### 4. Substituir `onSubmit`
```tsx
const onSubmit = async (data: AddressFormValues) => {
  await saveAddress({
    zip_code: data.zip_code,
    street: data.street,
    number: data.number,
    complement: data.complement ?? null,
    district: data.district,
    city: data.city,
    state: data.state,
    state_code: data.state_code,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    city_ibge_id: 0,
    state_ibge_id: 0,
  });
};
```
> Sempre chama PUT (upsert) — o backend cria ou atualiza.

### 5. Loading / disabled states
- Skeleton ou spinner enquanto `isLoadingAddress`
- `isDisabled={isSavingAddress}` no botão Confirmar
- `isDisabled={isSavingAddress}` no botão Cancelar também

## Arquivos a modificar
- `src/app/(tabs)/(home)/companies/address.tsx`

## Dependências
- `UserCompanyContext` implementado
