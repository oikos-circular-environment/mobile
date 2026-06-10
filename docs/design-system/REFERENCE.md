# Oikos Design System — Reference

Fonte de verdade: `pencil/oikos-pencil.pen` (seção **Oikos Design System**).

---

## 1. Tokens

### 1.1 Cores Semânticas

| Token | Valor | Uso |
|---|---|---|
| `$primary` | `#333c12` (lime-800) | CTAs, tab ativa, chip ativo, ícone/label ativo |
| `$primary-foreground` | `#ffffff` | Texto/ícone sobre primary |
| `$background` | `#ffffff` | Fundo de tela |
| `$foreground` | `#111827` (gray-900) | Texto principal, ícones principais |
| `$muted-foreground` | `#6b7280` (gray-500) | Texto secundário, placeholders, metadados |
| `$card` | `#f9fafb` (gray-50) | Fundo de cartão |
| `$border` | `#e5e7eb` (gray-200) | Bordas de inputs, cards, contêineres |
| `$white` | `#ffffff` | Branco puro (ícones, textos em primary) |
| `$black` | `#000000` | Preto puro |

### 1.2 Escala Gray

| Token | Valor |
|---|---|
| `$gray-50` | `#f9fafb` |
| `$gray-100` | `#f3f4f6` |
| `$gray-200` | `#e5e7eb` |
| `$gray-300` | `#d1d5db` |
| `$gray-400` | `#9ca3af` |
| `$gray-500` | `#6b7280` |
| `$gray-600` | `#4b5563` |
| `$gray-700` | `#374151` |
| `$gray-800` | `#1f2937` |
| `$gray-900` | `#111827` |
| `$gray-950` | `#030712` |

### 1.3 Cores de Acento

| Token | Valor |
|---|---|
| `$lime-50` | `#f7f9f0` |
| `$lime-100` | `#ecf1db` |
| `$lime-200` | `#d8e3b5` |
| `$lime-300` | `#c0d18b` |
| `$lime-400` | `#a4bc60` |
| `$lime-500` | `#81982d` |
| `$lime-600` | `#667924` |
| `$lime-700` | `#4c5a1b` |
| `$lime-800` | `#333c12` **(= `$primary`)** |
| `$lime-900` | `#1a1e09` |
| `$lime-950` | `#0d0f04` |

| Token | Valor |
|---|---|
| `$green-50` | `#f3faf4` |
| `$green-100` | `#e4f4e6` |
| `$green-200` | `#c9e9cd` |
| `$green-300` | `#9fd6a6` |
| `$green-400` | `#6eba79` |
| `$green-500` | `#499e55` |
| `$green-600` | `#388142` |
| `$green-700` | `#2f6637` |
| `$green-800` | `#274e2d` |
| `$green-900` | `#234429` |
| `$green-950` | `#0f2413` |

| Token | Valor |
|---|---|
| `$yellow-50` | `#fcfdf1` |
| `$yellow-100` | `#f8fad8` |
| `$yellow-200` | `#f1f5af` |
| `$yellow-300` | `#e8ef81` |
| `$yellow-400` | `#dee755` |
| `$yellow-500` | `#ddd532` |
| `$yellow-600` | `#b8b128` |
| `$yellow-700` | `#938d1f` |
| `$yellow-800` | `#6d6a16` |
| `$yellow-900` | `#48460e` |
| `$yellow-950` | `#242307` |

### 1.4 Tipografia

| Token | Tipo | Valor |
|---|---|---|
| `$font-heading` | string | `Oswald` |
| `$font-body` | string | `Space Grotesk` |

### 1.5 Tamanhos de Texto

| Token | Valor | Uso |
|---|---|---|
| `$text-display` | 36 | Hero, splash, números de destaque |
| `$text-h1` | 28 | Título de tela |
| `$text-h2` | 22 | Seções |
| `$text-h3` | 18 | Cards, itens de lista |
| `$text-h4` | 15 | Subitens, nomes em cards compactos |
| `$text-overline` | 11 | Rótulos UPPERCASE |
| `$text-body-lg` | 17 | Texto de destaque |
| `$text-body` | 15 | Texto padrão |
| `$text-body-sm` | 13 | Secundário, descrições |
| `$text-label` | 13 | Labels de campos, itens de menu |
| `$text-button` | 15 | CTAs e botões |
| `$text-caption` | 11 | Metadados, badges, timestamps |

### 1.6 Espaçamento

| Token | Valor |
|---|---|
| `$spacing-1` | 4 |
| `$spacing-2` | 8 |
| `$spacing-3` | 12 |
| `$spacing-4` | 16 |
| `$spacing-5` | 20 |
| `$spacing-6` | 24 |
| `$spacing-8` | 32 |
| `$spacing-10` | 40 |

### 1.7 Raio (border-radius)

| Token | Valor |
|---|---|
| `$radius-sm` | 4 |
| `$radius-md` | 8 |
| `$radius-lg` | 12 |
| `$radius-xl` | 16 |
| `$radius-2xl` | 24 |
| `$radius-full` | 999 |

### 1.8 Traço (stroke-width)

| Token | Valor |
|---|---|
| `$stroke-thin` | 1 |
| `$stroke-thick` | 2 |

---

## 2. Escala Tipográfica

12 masters de texto reutilizáveis na seção **Typography** do Design System. Textos em telas usam `fontFamily` + `fontSize` diretamente (não instanciam os masters via ref).

### Headings (Oswald)

| Estilo | ID | Peso | lineHeight |
|---|---|---|---|
| **Display** `$text-display` | `UqptZ` | 700 | 1.1 |
| **H1** `$text-h1` | `vAz8z` | 700 | 1.2 |
| **H2** `$text-h2` | `xfRMK` | 600 | 1.2 |
| **H3** `$text-h3` | `Dd4Za` | 600 | 1.25 |
| **H4** `$text-h4` | `bxa3Z` | 600 | 1.3 |
| **Overline** `$text-overline` | `WcDHB` | 600 | 1.3 |

### Body (Space Grotesk)

| Estilo | ID | Peso | lineHeight |
|---|---|---|---|
| **Body-lg** `$text-body-lg` | `IsfOQ` | 400 | 1.5 |
| **Body** `$text-body` | `M975zK` | 400 | 1.5 |
| **Body-sm** `$text-body-sm` | `lESbD` | 400 | 1.45 |
| **Label** `$text-label` | `AXv9j` | 500 | 1.4 |
| **Button** `$text-button` | `jT5f5` | 600 | 1.0 |
| **Caption** `$text-caption` | `MQ4Z2` | 400 | 1.4 |

---

## 3. Componentes

Cada componente tem um **master** (design原始) na seção **Components Base** ou **Components App**. Variantes são instâncias do master com overrides documentadas no **Showcase**.

### 3.1 Button (`J7k5q`)

```
fill_container × 48 | fill: $primary | radius: $radius-md | gap: $spacing-2 | padding: 0 $spacing-6
```

| Variante | Overrides |
|---|---|
| **primary** (default) | — |
| **secondary** | `fill: $gray-100`, texto `$foreground` |
| **outline** | `fill: #ffffff`, `stroke: $border`, texto `$foreground` |
| **ghost** | `fill: transparent`, texto `$foreground` |
| **destructive** | `fill: #dc2626` |
| **disabled** | (opacidade reduzida visualmente) |

Texto interno: estilo **Button** (`$text-button`, `$font-body`, peso 600).

### 3.2 Input (`PYFm3`)

```
fill_container | gap: $spacing-2
- Label: Overline (`$text-overline`)
- Campo: frame interno com fill #ffffff, radius $radius-md, stroke $border
```

| Variante | Overrides |
|---|---|
| **default** | — |
| **filled** | label "PREENCHIDO", texto `$foreground` |
| **error** | label "COM ERRO", campo com borda vermelha |
| **disabled** | label "DESABILITADO" |

### 3.3 FilterChip (`HJWAT`)

```
fill: #ffffff | radius: $radius-md | stroke: $border | gap: 8 | padding: 10 14
- ícone + label
```

| Variante | Overrides |
|---|---|
| **default** | — |
| **active** | `fill: $primary`, ícone `#ffffff`, label `#ffffff` |

### 3.4 Badge (`hNp9X`)

```
fill: $primary | radius: $radius-full | gap: 4 | padding: 3 10
- label: Caption (`$text-caption`, peso 600)
```

| Variante | Overrides |
|---|---|
| **default** | fill `$primary`, texto `$white` |
| **secondary** | fill `$gray-100`, texto `$gray-700` |
| **success** | fill `$green-100`, texto `$green-700` |
| **destructive** | fill `#fee2e2`, texto `#dc2626` |
| **outline** | fill `#ffffff`, `stroke: $border`, texto `$foreground` |

### 3.5 Avatar (`KpTyo`)

```
44×44 | fill: $lime-100 | radius: $radius-full
- texto: iniciais
- retângulo AvatarImage (desabilitado por padrão)
```

| Variante | Overrides |
|---|---|
| **md** (default) | 44×44, fonte 14 |
| **sm** | 32×32, fonte 11 |
| **lg** | 56×56, fonte 18 |
| **image** | habilita retângulo AvatarImage |

### 3.6 Card (`y1Um8`)

```
fill_container | fill: #ffffff | radius: $radius-lg | stroke: $border | gap: $spacing-2 | padding: $spacing-4
- CardCover (retângulo, desabilitado)
- CardTitle (texto)
- CardDescription (texto)
- CardActionRow (frame, desabilitado)
```

| Variante | Overrides |
|---|---|
| **plain** (default) | — |
| **image** | habilita CardCover |
| **action** | habilita CardActionRow (contém ghost Button) |

### 3.7 Select (`q6UFqe`)

```
fill_container | gap: $spacing-2
- SelectLabel: Overline
- SelectField: frame com fill #ffffff, radius $radius-md, stroke $border
```

| Variante | Overrides |
|---|---|
| **default** | — |
| **filled** | label "ESTADO" |
| **disabled** | label "DESABILITADO" |

### 3.8 Switch (`f6wtq`)

```
48×28 | radius: $radius-full | padding: 2
- SwitchThumb: ellipse 24×24 fill #ffffff
```

| Variante | Overrides |
|---|---|
| **on** (default) | fill `$primary` |
| **off** | fill `$gray-300` |

### 3.9 Skeleton (`YI9Gt`)

```
120×14 | fill: $gray-100 | radius: $radius-md
```

| Variante | Overrides |
|---|---|
| **text** (default) | 120×14, radius `$radius-md` |
| **card** | 160×90, radius `$radius-lg` |
| **avatar** | 44×44, radius `$radius-full` |

### 3.10 BottomSheet (`cYytK`)

```
430 | fill: #ffffff | radius: [20, 20, 0, 0] | stroke: $border | gap: 12 | padding: 8 16 24 16
- SheetHandleRow: drag handle
- SheetTitle: texto
- SheetContent: slot para conteúdo (frame)
```

### 3.11 Status Bar (`fxxWe`)

```
430×62 | fill: #ffffff | padding: 0 20
- Usa Inter (propósito: simular SF Pro do sistema iOS)
- NÃO usar tokens do DS
```

### 3.12 TabBar (`Cp47z`)

```
430×100 | fill: #ffffff | stroke: #e5e7eb
- 3 tabs fixas: Market (store), Início (home), Denúncias (flag)
- Tab ativa: ícone + label com fill $primary, fontWeight 600
- Tab inativa: ícone + label com fill $gray-400, fontWeight normal
```

### 3.13 CompanyCard (`E1RsmG`)

```
191×? | fill: #ffffff | radius: 12 | stroke: $gray-200
- Cover: frame interno com Initials (texto) ou ícone (coletor)
- Info: Nome (H4) + Descrição (Body-sm) + Tags (Caption) + Distância (Caption)
```

| Variante | Overrides |
|---|---|
| **empresa** (default) | Initials, descrição habilitada |
| **coletor** | Initials → ícone sprout, TypeBadge habilitado |

### 3.14 ComplaintStatus (`V467uZ`)

```
fill: #fef9c3 | radius: 999 | gap: 5 | padding: 4 10
- Dot (ellipse) + Label (texto)
```

### 3.15 ComplaintTypeTag (`qeuaX`)

```
fill: #fee2e2 | radius: 999 | gap: 4 | padding: 3 8
- ícone + label
```

### 3.16 ComplaintTypeOption (`G5y1t`)

```
fill: #ffffff | radius: 8 | stroke: #e5e7eb | gap: 8 | padding: 10 14
- ícone + label
- Selecionada: fill lime-800, textos brancos
```

---

## 4. Convenções de Uso no Pencil

### 4.1 Textos em Telas

Textos em telas **não** instanciam masters tipográficos via `ref`. Aplicar propriedades diretamente:

```json
{
  "fontFamily": "$font-heading",
  "fontSize": "$text-h3",
  "fontWeight": "600",
  "fill": "$foreground"
}
```

### 4.2 Componentes

Sempre que um padrão visual existe como master, usar `ref` + `descendants`:

```json
{
  "type": "ref",
  "ref": "hNp9X",
  "name": "Badge secondary",
  "fill": "$gray-100",
  "descendants": {
    "AwdGP": { "content": "Some label", "fill": "$gray-700" }
  }
}
```

### 4.3 Ícones

Usar ícones da `lucide-react-native`. Ícones em botões/locais de destaque usam `$white` ou `$primary` conforme o fundo. Ícones em inputs/chips usam `$gray-400`.

### 4.4 Variantes

Uma instância com `ref` + overrides no `descendants` **é** uma variante. Não criar masters separados por variante. O Showcase documenta todos os overrides válidos.

### 4.5 Hierarquia de Tela

```
Status Bar (ref fxxWe)
  └─ ScrollView / Conteúdo
       ├─ Seções com gap 12-16
       │   ├─ Título da seção: H3/H4
       │   └─ Cards/Badges/Inputs
       └─ ...
TabBar (ref Cp47z)
```

### 4.6 Temas

**Light only.** O tema dark foi removido do documento. Reintrodução futura é aditiva.

---

## 5. Arquivos Relacionados

| Arquivo | Conteúdo |
|---|---|
| `01-epic-brief.md` | Visão geral do épico, problema, escopo |
| `04-tech-plan.md` | Decisões arquiteturais, modelo de dados, inventário |
| `05-tickets.md` | Tickets DS-1 a DS-5 com status e dependências |
| `pencil/oikos-pencil.pen` | Fonte de verdade — todo o design system e telas |
