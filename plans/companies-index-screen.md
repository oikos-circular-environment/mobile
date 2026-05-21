# Plano: companies/index.tsx — Progress e Completion Rate

## Objetivo
Substituir a barra de progresso mockada por `<Progress>` do Gluestack 5 e conectar o percentual ao `completionRate` calculado pelo `UserCompanyContext`.

## Estado atual
- `completionRate` é uma constante local `= 70`
- A barra é um `View` com `style={{ width: "26%" }}` fixo (não reflete o valor real)
- Não há conexão com dados reais da API

## Mudanças necessárias

### 1. Remover progresso mockado
- Remover `const completionRate = 70`
- Remover o bloco de Views manuais da progress bar:
  ```tsx
  <View className="h-2 rounded-full bg-muted overflow-hidden">
    <View className="h-2 rounded-full bg-lime-500" style={{ width: "26%" }} />
  </View>
  ```

### 2. Consumir UserCompanyContext
```tsx
const { completionRate } = useUserCompanyContext();
```

### 3. Usar componente Gluestack Progress
```tsx
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";

<Progress value={completionRate} className="h-2">
  <ProgressFilledTrack className="bg-lime-500" />
</Progress>
```
O `Progress` do Gluestack aceita `value` (0–100) e controla a largura da `ProgressFilledTrack` internamente.

### 4. Texto do percentual
Conectar ao valor dinâmico:
```tsx
<Text className="text-xs">{completionRate}%</Text>
```

## Arquivos a modificar
- `src/app/(tabs)/(home)/companies/index.tsx`

## Dependências
- `UserCompanyContext` deve estar implementado e envolvendo esta tela
