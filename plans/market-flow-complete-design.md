# Plano: Fluxo completo de Market no Pencil (novo design system)

> **Status (2026-06-10): EXECUTADO** ✅ — 7 telas no Market Flow (index, detalhe Geral, simulação, 3 sheets, modal de permissão) + 4 masters novos, validados com screenshots e `snapshot_layout` limpo. "Market Flow Old" mantido como referência da produção.
>
> **Aditivo (2026-06-10)**: seções do detalhe viraram **Resíduos/Serviços em grid 2 colunas** (`MarketItemTile` com HazardBadge da categoria ABNT NBR 10004); tap abre a 8ª tela `market/[companyId] — item (sheet)` com info completa do item + categoria (grau de periculosidade, alerts de descrição/observações, subcategorias INCLUDE/EXCLUDE). Masters novos: HazardBadge, Alert, SubcategoryCard, MarketItemTile. Implementação no código deve reusar `src/components/companies/waste-category/`.

## Fonte de verdade (código)

- `market/index` (`src/app/(tabs)/market/index.tsx`): lista com filtros — query (máx 80), raio (2/5/10/15/20/30/40 km, default 2 km), categoria (`waste`/`services`, opcional) — via `market-context`; localização atual vs perfil via `LocationSourceSelect` (bottom sheet); infinite scroll.
- `market/[companyId]` (`[companyId].tsx`): 2 abas em segmented control:
  - **Geral** (`company-detail-general-tab.tsx`): header da empresa (iniciais + corporate_name + business_name) → Informações (card endereço com botão de rota; cards de telefone com botões tel/WhatsApp) → Horário de funcionamento (dia atual + badge Aberto/Fechado + "Agora são HH:mm" + slots do dia; tap abre `BusinessHoursBottomSheet` com a semana) → card Atenção (higienização) → Produtos (ícone recycle, nome, preço `/kg|/L|/un...`, descrição, badge da categoria; tap → aba Simulação com item selecionado) → Serviços (idem, ícone hammer).
  - **Simulação** (`company-detail-simulation-tab.tsx`): card catálogo (toggle Resíduos/Serviços + lista selecionável, selecionado = borda lime) → card formulário (Quantidade decimal + Unidade disabled + card "Total do item" lime + botão "Adicionar a simulação") → Lista (itens com swipe-delete, qty × preço, card "Total geral" lime).
- `is-company-open.ts`: badge Aberto/Fechado por slots do dia atual.

## Telas a criar no "Market Flow" (KXfuR), nomeadas por rota + estado

1. `market/index` — ✅ existente (grid 2 colunas)
2. `market/index — filtros`: lista esmaecida + BottomSheet "Filtros": bloco Localização (linha resumida → abre sheet 3), Raio (chips 7 opções, 2 km ativo), Categoria (chips Todos/Resíduos/Serviços), Button "Aplicar filtros" + ghost "Limpar"
3. `market/index — localização`: BottomSheet "Selecionar localização": 2 option rows (Localização atual selecionada com check + borda lime; Endereço do perfil) + endereço/coords em Caption
4. `market/[companyId]`: status bar + linha de navegação (icon-button voltar) + header empresa (Avatar 56 quadrado lime-800 + H2 corporate_name + BodySm business_name + badges Aberto/distância) + SegmentedControl (Geral ativo | Simulação) + seções da aba Geral + TabBar (Market ativo)
5. `market/[companyId] — horários`: detalhe esmaecido + BottomSheet "Horário de funcionamento": 7 linhas (dia + slots ou "Fechado"), dia atual destacado (fill lime-50 + badge)
6. `market/[companyId] — simulação`: mesma base da tela 4 com SegmentedControl (Simulação ativo) + catálogo + formulário + lista + totais

## Novos masters no DS (Section / Components App)

| Master | Uso | Estrutura |
|---|---|---|
| `SegmentedControl` | abas Geral/Simulação; toggle Resíduos/Serviços | frame radius-md borda $border padding 4; 2 segmentos fill_container; ativo = fill $primary texto branco (ButtonText 13), inativo texto $gray-600 |
| `MarketItemCard` | Produtos/Serviços (aba Geral) e catálogo (Simulação, variante selecionada) | Card: row [ícone em quadrado $gray-100 radius-md 40 + nome Label/600 + preço H4 + unidade Caption] + descrição BodySm + badge outline categoria. Variante selected: stroke $primary, fill lime-50 |
| `SheetOptionRow` | sheets de localização | row: quadrado ícone $primary + título Label/600 + endereço Caption + coords Caption + check $primary (variante selected: fill lime-50 stroke $primary) |
| `DayScheduleRow` | sheet de horários | row space_between: dia Label + slots Caption/600 (ou "Fechado" muted); variante hoje: fill lime-50 + Badge |

Reuso direto: BottomSheet `cYytK`, Badge `hNp9X`, Avatar `KpTyo`, Button `J7k5q`, Input `PYFm3`, FilterChip `HJWAT`, TabBar `Cp47z`, StatusBar `fxxWe`.

## Sequência de execução

0. Verificar variáveis pós-`replace` (eixo `mode`, queda do MCP na sessão anterior) e ler o frame "Market Flow Old" criado pelo usuário (replica produção)
1. Criar os 4 novos masters + showcases
2. Tela 4 (detalhe Geral) — âncora do fluxo
3. Tela 6 (simulação) — reusa a base da 4
4. Telas 2, 3, 5 (sheets sobre as bases)
5. Validação: screenshot por tela + `snapshot_layout problemsOnly` no KXfuR
6. Atualizar memória (IDs novos) e este plano

## Decisões de design

- Voltar: produção usa `headerShown: false` sem affordance visível — o design adiciona icon-button de voltar (ghost, chevron-left) na linha de navegação; melhoria proposta para o código.
- Avatar da empresa no detalhe: quadrado lime-800 56px com iniciais (consistente com CompanyCard; produção usa `bg-slate-950` — migra para token $primary).
- Os preços usam H4 Oswald para valor + Caption para unidade (hierarquia de marketplace).
