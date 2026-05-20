# Plano: companies/company.tsx — Informações Cadastrais

## Objetivo
Conectar o formulário de informações gerais da empresa aos endpoints `getV1Companies` (GET), `postV1Companies` (POST) e `putV1Companies` (PUT) via `UserCompanyContext`.

## Análise do estado atual
- Formulário completo com `react-hook-form` + `zod`
- `defaultValues` todos em branco (sem carga de dados reais)
- `handleFormSubmit` apenas faz `console.log`
- Campos: `identity`, `corporate_name`, `business_name`, `email`, `phones`, `started_activity_in`, `company_type`, `identity_type`, `status`, `isHeadquarters`, `accept_appointments`

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
| `identity_type`       | `identity_type`         |
| `corporate_name`      | `corporate_name`        |
| `business_name`       | `business_name`         |
| `email`              | `email`                 |
| `phones`             | `phones` (array)        |
| `started_activity_in`  | `started_activity_in`   |
| `company_type`        | `company_type`          |
| `status`             | `status`                |
| `isHeadquarters`     | `is_headquarters`       |
| `accept_appointments` | `accept_appointments`   |

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
      corporate_name: company.corporate_name,
      business_name: company.business_name ?? "",
      email: company.email ?? "",
      phones: company.phones ?? [""],
      started_activity_in: new Date(company.started_activity_in),
      company_type: company.company_type,
      identity_type: company.identity_type,
      status: company.status,
      isHeadquarters: company.is_headquarters,
      accept_appointments: company.accept_appointments,
    });
  }
}, [company, reset]);
```

### 3. Substituir `handleFormSubmit`
```tsx
const handleFormSubmit: SubmitHandler<CompanyFormData> = async (data) => {
  await saveCompany({
    identity: data.identity,
    identity_type: data.identity_type,
    corporate_name: data.corporate_name,
    business_name: data.business_name || null,
    email: data.email || null,
    phones: data.phones ?? [],
    started_activity_in: data.started_activity_in,
    company_type: data.company_type,
    status: data.status,
    is_headquarters: data.isHeadquarters,
    accept_appointments: data.accept_appointments,
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
