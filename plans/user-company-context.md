# Plano: UserCompanyContext

## Objetivo
Criar `src/contexts/user-company-context.tsx` para centralizar toda a lógica de dados da empresa do usuário autenticado, expondo queries TanStack Query e mutations para cada recurso.

## Análise dos endpoints (SDK atualizado)

| Recurso         | GET                           | Upsert (PUT)                        | Criar empresa (POST)       |
|-----------------|-------------------------------|-------------------------------------|----------------------------|
| Empresa         | `getV1Companies`              | `putV1Companies`                    | `postV1Companies`          |
| Endereço        | `getV1CompaniesAddresses`     | `putV1CompaniesAddresses` (upsert)  | —                          |
| Horários        | `getV1CompaniesBusinessHours` | `putV1CompaniesBusinessHours` (upsert) | —                       |
| Serviços        | `getV1CompaniesServices`      | `putV1CompaniesServices` (upsert)   | —                          |
| Resíduos        | `getV1CompaniesWastes`        | `putV1CompaniesWastes` (upsert)     | —                          |

> **Importante:** `postV1CompaniesAddresses`, `postV1CompaniesBusinessHours`, `postV1CompaniesServices` e `postV1CompaniesWastes` foram **removidos do SDK**. Os PUT agora são upsert — criam se não existem, atualizam se existem.
>
> Exceção: `postV1Companies` ainda existe (criar empresa pela primeira vez). A lógica de POST vs PUT permanece apenas para a empresa.
>
> Métodos financeiros: **sem endpoint no SDK** — mantido como dado local.

## Shapes de resposta (após mudança no SDK)

Todos os responses agora envolvem os dados em um objeto:

| Endpoint                        | Acesso aos dados           |
|---------------------------------|----------------------------|
| `getV1Companies`                | `response.data.company`    |
| `postV1Companies`               | `response.data.company`    |
| `putV1Companies`                | `response.data.company`    |
| `getV1CompaniesAddresses`       | `response.data.address`    |
| `putV1CompaniesAddresses`       | `response.data.address`    |
| `getV1CompaniesBusinessHours`   | `response.data.business_hours` |
| `putV1CompaniesBusinessHours`   | `response.data.business_hours` |
| `getV1CompaniesWastes`          | `response.data.wastes`     |
| `putV1CompaniesWastes`          | `response.data.wastes`     |
| `getV1CompaniesServices`        | `response.data.services`   |
| `putV1CompaniesServices`        | `response.data.services`   |

## Estrutura do contexto

### Queries (TanStack Query)
```ts
queryKey: ['company']                   → getV1Companies         → data.company
queryKey: ['company', 'address']        → getV1CompaniesAddresses → data.address
queryKey: ['company', 'business-hours'] → getV1CompaniesBusinessHours → data.business_hours
queryKey: ['company', 'services']       → getV1CompaniesServices  → data.services
queryKey: ['company', 'wastes']         → getV1CompaniesWastes    → data.wastes
```

### Mutations

**Empresa** (único recurso com POST/PUT distinto):
- `saveCompany(payload)` → POST se `company === null`, PUT se já existe

**Endereço, Horários, Serviços, Resíduos** (upsert direto):
- `saveAddress(payload)` → sempre `putV1CompaniesAddresses`
- `saveBusinessHours(payload)` → sempre `putV1CompaniesBusinessHours`
- `saveServices(payload)` → sempre `putV1CompaniesServices`
- `saveWastes(payload)` → sempre `putV1CompaniesWastes`

Após cada mutation de sucesso: `queryClient.invalidateQueries` na chave correspondente.

### Computed: `completionRate`
```
company?.company !== null  → 20%
address?.address !== null  → 20%
businessHours?.business_hours?.length > 0 → 20%
services?.services?.length > 0 → 20%
wastes?.wastes?.length > 0     → 20%
```
Total: 0–100 (inteiro).

## Interface pública do contexto

```ts
type UserCompanyContextValue = {
  // Empresa
  company: CompanyShape | null | undefined;       // extraído de data.company
  isLoadingCompany: boolean;
  saveCompany: (data: CompanyFormPayload) => Promise<void>;
  isSavingCompany: boolean;

  // Endereço
  address: AddressShape | null | undefined;       // extraído de data.address
  isLoadingAddress: boolean;
  saveAddress: (data: AddressFormPayload) => Promise<void>;
  isSavingAddress: boolean;

  // Horários
  businessHours: BusinessHourShape[] | undefined; // extraído de data.business_hours
  isLoadingBusinessHours: boolean;
  saveBusinessHours: (payload: BusinessHoursPayload) => Promise<void>;
  isSavingBusinessHours: boolean;

  // Serviços
  services: ServiceShape[] | undefined;           // extraído de data.services
  isLoadingServices: boolean;
  saveServices: (payload: ServicesPayload) => Promise<void>;
  isSavingServices: boolean;

  // Resíduos
  wastes: WasteShape[] | undefined;               // extraído de data.wastes
  isLoadingWastes: boolean;
  saveWastes: (payload: WastesPayload) => Promise<void>;
  isSavingWastes: boolean;

  // Progresso
  completionRate: number; // 0–100
};
```

> Os shapes são inferidos diretamente dos tipos do SDK (NonNullable de cada response).

## Passos de implementação

1. Criar `src/contexts/user-company-context.tsx`
2. Implementar as 5 `useQuery` com extração do campo correto de cada response (`data.company`, `data.address`, etc.)
3. Implementar mutations: POST/PUT seletivo para empresa; PUT puro para demais
4. Computar `completionRate` com `useMemo`
5. Exportar `UserCompanyProvider` e `useUserCompanyContext`
6. Adicionar `UserCompanyProvider` no `src/app/(tabs)/(home)/companies/_layout.tsx` envolvendo o `<Stack>`

## Arquivos a criar
- `src/contexts/user-company-context.tsx`

## Arquivos a modificar
- `src/app/(tabs)/(home)/companies/_layout.tsx` — envolver `<Stack>` com `<UserCompanyProvider>`
