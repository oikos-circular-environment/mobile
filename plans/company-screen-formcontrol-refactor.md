# Plano: Refatoração FormControl + Controller — company.tsx

## Problema
Cinco dos seis campos do formulário envolvem o `FormControl` inteiro dentro do `render` do `Controller`.  
O `Controller` deve gerenciar **apenas** o componente interativo que precisa de `value`/`onChange` — o restante da estrutura (`FormControlLabel`, `FormControlError`) não depende de estado controlado e não deve estar dentro do render prop.

## Padrão correto (referência: campo `identity`)
```tsx
<FormControl isInvalid={!!errors.field} className="gap-2">
  <FormControlLabel>
    <FormControlLabelText>Label</FormControlLabelText>
  </FormControlLabel>
  <Controller
    control={control}
    name="field"
    render={({ field: { value, onChange, onBlur } }) => (
      <Input>
        <InputField value={value} onChangeText={onChange} onBlur={onBlur} />
      </Input>
    )}
  />
  <FormControlError>
    <FormControlErrorIcon as={AlertCircle} className="size-4" />
    <FormControlErrorText>{errors.field?.message}</FormControlErrorText>
  </FormControlError>
</FormControl>
```

## Campos a corrigir

| Campo             | Situação atual                              | Ação                                   |
|-------------------|---------------------------------------------|----------------------------------------|
| `identity`        | Correto (FormControl fora, Controller no Input) | Nenhuma                            |
| `corporate_name`   | Controller envolve FormControl inteiro      | Extrair FormControl para fora do Controller |
| `business_name`    | Controller envolve FormControl inteiro      | Extrair FormControl para fora do Controller |
| `email`           | Controller envolve FormControl inteiro      | Extrair FormControl para fora do Controller |
| `phones`          | Controller envolve FormControl inteiro      | Extrair FormControl para fora do Controller |
| `started_activity_in` | Controller envolve FormControl inteiro    | Extrair FormControl para fora do Controller |

## Mudanças por campo

### corporate_name
- Mover `<FormControl isInvalid={!!errors.corporate_name}>` para fora do Controller
- Controller envolve apenas `<Input><InputField .../></Input>`

### business_name
- Mesmo padrão acima

### email
- Mesmo padrão acima

### phones
- Mesmo padrão acima
- `onChangeText` mantém a lógica: `v => onChange(v.length ? [v] : null)`

### started_activity_in
- Mesmo padrão acima
- `onChangeText` mantém o parse de data
- `FormControlHelper` fica como irmão do Controller (não dentro do render prop)

## Arquivo a modificar
- `src/app/(tabs)/(home)/companies/company.tsx`

## Impacto
- Sem alteração de comportamento
- Re-renders do Controller limitados ao componente Input, não à estrutura inteira
- Código mais legível e semântico
