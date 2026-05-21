# Plano: Selects de Estado/Cidade + IBGE IDs — companies/address.tsx

## Objetivo
Replicar o padrão de `profile.tsx`: substituir os inputs de texto de estado e cidade
por `Select` com dados do IBGE, corrigir `city_ibge_id`/`state_ibge_id` que estão
hardcoded como `0`, e integrar esses IDs ao `saveAddress`.

## Mudanças no schema
Adicionar:
```ts
state_ibge_id: z.number().min(1, "Selecione um estado."),
city_ibge_id: z.number().min(1, "Selecione uma cidade."),
```

## Mudanças nos defaultValues (useMemo)
```ts
state_ibge_id: address?.state_ibge_id ?? 0,
city_ibge_id:  address?.city_ibge_id  ?? 0,
```

## Queries IBGE
```ts
// States — staleTime 24h (dados estáveis)
const { data: states, isPending: isPendingStates } = useQuery({
  queryKey: ["states"],
  queryFn: async () => {
    const res = await listIbgeUfs();
    return res.data ? res.data.sort((a, b) => a.nome.localeCompare(b.nome)) : [];
  },
  staleTime: 1000 * 60 * 60 * 24,
});

// Cities — depende de state_code
const selectedStateCode = watch("state_code");
const { data: cities, isPending: isPendingCities } = useQuery({
  queryKey: ["cities", selectedStateCode],
  queryFn: async () => {
    const res = await listIbgeMunicipios({ path: { siglaUF: selectedStateCode } });
    return res.data ? res.data.sort((a, b) => a.nome.localeCompare(b.nome)) : [];
  },
  enabled: !!selectedStateCode && selectedStateCode.length === 2,
});
```

## Select de Estado (substitui input de texto estado + state_code)
```tsx
<View className="flex-row gap-2">
  <FormControl className="flex-1 gap-2">           {/* Estado */}
    <Controller name="state" render={({ field: { value, onChange } }) => (
      <Select selectedValue={value} onValueChange={val => {
        onChange(val);
        const uf = states?.find(s => s.nome === val);
        if (uf) {
          setValue("state_code", uf.sigla);
          setValue("state_ibge_id", Number(uf.id));
          // resetar cidade ao trocar estado
          setValue("city", "");
          setValue("city_ibge_id", 0);
        }
      }}>
        <SelectTrigger>
          <SelectInput placeholder="Selecione o estado" className="flex-1" />
          <SelectIcon className="mr-3" as={isPendingStates ? Spinner : ChevronDown} />
        </SelectTrigger>
        <SelectPortal>...</SelectPortal>
      </Select>
    )} />
  </FormControl>

  <FormControl isReadOnly className="w-20 gap-2">  {/* Sigla — readonly */}
    <Controller name="state_code" render={({ field: { value } }) => (
      <Input isReadOnly><InputField value={value} /></Input>
    )} />
  </FormControl>
</View>
```

## Select de Cidade (substitui input de texto cidade)
```tsx
<Controller name="city" render={({ field: { value, onChange } }) => (
  <Select selectedValue={value} onValueChange={val => {
    onChange(val);
    const city = cities?.find(c => c.nome === val);
    if (city) setValue("city_ibge_id", Number(city.codigo_ibge));
  }}>
    <SelectTrigger>
      <SelectInput placeholder="Selecione a cidade" className="flex-1 capitalize" />
      <SelectIcon className="mr-3" as={isPendingCities ? Spinner : ChevronDown} />
    </SelectTrigger>
    <SelectPortal>...</SelectPortal>
  </Select>
)} />
```

## Atualizar getCepMutation onSuccess
- Setar `state_ibge_id` junto com `state` no then de `listIbgeUfs`
- Remover a chamada separada de `listIbgeUfs` (já estava lá, só adicionar o ID)

## Atualizar saveAddress
```ts
city_ibge_id: data.city_ibge_id,
state_ibge_id: data.state_ibge_id,
```

## Novos imports
- `useQuery` — `@tanstack/react-query`
- `ChevronDown` — `lucide-react-native`
- `listIbgeMunicipios` — `@/libs/brasil-api-sdk`
- `Select`, `SelectBackdrop`, `SelectContent`, `SelectDragIndicator`,
  `SelectDragIndicatorWrapper`, `SelectIcon`, `SelectInput`, `SelectItem`,
  `SelectPortal`, `SelectTrigger` — `@/components/ui/select`
