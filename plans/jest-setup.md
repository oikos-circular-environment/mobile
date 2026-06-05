# Jest + RNTL — Plano de Setup de Testes

## Objetivo

Configurar Jest + React Native Testing Library (RNTL v14) no projeto Expo 54 / React 19.
Testes ficam em `src/tests/` sem sujar `src/app/`.
Coverage exclui componentes de terceiros (`src/components/ui/`) e código auto-gerado (`src/libs/oikos-sdk/`).

## Dependências Instaladas

| Pacote | Versão | Por quê |
|---|---|---|
| `jest-expo` | `^54.0.17` | Preset oficial Expo SDK 54; configura transforms, mocks de módulos nativos, env Hermes |
| `@testing-library/react-native` | `^14.0.0` | RNTL v14; suporte a React 19; render/fireEvent/act assíncronos |
| `test-renderer` | `^1.2.0` | Peer dep do RNTL v14; substituto moderno do deprecated `react-test-renderer` |
| `@types/jest` | `^30.0.0` | Types TypeScript |

## Notas Críticas — RNTL v14

- `render()`, `fireEvent.*`, `renderHook()` e `userEvent.*` são **assíncronos** → sempre `await`
- Matchers (`toBeOnTheScreen`, `toBeDisabled`, etc.) são registrados automaticamente ao importar de `@testing-library/react-native` — **não precisa de setupFilesAfterEnv para extend-expect**
- Usar `screen` (não destruturar de `render()`)
- Preferir `userEvent` sobre `fireEvent`; `userEvent.press()` leva mínimo 130ms → usar `jest.useFakeTimers()`
- `findBy*` para elementos assíncronos; `queryBy*` APENAS para verificar ausência
- Docs locais: `node_modules/@testing-library/react-native/docs/`

## Estrutura de Diretórios

```
src/tests/
  setup.ts                    # Configurações globais RNTL
  component/
    sign-in.test.tsx           # 6 cenários
    sign-up.test.tsx           # 7 cenários
  integration/                # Placeholder — testes de integração futuros
```

## Arquivos Criados/Modificados

| Arquivo | Ação | Motivo |
|---|---|---|
| `babel.config.js` | Criado | jest-expo usa Babel para transforms; necessário para `@/*` alias e NativeWind |
| `jest.config.js` | Criado | Preset, testMatch, moduleNameMapper, transformIgnorePatterns, coverage |
| `src/tests/setup.ts` | Criado | Configuração global do RNTL |
| `src/tests/component/sign-in.test.tsx` | Criado | 6 cenários de teste |
| `src/tests/component/sign-up.test.tsx` | Criado | 7 cenários de teste |
| `src/app/(tabs)/(home)/sign-in.tsx` | Modificado | Adicionado `testID="toggle-password"` no InputSlot |
| `src/app/(tabs)/(home)/sign-up.tsx` | Modificado | Adicionado `testID` nos dois InputSlots |
| `package.json` | Modificado | Scripts `test` e `test:coverage` |
| `CLAUDE.md` | Modificado | Referência à documentação local do RNTL |

## Cenários de Teste — SignInScreen

1. Renderiza campos de email e senha com placeholder correto
2. Exibe erro "Digite um e-mail válido." para email inválido ao submeter
3. Exibe erro "A senha precisa ter no mínimo 8 caracteres." para senha curta
4. Chama `signIn` com `{ email, password }` corretos ao submeter form válido
5. Botão desabilitado e spinner visível quando `isLoading: true`
6. Toggle de visibilidade da senha (secureTextEntry true → false)

## Cenários de Teste — SignUpScreen

1. Renderiza os 3 campos: email, senha, confirmar senha
2. Exibe erro para email inválido
3. Exibe erro para senha com menos de 8 caracteres
4. Exibe erro "As senhas não coincidem." quando `confirm_password !== password`
5. Chama `signUp` com dados corretos ao submeter form válido
6. Botão desabilitado e spinner visível quando `isLoading: true`
7. Toggles de senha e confirmar senha funcionam de forma independente

## Mocks Necessários por Teste

| Módulo | Mock | Por quê |
|---|---|---|
| `expo-router` | `useRouter → { back: jest.fn() }`, `Link` → passthrough | Sem navegação real no test env |
| `@/contexts/auth-context` | `useAuthContext` → `{ signIn, signUp, isLoading, ... }` | Isola autenticação |
| `react-native-svg` | `Svg/Rect/Defs/RadialGradient/Stop → View/null` | Header usa SVG para gradiente; native bridge sem device |

## jest.config.js — transformIgnorePatterns

Estende o padrão do `jest-expo` para incluir pacotes ESM adicionais:

```
nativewind | @gluestack-ui | lucide-react-native | @legendapp | @gorhom | tailwind-merge
```

## Coverage

```js
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/components/ui/**',     // Componentes Gluestack (terceiros)
  '!src/libs/oikos-sdk/**',    // SDK auto-gerado do OpenAPI
  '!src/tests/**',             // Próprios arquivos de teste
]
```

## Scripts adicionados ao package.json

```json
"test": "jest",
"test:coverage": "jest --coverage"
```

## Particularidades Descobertas na Implementação

### babel.config.js é necessário neste projeto
A documentação oficial do Expo não menciona babel.config.js como pré-requisito porque assume projetos simples. Neste projeto, o babel.config.js é obrigatório por dois motivos:
1. **`babel-plugin-module-resolver`** — resolve o alias `@/*` no ambiente Jest (o `moduleNameMapper` no jest.config.js complementa, mas o plugin transforma o código)
2. **NativeWind** — `jsxImportSource: 'nativewind'` em `babel-preset-expo` é necessário para processar os estilos CSS-in-JS

### nativewind/jsx-runtime precisa de moduleNameMapper
Sem o mapeamento `'^nativewind/jsx-runtime$': 'react/jsx-runtime'`, o Jest falha com "Cannot find module 'nativewind/jsx-runtime'" porque o `jsxImportSource: 'nativewind'` do babel aplica o transform a TODOS os arquivos (incluindo os da react-native).

### react-native-svg precisa de mock completo
O mock precisa cobrir TODOS os elementos SVG que lucide-react-native usa (Path, Circle, G, etc.) via `Proxy` ou lista explícita, pois o lucide acessa `NativeSvg[tagName]` dinamicamente. Mock parcial → "Element type is invalid: undefined".

### InputSlot é accessibilityElementsHidden
Gluestack v5's `InputSlot` define `accessibilityElementsHidden={true}` internamente. Queries por `testID` requerem `{ includeHiddenElements: true }`. Esta é a razão para usar `testID` + `includeHiddenElements` nos testes de toggle de senha.

### Accessible name do Button muda com isLoading
Quando `isLoading: true`, o `ButtonSpinner` (ActivityIndicator com `aria-label="loading"`) é adicionado como filho do Button. O RNTL computa o nome acessível concatenando texto dos filhos + aria-labels, resultando em "Entrar loading". Usar `{ name: /Entrar/i }` (regex) em vez de `{ name: 'Entrar' }` (exato).

### Spinner: role progressbar não existe
`ActivityIndicator` do React Native não tem `role="progressbar"`. O ButtonSpinner do Gluestack adiciona `aria-label="loading"`. Usar `getByLabelText('loading')` para verificar o spinner.
