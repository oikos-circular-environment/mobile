# Epic Brief — UX de formulários de endereço (teclado + geolocalização automática)

## Resumo

Três formulários do app (perfil, cadastro de empresa e criação de denúncia) usam
CEP/CNPJ para autopreencher endereço. Hoje isso tem duas fricções: (1) o usuário
precisa **tocar num ícone de lupa** para confirmar a busca em vez de simplesmente
apertar Enter no teclado; e (2) o pino do mapa (latitude/longitude) **não
acompanha o CEP pesquisado** — fica preso na localização atual do dispositivo
(GPS) ou no último valor salvo, obrigando o usuário a arrastar o pino
manualmente sempre que cadastra um endereço onde não está fisicamente presente.
Este epic resolve as duas fricções e, por serem quase as mesmas telas, também
centraliza a lógica de resolução de CEP (hoje duplicada) num hook compartilhado.

## Contexto & Problema

- **Quem é afetado**: qualquer usuário completando o próprio perfil
  (`src/app/(tabs)/(home)/profile.tsx`), cadastrando/editando uma empresa
  (`src/app/(tabs)/(home)/companies/[companyId]/company.tsx` — CNPJ — e
  `.../address.tsx` — CEP) ou criando uma denúncia
  (`src/app/(tabs)/complaints/(create)/index.tsx` — CEP).
- **Fricção 1 — confirmação por toque**: em profile/company/address, a busca de
  CEP ou CNPJ só dispara ao tocar num `InputSlot` com ícone de lupa dentro do
  `Input` — quebra o fluxo de digitação (o usuário tira a mão do teclado para
  tocar um alvo pequeno). Em complaints, a busca já dispara em `onBlur`, mas
  falta o `returnKeyType`/comportamento de teclado equivalente.
- **Fricção 2 — coordenadas não acompanham o CEP**: em profile.tsx e
  address.tsx, a busca de CEP hoje só preenche rua/bairro/cidade/estado — os
  campos `latitude`/`longitude` nunca são tocados pela busca, só mudam quando o
  usuário toca no mapa (`WrapperMap`) ou usa "minha localização" (GPS). Em
  complaints, `handleCepLookup` tenta usar `data.location.coordinates` da
  BrasilAPI, mas esse campo costuma vir `null` (endpoint agrega múltiplos
  provedores gratuitos com cobertura inconsistente) — na prática o mapa parece
  "travado" na localização atual do dispositivo mesmo após buscar um CEP de
  outra região.
- **Duplicação de lógica**: as 3 telas repetem a mesma sequência (validar CEP →
  chamar `getCepV2` da BrasilAPI → preencher campos). Com a correção da
  fricção 2, adicionar geocoding via Google nas 3 telas separadamente
  triplicaria ainda mais essa lógica.
- **Dor atual**: cadastro de empresa/perfil fora do local físico (comum — dono
  de empresa cadastrando de casa, ou denunciante reportando um endereço que não
  é onde ele está) exige ajuste manual do pino a cada cadastro, o que é
  confuso e gera coordenadas incorretas quando o usuário esquece de ajustar.

## Critérios de sucesso

- Nos 4 campos de CEP/CNPJ (profile, company/CNPJ, company/address,
  complaints), apertar Enter/Confirmar no teclado dispara a mesma ação que
  tocar no ícone de lupa (ou, no caso de complaints, fecha o teclado e aciona
  a busca já existente no blur).
- Buscar um CEP em profile ou company/address preenche automaticamente
  latitude/longitude via Google Geocoding API a partir do endereço retornado
  pela BrasilAPI, e o pino do mapa se move de acordo — sem exigir toque manual
  no mapa.
- Em complaints, a busca de CEP passa a usar Google Geocoding como fonte
  confiável de coordenadas (em vez de depender de `location.coordinates` da
  BrasilAPI, que costuma vir nulo) — corrigindo o pino "preso" na localização
  atual.
- A chamada à BrasilAPI + geocoding fica centralizada num hook único
  (`useCepLookup`), reutilizado pelas 3 telas — cada tela mantém apenas o que é
  específico dela (validação/toast, enriquecimento de `state_ibge_id`/
  `city_ibge_id` em company).
- Nenhuma regressão nos formulários: validação de CEP/CNPJ inválido continua
  mostrando os toasts de erro já existentes; falha de geocoding (endereço não
  encontrado) não quebra o preenchimento dos demais campos.

## Escopo

**Dentro:**
- `returnKeyType`/`onSubmitEditing` nos 4 campos de CEP/CNPJ citados.
- Novo helper `src/libs/google/geocode-address.ts` (forward geocoding, espelha
  `src/libs/google/reverse-geocode.ts` já existente — mesma
  `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, sem nova chave/endpoint de backend).
- Novo hook compartilhado `src/libs/use-cep-lookup.ts`, consumido por
  `profile.tsx`, `use-company-address.ts` e `complaints/(create)/index.tsx`.
- Geocoding disparado **apenas no momento da busca do CEP** (precisão de
  rua/quadra) — sem um segundo geocode ao sair do campo "número".

**Fora:**
- Navegação `next`/foco entre os demais campos dos formulários (fora do
  escopo desta melhoria de teclado).
- Geocode refinado por número do imóvel (precisão de prédio) — descartado
  para reduzir escopo; pode virar iteração futura se a precisão de rua não for
  suficiente na prática.
- Qualquer mudança na tela de criação de denúncia além da correção do
  `handleCepLookup` (busca via Google Places e toque no mapa já funcionam
  corretamente e não são alterados).

## Prazo

Sem urgência definida — melhoria de UX incremental, não bloqueia lançamento.
