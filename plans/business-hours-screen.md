# Plano: companies/business-hours.tsx — Horários de Funcionamento

## Objetivo
Conectar o formulário de horários ao endpoint `getV1CompaniesBusinessHours` (GET) e `putV1CompaniesBusinessHours` (PUT upsert) via `UserCompanyContext`.

## Análise do estado atual
- Form com `react-hook-form` usando `businessHoursFormSchema`
- `defaultValues` fixo em `{ businessHours: defaultBusinessHours }` (mock local)
- `useEffect` reseta para `defaultBusinessHours` na montagem
- `onSubmit` apenas faz `console.log`

## Análise do SDK (shape atualizado)

**GET `/v1/companies/business-hours`** retorna:
```ts
{
  business_hours: Array<{
    id: string;
    day_of_week: "SUNDAY" | "MONDAY" | ... | "SATURDAY";
    is_open: boolean;
    time_slots: Array<{ id: string; start_time: string; end_time: string }>;
  }>
}
```
> `response.data.business_hours` — array (pode ser vazio se não configurado).

**PUT `/v1/companies/business-hours`** — agora é **upsert**:
```ts
body: {
  business_hours: Array<{
    day_of_week: "SUNDAY" | ... | "SATURDAY";
    is_open: boolean;
    time_slots: Array<{ start_time: string; end_time: string }>;
  }>
}
```
Retorna: `{ business_hours: Array<{...}> }`

> **Sem POST separado** — `postV1CompaniesBusinessHours` foi removido.

## Mapeamento form ↔ API
| Campo do form              | Campo da API              |
|----------------------------|---------------------------|
| `dayOfWeek`                | `day_of_week`             |
| `isOpen`                   | `is_open`                 |
| `timeSlots[].startTime`    | `time_slots[].start_time` |
| `timeSlots[].endTime`      | `time_slots[].end_time`   |

> Verificar os tipos exatos de `BusinessHoursFormValues` em `business-hours-form-schema.ts` antes de implementar.

## Mudanças necessárias

### 1. Consumir UserCompanyContext
```tsx
const { businessHours, isLoadingBusinessHours, saveBusinessHours, isSavingBusinessHours } = useUserCompanyContext();
```
`businessHours` já é o array desembrulhado (`data.business_hours`).

### 2. Popular form com dados da API
Substituir o `useEffect` de reset:
```tsx
useEffect(() => {
  if (businessHours && businessHours.length > 0) {
    reset({
      businessHours: businessHours.map(bh => ({
        id: bh.id,
        dayOfWeek: bh.day_of_week,
        isOpen: bh.is_open,
        timeSlots: bh.time_slots.map(ts => ({
          startTime: ts.start_time,
          endTime: ts.end_time,
        })),
      })),
    });
  } else {
    reset({ businessHours: defaultBusinessHours });
  }
}, [businessHours, reset]);
```

### 3. Substituir `onSubmit`
```tsx
const onSubmit = async (data: BusinessHoursFormValues) => {
  await saveBusinessHours({
    business_hours: data.businessHours.map(bh => ({
      day_of_week: bh.dayOfWeek as DayOfWeek,
      is_open: bh.isOpen,
      time_slots: bh.timeSlots.map(ts => ({
        start_time: ts.startTime,
        end_time: ts.endTime,
      })),
    })),
  });
};
```
> Sempre chama PUT (upsert).

### 4. Loading / disabled states
- Skeleton ou spinner enquanto `isLoadingBusinessHours`
- `isDisabled={isSavingBusinessHours}` no botão Salvar

## Arquivos a modificar
- `src/app/(tabs)/(home)/companies/business-hours.tsx`

## Dependências
- `UserCompanyContext` implementado
- Verificar `src/components/companies/business-hours/business-hours-form-schema.ts` para tipos exatos
