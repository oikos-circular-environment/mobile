# Tech Plan — Design System Oikos

Artefato de design: `pencil/oikos-pencil.pen` (somente via Pencil MCP). Sem mudanças de código neste épico.

## Abordagem Arquitetural

**Decisões-chave**

1. **Mesmo arquivo, zona dedicada.** O DS vive no `oikos-pencil.pen` porque refs não cruzam arquivos `.pen`. A coluna "Foundation" do canvas (x≈550–1900) concentra: Color Palette, Oikos Design System (expandido) e Showcases.
2. **Três camadas de verdade**: variáveis (tokens) → masters (componentes e estilos) → instâncias (telas). Telas nunca redesenham padrões: instanciam masters via `ref` e aplicam tokens.
3. **Tipografia: masters como espec, tokens como consumo.** Os 12 estilos viram masters de texto reutilizáveis (referência visual e fonte de cópia), mas os textos das telas aplicam propriedades diretamente: `fontFamily: $font-heading|$font-body` + `fontSize: $text-*` + peso conforme a tabela. Racional: instanciar todo texto via ref inflaria o documento; o Pencil não tem text styles compostos.
4. **shadcn lib como base, não dependência.** Componentes novos partem da lib ativada (`r:*`): copiar → adaptar para mobile (alvo de toque ≥44px, paddings maiores, cantos `$radius-*`) → re-skinar com tokens e tipografia Oikos. A cópia desvincula da lib — atualizações dela não propagam (aceito).
5. **Masters existentes redesenhados in-place** (mesmos IDs): todas as instâncias nas telas atualizam automaticamente, sem retrabalho de re-link.
6. **Variantes = master único + showcase.** Cada componente tem 1 master; variantes são instâncias nomeadas com overrides documentadas na vitrine (padrão já validado no ComplaintStatus). Sem masters por variante.
7. **Tema light-only.** O tema dark é removido do documento: variáveis com valores por tema são achatadas para o valor light. O app não tem dark mode; reintroduzir tema depois é aditivo.
8. **Rebrand neste épico: somente Market Flow** — prova do sistema. Auth e Complaints ficam para épico posterior ("Rebrand telas legadas").

**Restrições do Pencil que moldam o design**
- Sem `textTransform`: uppercase (Overline, nomes de empresa) é digitado no `content`.
- Variáveis são escalares: um estilo tipográfico não cabe em 1 token — a tríade família/tamanho/peso é convencionada na tabela e nos masters.
- Sem variants nativos nem auto-layout grid: vitrines usam rows manuais.

**Modos de falha e mitigação**
- Mudar `$primary` e redesenhar masters reflui todas as telas que os usam → verificação visual (screenshot + `snapshot_layout problemsOnly`) após cada etapa, não só no final.
- Remoção do tema dark: variáveis achatadas mudam silenciosamente nós que dependiam do dark → conferir que nenhum frame usa `theme: {mode: dark}` antes de remover.
- Copiar da lib shadcn traz estilos web (px pequenos, cinzas próprios) → checklist de adaptação por componente (toque, tipografia, tokens de cor).

## Modelo de Dados (tokens e variáveis)

**Variáveis alteradas**
- `$primary`: `#333c12` (lime-800) — valor único, sem temas. Corrige divergência design/código.
- `$primary-foreground`, `$background`, `$foreground`, `$card`, `$border`, `$muted-foreground`: achatadas para o valor light atual.
- `themes.mode` removido do documento.

**Variáveis novas — fontes**
- `$font-heading` = `"Oswald"` (string) · `$font-body` = `"Space Grotesk"` (string)

**Variáveis novas — tamanhos** (number)
`$text-display` 36 · `$text-h1` 28 · `$text-h2` 22 · `$text-h3` 18 · `$text-h4` 15 · `$text-overline` 11 · `$text-body-lg` 17 · `$text-body` 15 · `$text-body-sm` 13 · `$text-label` 13 · `$text-button` 15 · `$text-caption` 11

**Escala tipográfica** (fonte de verdade; pesos e lineHeight não são tokens — viram convenção + masters)

| Estilo | Família | Tamanho | Peso | lineHeight | Uso |
|---|---|---|---|---|---|
| Display | Oswald | 36 | 700 | 1.1 | Hero, splash, números de destaque |
| H1 | Oswald | 28 | 700 | 1.2 | Título de tela |
| H2 | Oswald | 22 | 600 | 1.2 | Seções |
| H3 | Oswald | 18 | 600 | 1.25 | Cards, itens de lista |
| H4 | Oswald | 15 | 600 | 1.3 | Subitens, nomes em cards compactos |
| Overline | Oswald | 11 | 600 | 1.3 | Rótulos UPPERCASE (labels de form, eyebrows) |
| Body-lg | Space Grotesk | 17 | 400 | 1.5 | Texto de destaque |
| Body | Space Grotesk | 15 | 400 | 1.5 | Texto padrão |
| Body-sm | Space Grotesk | 13 | 400 | 1.45 | Secundário, descrições |
| Label | Space Grotesk | 13 | 500 | 1.4 | Labels de campos, itens de menu |
| Button | Space Grotesk | 15 | 600 | 1.0 | CTAs e botões |
| Caption | Space Grotesk | 11 | 400 | 1.4 | Metadados, badges, timestamps |

**Mantidas sem mudança**: escalas `$gray-*`, `$lime-*`, `$green-*`, `$yellow-*`, `$spacing-1..10`, `$radius-sm..full`, `$stroke-*`, `$white`, `$black`.

**Pesos a carregar no código (épico futuro)**: Oswald 600/700 · Space Grotesk 400/500/600.

## Arquitetura de Componentes

**Inventário** (origem: `existente` = redesign in-place; `shadcn` = cópia adaptada da lib; `manual` = construído)

| Master | Origem | Variantes (overrides no showcase) | Observações |
|---|---|---|---|
| Display…Caption (12 masters de texto) | existente (H1 `vAz8z`, Body `M975zK`) + novos | — | Espec viva da escala |
| Button `J7k5q` | existente, estética shadcn | primary, secondary, outline, ghost, destructive, disabled | Tipografia → estilo Button |
| Input `PYFm3` | existente, ref shadcn Input Group | default, filled, error, disabled | Label interno → Overline |
| FilterChip `HJWAT` | existente | default, active | Já usado no market/index |
| TabBar `Cp47z` | existente | tab ativa por tela (override) | Labels → Caption |
| Status Bar `fxxWe` | existente | — | Sem mudança estrutural |
| CompanyCard `E1RsmG` | existente (domínio) | aberto/fechado, coletor | Nome → H4, metadados → Caption |
| ComplaintStatus `V467uZ` / TypeTag `qeuaX` / TypeOption `G5y1t` | existentes (domínio) | já documentadas | Re-skin tipográfico apenas |
| Badge | shadcn `r:UjXug` | default, secondary, destructive, outline | Substitui badges ad-hoc |
| Card | shadcn `r:pcGlv` | plain, action, image | Base de superfícies |
| Avatar | shadcn `r:DpPVg` + `r:HWTb9` | text, image, tamanhos sm/md/lg | Usado em CompanyCard, perfil |
| BottomSheet | manual (do sheet de complaints) | — | Drag handle, cantos 20, espelha @gorhom. Decisão (impl-validate): backdrop é overlay de tela inteira e fica nas telas que usam o sheet, não no master |
| Select | shadcn `r:w5c1O` | default, filled, disabled | Espelha gluestack Select |
| Switch | shadcn `r:c8fiq`/`r:fcMl6` | on, off, disabled | Track ativo = `$primary` |
| Skeleton | manual | text, card, avatar | Retângulos `$gray-100`, radius `$radius-md` |

**Estrutura da zona no canvas** (frames de seção dentro/ao lado do "Oikos Design System")
1. **Typography** — 12 masters + tabela de uso anotada
2. **Tokens** — amostras de cor semântica, spacing, radius
3. **Components / Base** — Button, Input, Select, Switch, Badge, Card, Avatar, Skeleton, BottomSheet, FilterChip
4. **Components / App** — TabBar, StatusBar, CompanyCard, Complaint*
5. **Showcases** — vitrine de variantes por componente (recipe book de overrides)

**Integração e fluxo**
- Telas instanciam masters via `ref`; variantes via `descendants` conforme showcase; textos soltos usam tokens.
- Rebrand do Market Flow consome o DS pronto: `market/index` troca Inter→tokens, badges ad-hoc→Badge, capa do card→Avatar/text quando couber.
- Todo master novo recebe `context` (propósito + caminho do componente React correspondente, ex.: Badge → `src/components/ui/badge`).

**Critério de pronto por etapa**: screenshot da seção sem problemas de layout (`snapshot_layout problemsOnly` limpo) + showcase cobrindo todas as variantes declaradas na tabela.
