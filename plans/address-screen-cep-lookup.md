# Plano: CEP lookup — companies/address.tsx

## Objetivo
Implementar a pesquisa automática de CEP no formulário de endereço da empresa,
espelhando o padrão de `profile.tsx`.

## Mapeamento AddressV2 → schema

| Campo da API (`AddressV2`)              | Campo do form     | Obs                                       |
|-----------------------------------------|-------------------|-------------------------------------------|
| `cep`                                   | `zip_code`        | `mask.cep(data.cep)`                      |
| `street`                                | `street`          | pode ser `null`                           |
| `neighborhood`                          | `district`        | pode ser `null`                           |
| `city`                                  | `city`            |                                           |
| `state` (sigla, ex: "SP")               | `state_code`      | valor direto da API                       |
| via `listIbgeUfs` → `state.nome`        | `state`           | busca assíncrona pelo sigla               |
| `location.coordinates.latitude` (str)  | `latitude`        | `parseFloat` — pode ser `null`            |
| `location.coordinates.longitude` (str) | `longitude`       | `parseFloat` — pode ser `null`            |

## Mudanças

### Imports a adicionar
- `useMutation` — `@tanstack/react-query`
- `getCepV2`, `listIbgeUfs` — `@/libs/brasil-api-sdk`
- `toast` — `@/components/toast`
- `Spinner` — `@/components/ui/spinner` (já presente)

### `getCepMutation`
```ts
const getCepMutation = useMutation({
  mutationKey: ["get", "cep", "brasil-api"],
  mutationFn: async ({ cep }: { cep: string }) => {
    const response = await getCepV2({ path: { cep } });
    return response.data;
  },
  onSuccess: data => {
    if (!data) return;
    reset(
      {
        ...control._formValues,
        zip_code: mask.cep(data.cep),
        street: data.street ?? control._formValues.street,
        district: data.neighborhood ?? control._formValues.district,
        city: data.city,
        state_code: data.state,
        latitude: data.location.coordinates.latitude
          ? parseFloat(data.location.coordinates.latitude)
          : control._formValues.latitude,
        longitude: data.location.coordinates.longitude
          ? parseFloat(data.location.coordinates.longitude)
          : control._formValues.longitude,
      },
      { keepDefaultValues: true },
    );
    if (data.state) {
      listIbgeUfs().then(res => {
        const uf = res.data?.find(s => s.sigla === data.state);
        if (uf) setValue("state", uf.nome);
      });
    }
  },
  onError: () =>
    toast.error("CEP não encontrado", "Verifique o número e tente novamente."),
});
```

### Handler de pressão
```ts
const onPressSearchCep = () => {
  const digits = (control._formValues.zip_code as string).replace(/\D/g, "");
  if (digits.length !== 8) {
    toast.error("CEP inválido", "O CEP deve conter 8 dígitos.");
    return;
  }
  getCepMutation.mutate({ cep: digits });
};
```

### InputSlot do campo zip_code
```tsx
<InputSlot className="pr-3" onPress={onPressSearchCep}>
  <InputIcon as={getCepMutation.isPending ? Spinner : Search} />
</InputSlot>
```

## Arquivo a modificar
- `src/app/(tabs)/(home)/companies/address.tsx`
