# UI/UX

Tudo que é questão de layout, interação e experiência do app fica centralizado aqui. Regra de código puro (lint, teste, arquitetura de dado) continua no `CLAUDE.md`; aqui é onde vive o padrão visual, o padrão de componente e o raciocínio de design por trás deles.

## Padrão de componente e estilo (mandatório)

Regras aplicadas em todo o projeto (também refletidas em `.github/copilot-instructions.md`):

- **Components**: Use `gluestack-ui v5`. Prefer Gluestack primitives over raw React Native ones. All Gluestack wrappers live in `src/components/ui/`.
- **Styling**: Use `NativeWind` (`className` prop). No inline styles unless strictly necessary. Any `className` with conditional logic **must** use `cn` from `@/libs/utils`, never template literals (e.g. `` `base ${cond ? "a" : "b"}` ``). Use `cn("base", cond && "modifier")` or `cn("base", cond ? "a" : "b")`.
- **Theme**: Primary color is `lime-800`. Do not introduce competing primary palettes.
- **Icons**: Use `lucide-react-native` exclusively.
- **Navigation**: Bottom tabs via `@react-navigation/bottom-tabs`. The active tabs are `market`, `(home)`, `complaints` (3 fixed). New screens must integrate without changing this structure.
- **Forms**: All forms must be wrapped in `KeyboardAvoidingView behavior="padding"` combined with `ScrollView`. Use `contentContainerClassName` for padding inside `ScrollView`.

```jsx
<KeyboardAvoidingView behavior="padding" className="flex-1">
  <ScrollView contentContainerClassName="p-4 pb-8">
    {/* form fields */}
  </ScrollView>
</KeyboardAvoidingView>
```

## Cores do Alert (`@/components/ui/alert`)

O componente `Alert` tem `variant` formal pra `warning` e `destructive` (`src/components/ui/alert/index.tsx`). Não usar `className` solto pra cor nesses dois casos, usar a prop:

```tsx
<Alert variant="warning">
  <AlertIcon as={TriangleAlertIcon} />
  <AlertText>Aviso aqui.</AlertText>
</Alert>

<Alert variant="destructive">
  <AlertIcon as={OctagonAlertIcon} />
  <AlertText>Erro aqui.</AlertText>
</Alert>
```

- **warning**: `border-amber-500/50 bg-amber-600/10` (`dark:border-amber-600/50 dark:bg-amber-600/15`), texto/ícone `text-amber-500`. Cor literal, não tem token semântico próprio.
- **destructive**: `border-destructive/30 bg-destructive/10` (`dark:border-destructive/50 dark:bg-destructive/15`), texto/ícone `text-destructive`. Usa o token semântico `--destructive` (`src/app/global.css`), que já tem valor definido pro modo claro e escuro.

`success` e `info` ainda não têm variant formal, continuam ad-hoc por `className` (ex: `sky-50`/`sky-700` pra info, ver instâncias em `complaints/[id]/index.tsx`, `services/index.tsx`, `waste/index.tsx`, `company-detail-simulation-tab.tsx`). Padronizar isso é decisão futura, não foi pedida ainda.

## Interações: affordance visível em vez de gesto escondido

### Contexto

Em setembro de 2026 foi feito teste de usabilidade com usuários reais do app, cobrindo pessoas de formações e níveis de familiaridade com dispositivos móveis bem diferentes entre si. Formação técnica ou nível de escolaridade não previu quem conseguiria ou não descobrir uma interação escondida atrás de gesto.

Dois achados motivaram esta spec:

1. **Botão de login com swipe (slide to unlock) na home.** A maioria dos usuários testados não entendeu que era preciso deslizar. Não identificaram a ação disponível ali.
2. **Swipe em cards para editar ou deletar** (padrão usado em algumas listas, tipo "arraste para o lado e aparece a lixeira"). Mesmo problema: sem indicação visual permanente, o usuário não descobre sozinho.

A correção óbvia seria adicionar uma legenda ou dica explicando o gesto. Isso foi descartado: se a interface precisa de texto de apoio pra explicar como usá-la, o problema não foi resolvido, só empurrado pra carga cognitiva extra (ler, entender, lembrar) em vez de resolvido pelo próprio design.

### Princípio

A interface deve ser **autoevidente**: qualquer ação possível numa tela (entrar, editar, deletar, confirmar, cancelar) precisa ter um controle visível e óbvio (botão, ícone, texto tocável) que a execute, sem depender de o usuário descobrir um gesto por conta própria.

Isso não é sobre achar o usuário incapaz. É sobre reconhecer que o público do app tem bases de conhecimento muito diferentes sobre convenções de interface, e que "todo mundo sabe que dá pra deslizar isso" é uma suposição que o teste já derrubou.

O que isso **não** proíbe:

- Animação não interativa, decorativa, sem exigir ação do usuário para entender a tela (ex: a animação do bonsai na home).
- Gesto como atalho **adicional**, desde que a mesma ação já esteja acessível por toque direto num controle visível. Nesse caso o gesto é bônus pra quem já sabe, não pré-requisito pra quem não sabe.

O que isso recomenda evitar:

- Ação crítica ou destrutiva (deletar, editar, confirmar, logar) que só existe atrás de swipe, drag, long-press ou outro gesto sem equivalente visível na tela.
- Qualquer interação que, pra funcionar, dependa de o usuário ler uma legenda explicando "deslize aqui pra X". Se a explicação é necessária, a interação não é autoevidente.

### Estado atual conhecido

Levantamento feito em 2026-09-11 (pode estar desatualizado, vale reconferir antes de decidir algo com base nele):

- `src/components/ui/swipeable-card.tsx`, usado em `services/index.tsx` e `waste/index.tsx` (listas de serviço/resíduo da empresa), e `src/components/market/company-detail-simulation-tab.tsx` (lista de itens da simulação, via `ReanimatedSwipeable` + `SwipeDeleteAction`): **decisão explícita de manter o swipe-to-delete como está**, não substituir por botão visível. Nesses 3 lugares o texto explicativo que já existia (antes solto como legenda comum) virou um `Alert` (`@/components/ui/alert`, tom `sky-50`/`sky-700`, ícone `InfoIcon`, padrão de card informativo já usado no resto do app) pra ficar mais visível. Isso é uma exceção pontual ao princípio de autoevidência acima, não a regra geral: continua valendo pra qualquer tela nova ou revisão não decidir em contrário. Ver `Alert` em `src/app/(tabs)/(home)/companies/[companyId]/services/index.tsx`, `waste/index.tsx` e `src/components/market/company-detail-simulation-tab.tsx`.
- `src/components/home/login-button.tsx`: já corrigido, swipe removido.
- `src/components/survey/survey-execution-overlay.tsx`: tem pan gesture, mas é só reposicionamento de um overlay flutuante na tela, não bloqueia nenhuma ação atrás de descoberta. Não é caso do mesmo problema.

Isto é um registro de achado e recomendação, não uma lista de tarefas. Decisão de quando e como corrigir cada caso é separada, e vira ticket próprio quando for a hora.

## Pencil design file

The design source of truth is `pencil/oikos-pencil.pen`, read/edit it only through the Pencil MCP tools.

**Document conventions**:
- Screens are named after their expo-router route (e.g. `market/index`, `complaints/(create)/camera`). Screens without an implemented route get the `(proposta)` suffix.
- Each feature lives in a top-level flow frame (`Market Flow`, `Complaints Flow`, `Auth Flow`...). Never leave loose nodes at the document root.
- All master components live inside the `Oikos Design System` frame, named in PascalCase after the React component that implements them (`TabBar`, `FilterChip`, `CompanyCard`).
- Every flow and master component carries a `context` property: purpose + corresponding code path.

**Componentization rules (mandatory when designing)**:
1. Before drawing, list existing components (`batch_get` with `reusable: true`) and reuse them via `ref` instances with overrides, never copy or redraw an existing pattern.
2. Any UI that appears 2+ times (cards, chips, list rows) must first be created as a master component in the Design System, then instanced in screens.
3. Variants (active/inactive, open/closed, collector/company) are instance overrides via `descendants`, not new components.
4. Use the document variables (`$lime-*`, `$gray-*`, `$spacing-*`, `$radius-*`) instead of hardcoded values.
