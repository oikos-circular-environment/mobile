# Plano: Eliminar requisição duplicada de listIbgeUfs no getCepMutation

## Problema
Em `profile.tsx` e `companies/address.tsx`, o `getCepMutation.onSuccess` chama
`listIbgeUfs()` diretamente para resolver sigla → nome + IBGE ID do estado.
Isso gera uma segunda requisição HTTP, ignorando o cache React Query que já existe
via `useQuery(["states"], ..., { staleTime: 24h })`.

## Causa raiz
O callback `onSuccess` do `useMutation` não recebe `states` como parâmetro, mas
como é definido dentro do componente ele pode capturar `states` por closure.
O `useMutation` é recriado a cada render, então a closure tem sempre o valor atual.

## Solução
Substituir o `listIbgeUfs().then(...)` dentro de `onSuccess` por:
```ts
const uf = states?.find(s => s.sigla === data.state);
if (uf) { /* setValues */ }
```

### Caso de borda — states ainda carregando
Se o componente acabou de montar e o CEP resolver antes da query de estados,
`states` será `undefined`. Para cobrir esse caso sem fazer uma nova requisição HTTP
desnecessária, usar `queryClient.ensureQueryData`:

```ts
const queryClient = useQueryClient();

// dentro de onSuccess:
const cached = queryClient.getQueryData<IbgeUf[]>(["states"]);
const uf = cached?.find(s => s.sigla === data.state);
if (uf) {
  setValue("state", uf.nome);
  setValue("state_ibge_id", Number(uf.id));
}
// Se não estava no cache ainda, o useQuery vai preencher ao terminar de carregar
// e o Select já estará populado para seleção manual — sem requerer nova req.
```

> Nota: `queryClient.getQueryData` é síncrono e não dispara nova requisição.
> Se o dado não estiver no cache, simplesmente não seta — o usuário pode selecionar
> manualmente o estado no Select (já que a query de states carregará em seguida).
> Isso é aceitável: o CEP preenche rua/bairro/cidade/sigla; o nome do estado e
> o IBGE ID são bônus já presentes em 99% dos casos (staleTime 24h).

## Arquivos a modificar

### `src/app/(tabs)/(home)/companies/address.tsx`
- Adicionar `useQueryClient` ao import de `@tanstack/react-query`
- Remover o bloco `listIbgeUfs().then(...)` do `getCepMutation.onSuccess`
- Substituir por lookup síncrono via `queryClient.getQueryData(["states"])`

### `src/app/(tabs)/(home)/profile.tsx`
- Mesma mudança
- `queryClient.getQueryData<IbgeUf[]>(["states"])` com `address.state` como sigla
- Campos: `address.state` (nome) e `address.state_ibge_id`

## Imports a adicionar
- `useQueryClient` — `@tanstack/react-query` (ambos os arquivos)

## Tipo IbgeUf
O tipo retornado por `listIbgeUfs` tem `{ id: number; sigla: string; nome: string }`.
Usar `typeof states[number]` ou inferir de `useQuery` para evitar import extra.
