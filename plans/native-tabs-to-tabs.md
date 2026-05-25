# Migração: NativeTabs → Tabs (expo-router)

## Problema
`NativeTabs` de `expo-router/unstable-native-tabs` com `disableAutomaticContentInsets` causa
conteúdo ficando atrás do tab bar no Android. A API é `unstable_` e tem gaps conhecidos de insets no Android.

## Solução
Converter para `Tabs` de `expo-router` (wrapper de `@react-navigation/bottom-tabs`), que é estável
e gerencia `SafeAreaInsets` corretamente nas duas plataformas.

## Arquivo alterado
`src/app/(tabs)/_layout.tsx` — único arquivo com dependência de `NativeTabs`.

## Mudanças
- Remover: `expo-router/unstable-native-tabs` (NativeTabs, Icon, Label, VectorIcon)
- Remover: `@expo/vector-icons/Ionicons`
- Adicionar: `Tabs` de `expo-router`
- Adicionar: ícones de `lucide-react-native` (MapPin, Leaf, Shield)
- `learn` → `href: null` para ocultar da tab bar
- `tabBarActiveTintColor: '#3d6300'` substituindo `tintColor`
- `headerShown: false` em `screenOptions` (cada aba já tem Stack próprio)

## Sem risco
- Todos os layouts filhos usam `Stack` puro, sem dependência do tab navigator
- `TabBarProvider` não é usado em nenhum componente (dead code)
- Root layout exclui bottom edge do SafeAreaView — Tabs assume automaticamente
