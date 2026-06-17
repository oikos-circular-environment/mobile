# Plano: Remodelagem da listagem do Market (design no Pencil)

> **Status (2026-06-10)**: tela `market/index` criada no Pencil com grid 2 colunas e rebrandada com o design system (tokens `$font-*`/`$text-*`/`$primary`, masters Badge/Avatar disponíveis). Pendentes: tela do sheet de filtros, detalhe `market/[companyId]` e implementação em código. Specs do DS em `docs/design-system/`.

## Objetivo
Redesenhar `src/app/(tabs)/market/index.tsx` para que a exposição das empresas (resíduos e serviços) seja o foco principal da tela, em um grid de 2 colunas estilo marketplace, com filtros compactos que não dominem a tela.

## Problemas do layout atual
- Os filtros (busca + localização + raio + categoria) ocupam mais da metade da viewport antes de qualquer empresa aparecer
- Card de título "Pontos de coletas" gasta espaço vertical sem função de navegação
- A lista vertical de empresas dá pouca densidade — uma empresa por linha, com tipografia pequena
- O usuário precisa rolar muito para chegar no conteúdo principal (as empresas)

## Referências
- Inspirações: marketplaces mobile (grid 2 colunas, card com área de imagem + título + meta, chips de categoria horizontais, busca no topo)
- Design kit: gluestack-ui v5 (componentes já existentes no projeto: Input, Badge, Card, Heading, Text)
- Tema: lime-800 como cor primária, fonte Oswald para nomes de empresa

## Novo layout (tela 430×932 no Pencil, frame "Market Flow")

### 1. Header compacto (substitui card de título + LocationSourceSelect expandido)
- Status bar padrão (componente `Status Bar`)
- Linha de localização: ícone pin em quadrado lime-800 + endereço resumido (1 linha) + chevron-down → continua abrindo o bottom sheet do `LocationSourceSelect`
- Heading "Pontos de coleta"

### 2. Busca + filtros em uma linha
- Input de busca (flex-1, ícone search, placeholder "Empresas, resíduos ou serviços")
- Botão quadrado de filtros (ícone sliders) → abre bottom sheet com Raio + Localização (filtros avançados saem da tela principal)

### 3. Chips de categoria (linha horizontal)
- "Todos" (ativo, bg lime-800) / "Resíduos" / "Serviços"
- Chip de raio atual ("2 km") como atalho visual para o sheet de filtros

### 4. Grid de empresas (2 colunas) — protagonista da tela
Card de empresa (~191px de largura):
- Área de capa (~96px): bg lime-100, avatar central (iniciais em quadrado lime-800, ou ícone sprout para coletor), badge "Aberto"/"Fechado" no canto superior direito
- Nome (Oswald bold uppercase, até 2 linhas)
- Identity (texto sm cinza, só para empresas)
- Resíduos resumidos ("Plástico, Vidro +3", texto xs cinza)
- Rodapé: badge de distância + badge "Coletor" quando aplicável

### 5. Rodapé
- TabBar com tab Market ativa
- Paginação: cards da última linha parcialmente cortados sugerem scroll ("Carregar mais" permanece no código via infinite scroll)

## Telas a criar no Pencil (frame "Market Flow", id KXfuR)
1. `market - Oikos` — listagem com grid 2 colunas (esta etapa)
2. `market filters - Oikos` — bottom sheet de filtros (raio + localização) sobre a listagem
3. (futuro) revisão de `company - Oikos Market` (detalhe da empresa)

## Componentes Pencil
- Reutilizar: `Status Bar` (fxxWe), TabBar (Cp47z), variáveis ($lime-*, $gray-*, $radius-*, $spacing-*)
- Criar: componente reutilizável `CompanyCard` e instanciar 6× no grid com overrides

## Fase de código (após validação do design)
- Refatorar `index.tsx`: header compacto, `FlatList` com `numColumns={2}` (substitui ScrollView + map), chips de categoria inline, filtros avançados em bottom sheet
- Novo componente `CompanyCard` em `src/components/market/`
- Mover Raio + LocationSourceSelect para `MarketFiltersSheet` (bottom sheet)
- Manter `useMarket` (market-context) sem alterações de API
