# Plano: companies/company.tsx — Informações Cadastrais

## Objetivo
Conectar o formulário de informações gerais da empresa aos endpoints `getV1Companies` (GET), `postV1Companies` (POST) e `putV1Companies` (PUT) via `UserCompanyContext`.

## Análise do estado atual
- Formulário completo com `react-hook-form` + `zod`
- `defaultValues` todos em branco (sem carga de dados reais)
- `handleFormSubmit` apenas faz `console.log`
- Campos: `identity`, `corporateName`, `businessName`, `email`, `phones`, `startedActivityIn`, `companyType`, `identityType`, `status`, `isHeadquarters`, `acceptAppointments`

## Análise do SDK (shape atualizado)

**GET `/v1/companies`** retorna:
```ts
{ company: { id, user_id, identity, identity_type, company_type, status, is_headquarters,
  business_name, corporate_name, accept_appointments, email, phones,
  started_activity_in, created_at, updated_at } | null }
```
> `response.data.company` — pode ser `null` se empresa ainda não criada.

**POST `/v1/companies`** body (campos obrigatórios e opcionais):
```ts
{ identity, identity_type, company_type, status?, is_headquarters?,
  business_name?, corporate_name, accept_appointments?, email?, phones, started_activity_in }
```
Retorna: `{ company: {...} }`

**PUT `/v1/companies`** body (todos opcionais):
```ts
{ identity?, identity_type?, company_type?, status?, is_headquarters?,
  business_name?, corporate_name?, accept_appointments?, email?, phones?, started_activity_in? }
```
Retorna: `{ company: {...} | null }`

## Mapeamento form ↔ API
| Campo do form        | Campo da API            |
|----------------------|-------------------------|
| `identity`           | `identity`              |
| `identityType`       | `identity_type`         |
| `corporateName`      | `corporate_name`        |
| `businessName`       | `business_name`         |
| `email`              | `email`                 |
| `phones`             | `phones` (array)        |
| `startedActivityIn`  | `started_activity_in`   |
| `companyType`        | `company_type`          |
| `status`             | `status`                |
| `isHeadquarters`     | `is_headquarters`       |
| `acceptAppointments` | `accept_appointments`   |

## Mudanças necessárias

### 1. Consumir UserCompanyContext
```tsx
const { company, isLoadingCompany, saveCompany, isSavingCompany } = useUserCompanyContext();
```
`company` já é o objeto desembrulhado (`data.company`) — o contexto faz a extração.

### 2. Popular defaultValues quando company carrega
Usar `useEffect` + `reset` do react-hook-form:
```tsx
useEffect(() => {
  if (company) {
    reset({
      identity: company.identity,
      corporateName: company.corporate_name,
      businessName: company.business_name ?? "",
      email: company.email ?? "",
      phones: company.phones ?? [""],
      startedActivityIn: new Date(company.started_activity_in),
      companyType: company.company_type,
      identityType: company.identity_type,
      status: company.status,
      isHeadquarters: company.is_headquarters,
      acceptAppointments: company.accept_appointments,
    });
  }
}, [company, reset]);
```

### 3. Substituir `handleFormSubmit`
```tsx
const handleFormSubmit: SubmitHandler<CompanyFormData> = async (data) => {
  await saveCompany({
    identity: data.identity,
    identity_type: data.identityType,
    corporate_name: data.corporateName,
    business_name: data.businessName || null,
    email: data.email || null,
    phones: data.phones ?? [],
    started_activity_in: data.startedActivityIn,
    company_type: data.companyType,
    status: data.status,
    is_headquarters: data.isHeadquarters,
    accept_appointments: data.acceptAppointments,
  });
};
```
> `saveCompany` no contexto decide internamente se chama POST (company === null) ou PUT (company existe).

### 4. Loading / disabled states
- Mostrar skeleton ou `ActivityIndicator` enquanto `isLoadingCompany === true`
- `isDisabled={isSavingCompany}` no botão Salvar

### 5. Feedback ao usuário
- `toast.success` / `toast.error` tratados nas mutations do contexto

## Arquivos a modificar
- `src/app/(tabs)/(home)/companies/company.tsx`

## Dependências
- `UserCompanyContext` implementado
- `toast` de `@/components/toast`
