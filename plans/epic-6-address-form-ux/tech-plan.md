# Tech Plan — UX de formulários de endereço (teclado + geolocalização automática)

## Abordagem Arquitetural

1. **Confirmação por teclado é aditiva, não uma nova abstração.** Os 4 campos de
   CEP/CNPJ já usam `InputField` (`src/components/ui/input/index.tsx`), que
   repassa `...props` sem filtragem até o `TextInput` nativo — `returnKeyType`
   e `onSubmitEditing` já funcionam hoje sem qualquer mudança no wrapper (há
   precedente em `src/components/market/market-list-header.tsx`). A mudança é
   só passar essas props chamando o mesmo handler que o ícone de lupa já
   chama — não há novo componente aqui.

2. **Forward geocoding via Google, client-side, reaproveitando infraestrutura
   existente.** Já existe reverse geocoding (`src/libs/google/reverse-geocode.ts`)
   usando `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (mesma chave do Maps SDK e do
   Places Autocomplete). Forward geocoding é o mesmo endpoint
   (`maps.googleapis.com/maps/api/geocode/json`) com `address=` em vez de
   `latlng=` — não precisa de nova chave, config de app nem endpoint de
   backend. Trade-off aceito: mais uma chamada de rede por busca de CEP (custo
   de latência e de cota da API), em troca de não depender das coordenadas da
   BrasilAPI (`data.location.coordinates`), que na prática costumam vir nulas.

3. **BrasilAPI deixa de ser fonte de coordenadas.** Hoje `complaints/(create)`
   é a única tela que tenta usar `data.location.coordinates` da BrasilAPI, e
   esse valor é `null` na maioria dos CEPs (endpoint agrega provedores
   gratuitos, cobertura inconsistente). Em vez de manter essa fonte como
   "tentativa 1" e Google como fallback, o design usa Google como única fonte
   de coordenadas nas 3 telas — mais simples (um caminho só) e evita
   inconsistência de precisão entre telas.

4. **Lógica de resolução de CEP centralizada em um hook (`useCepLookup`),
   validação/toast permanecem por tela.** As 3 telas repetem hoje "validar CEP
   → chamar BrasilAPI → preencher campos"; ao adicionar geocoding, essa
   duplicação triplicaria. O hook cobre só a parte hoje idêntica (chamada à
   BrasilAPI + geocoding); cada tela mantém o que já é específico dela:
   mensagens de toast (que hoje diferem por tela), e enriquecimento de
   `state_ibge_id`/`city_ibge_id` (só em company, via cross-referência com
   `listIbgeMunicipios`).

5. **Contrato de erro do hook: lança exceção em falha da BrasilAPI (CEP
   inválido/não encontrado/rede), soft-fail (coordenadas `null`) em falha só do
   Google.** Decisão confirmada com o usuário: preserva o padrão de
   try/catch + toast que cada tela já tem hoje (profile, company/address,
   complaints têm mensagens diferentes) — menor mudança de comportamento
   observável. Falha do geocoding não pode derrubar o preenchimento dos demais
   campos, porque a rua/bairro/cidade já são úteis mesmo sem coordenada exata.

6. **Sem mudança de schema/backend.** Toda a mudança é client-side: um novo
   helper de geocoding, um novo hook, e ajustes pontuais nos 3 call sites
   existentes. Os campos `latitude`/`longitude` já existem nos 3 schemas
   (zod) — `number` em profile/company, `string` em complaints — e a
   conversão de tipo fica a cargo de cada tela ao consumir o retorno do hook
   (mantido como `string | null`, espelhando o formato bruto das APIs).

7. **Escopo deliberadamente restrito**: sem navegação `next`/foco entre os
   demais campos dos formulários, e sem um segundo geocode ao sair do campo
   "número" (precisão de prédio) — ambos descartados para não expandir o
   raio de mudança além do necessário para resolver as duas fricções
   descritas no epic brief.

## Modelo de Dados

Não há mudança de schema de banco/backend — a feature é inteiramente
client-side. O único "modelo de dados" novo é o shape normalizado devolvido
pelo hook de resolução de CEP, que serve de ponte entre a resposta da BrasilAPI
+ Google e os 3 schemas de formulário (zod) já existentes:

```ts
// src/libs/use-cep-lookup.ts
type ResolvedCepAddress = {
  cep: string;            // mascarado, ex. "01310-100"
  street: string;
  district: string;
  city: string;
  stateCode: string;      // sigla UF, ex. "SP"
  latitude: string | null;
  longitude: string | null;
};
```

Mapeamento para os schemas existentes (sem alterar nenhum dos três):

| Campo do form                          | Tipo no schema | Origem                                   |
|-----------------------------------------|----------------|-------------------------------------------|
| `profile.address.{street,district,city}`| `string`       | `ResolvedCepAddress` direto                |
| `profile.address.state`/`state_ibge_id` | `string`/`number` | resolvido à parte em profile.tsx (lista de UFs do IBGE, já existente) |
| `profile.address.{latitude,longitude}`  | `number`       | `Number(resolved.latitude/longitude)`      |
| `company.address.{street,district,city}`| `string`       | `ResolvedCepAddress` direto (via `use-company-address.ts`) |
| `company.address.{state_ibge_id,city_ibge_id}` | `number` | resolvido à parte em `use-company-address.ts` (cross-ref `listIbgeMunicipios`, já existente) |
| `company.address.{latitude,longitude}`  | `number`       | `Number(resolved.latitude/longitude)`      |
| `complaints.{street,district,city,region}` | `string`    | `ResolvedCepAddress` direto (`stateCode` → `region`) |
| `complaints.{latitude,longitude}`       | `string`       | `resolved.latitude/longitude` direto (mesmo tipo) |

Novo tipo auxiliar do helper de geocoding (sem persistência, só formato de
retorno de função):

```ts
// src/libs/google/geocode-address.ts
type GeocodedCoordinates = {
  latitude: string;
  longitude: string;
};
```

## Arquitetura de Componentes

**Novo: `geocodeAddress` (`src/libs/google/geocode-address.ts`)**
- Função pura assíncrona, sem estado: `(address: string) => Promise<GeocodedCoordinates | null>`.
- Espelha `reverseGeocode` (já existente no mesmo diretório) — mesmo padrão de
  chamada HTTP à Google Geocoding API, mesma chave de API, mesmo tratamento
  (`try/catch` → `null` em qualquer falha, nunca lança).
- Sem dependência de React/estado — reutilizável tanto pelo novo hook quanto,
  no futuro, por qualquer outro consumidor que precise de forward geocoding.

**Novo: `useCepLookup` (`src/libs/use-cep-lookup.ts`)**
- Hook baseado em `useMutation` (React Query), consistente com o padrão já
  usado em `use-company-address.ts` e nas 3 telas atuais.
- Interface: `{ lookupCep: (digits: string) => Promise<ResolvedCepAddress>, isLookingUpCep: boolean }`.
- Responsabilidade única: chamar `getCepV2` (BrasilAPI SDK) e, com o endereço
  retornado, chamar `geocodeAddress`. Não valida formato de CEP, não mostra
  toast, não sabe nada sobre IBGE — isso permanece nas telas/hooks
  consumidores.
- Modo de falha: lança se `getCepV2` não encontrar o CEP ou falhar na rede
  (contrato confirmado); nunca lança por falha do `geocodeAddress` — nesse
  caso retorna `latitude`/`longitude` como `null`.

**Alterado: `useCompanyAddress` (`src/components/companies/hooks/use-company-address.ts`)**
- Passa a chamar `useCepLookup()` internamente (composição de hooks) e usar
  `lookupCep` dentro do `mutationFn` de `resolveCep`.
- Mantém sua responsabilidade atual por cima: cross-referência com
  `listIbgeMunicipios`/`states` para resolver `state_ibge_id`/`city_ibge_id`,
  que não fazem parte do hook compartilhado (são específicos de company).
- `ResolvedCepValues` (tipo já exportado por este hook) ganha `latitude`/
  `longitude: number | null`.
- Fronteira inalterada com `address.tsx`: continua expondo `searchCep`,
  consumido do mesmo jeito por `onPressSearchCep`.

**Alterado: `profile.tsx`, `complaints/(create)/index.tsx`**
- Passam a chamar `useCepLookup()` diretamente (não há hook intermediário
  específico de feature para esses dois, ao contrário de company).
- Mantêm sua própria validação de dígitos + toast de erro (try/catch em volta
  de `lookupCep`) e seu próprio mapeamento de `ResolvedCepAddress` para os
  campos do formulário (via `reset`/`setValue`, como já fazem hoje).

**Fluxo de dados de ponta a ponta (buscar CEP → mapa atualizado):**
```
Usuário digita CEP → Enter/toque no ícone
  → tela valida 8 dígitos (local, inalterado)
  → useCepLookup.lookupCep(digits)
      → getCepV2 (BrasilAPI)      [lança se não encontrado/erro de rede]
      → geocodeAddress(endereço)  [retorna null em falha, não lança]
      → ResolvedCepAddress
  → tela mapeia para os campos do form (setValue/reset)
  → (profile/company) Controller do mapa lê value.latitude/longitude
    (complaints) watch("latitude")/watch("longitude")
  → WrapperMap recebe novas coordenadas via props
      → useEffect interno atualiza selectedLocation
      → region/marker do MapView se movem
```
Nenhuma mudança é necessária na renderização do `WrapperMap` em nenhuma das 3
telas — a cadeia reativa (props → estado interno → mapa) já está correta hoje;
o problema era a origem dos dados (coordenadas nunca preenchidas, ou vindas
nulas da BrasilAPI), não a propagação.
