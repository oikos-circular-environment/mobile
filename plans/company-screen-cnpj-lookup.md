# Plano: getCnpjMutation — Busca por CNPJ no company.tsx

## Objetivo
Quando o usuário terminar de digitar o CNPJ e pressionar o botão de pesquisa (InputSlot), buscar os dados na BrasilAPI e preencher automaticamente os campos do formulário.

## Análise do contexto

### Endpoint
`getCnpj` do `@/libs/brasil-api-sdk` — `GET /cnpj/v1/{cnpj}`  
Requer: `{ path: { cnpj: string } }` — aceita com ou sem formatação.

### Campos da resposta `Cnpj` relevantes para o formulário
| Campo API (`Cnpj`)         | Campo do form         | Obs                                                      |
|----------------------------|-----------------------|----------------------------------------------------------|
| `razao_social`             | `corporateName`       |                                                          |
| `nome_fantasia`            | `businessName`        | pode ser `""` ou `undefined`                             |
| `email`                    | `email`               | pode ser `null`                                          |
| `ddd_telefone_1`           | `phones[0]`           | formato "XX XXXXX-XXXX" ou "XX XXXX-XXXX" — passar por `mask.phoneBr` após strip |
| `data_inicio_atividade`    | `startedActivityIn`   | string `"YYYY-MM-DD"` — converter com `parseISO` (date-fns) |

### Padrão de referência
`getCepMutation` em `profile.tsx`:
- `useMutation` com `mutationKey`
- `mutationFn` chama o SDK e retorna `response.data`
- `onSuccess` usa `reset({ ...currentValues, ...novos })` com `keepDefaultValues: true`
- `onError` usa `toast.error`
- Botão usa `isPending ? Spinner : Search` como `InputIcon`
- Handler valida comprimento antes de chamar `.mutateAsync`

## Mudanças necessárias

### 1. Imports a adicionar
```ts
import { useMutation } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { Search } from "lucide-react-native";
import { toast } from "@/components/toast";
import { Spinner } from "@/components/ui/spinner";
import { getCnpj } from "@/libs/brasil-api-sdk";
```

### 2. Extrair `setValue` do `useForm`
```ts
const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm(...)
```

### 3. Definir `getCnpjMutation`
```ts
const getCnpjMutation = useMutation({
  mutationKey: ["get", "cnpj", "brasil-api"],
  mutationFn: async ({ cnpj }: { cnpj: string }) => {
    const response = await getCnpj({ path: { cnpj } });
    return response.data;
  },
  onSuccess: data => {
    if (!data) return;
    if (data.razao_social) setValue("corporateName", data.razao_social);
    if (data.nome_fantasia) setValue("businessName", data.nome_fantasia);
    if (data.email) setValue("email", data.email);
    if (data.ddd_telefone_1) {
      setValue("phones", [mask.phoneBr(data.ddd_telefone_1)]);
    }
    if (data.data_inicio_atividade) {
      setValue("startedActivityIn", parseISO(data.data_inicio_atividade));
    }
  },
  onError: () => {
    toast.error("CNPJ não encontrado", "Verifique o número e tente novamente.");
  },
});
```

### 4. Handler de pressão do botão
```ts
const onPressSearchCnpj = () => {
  const cnpj = control._formValues.identity as string;
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) {
    toast.error("CNPJ inválido", "O CNPJ deve conter 14 dígitos.");
    return;
  }
  getCnpjMutation.mutate({ cnpj: digits });
};
```

### 5. Atualizar o InputSlot do campo identity
```tsx
<InputSlot className="pr-3" onPress={onPressSearchCnpj}>
  <InputIcon as={getCnpjMutation.isPending ? Spinner : Search} />
</InputSlot>
```

## Arquivos a modificar
- `src/app/(tabs)/(home)/companies/company.tsx`

## Dependências já existentes
- `@tanstack/react-query` — já usado no projeto
- `brasil-api-sdk` + `brasil-api.ts` client — já configurado com `throwOnError: true`
- `toast` — já no projeto (ver profile.tsx)
- `Spinner` — já no projeto (ver profile.tsx)
- `mask.phoneBr` — já em `@/libs/mask`
- `parseISO` — `date-fns` já como dependência
