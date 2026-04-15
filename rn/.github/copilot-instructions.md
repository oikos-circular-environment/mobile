# Instrucoes de Producao do Projeto (Copilot)

Estas instrucoes definem o padrao tecnico obrigatorio para novas implementacoes e refatoracoes neste projeto.

## Stack e UI

- Utilize `gluestack-ui v5` como biblioteca principal de componentes.
- Utilize `NativeWind` para a construcao dos estilos (`className` como padrao).
- Utilize fontes nativas para evitar problemas de compatibilidade entre dispositivos.
- Priorize componentes do gluestack antes de primitives do React Native.
- Evite estilos inline, exceto quando for estritamente necessario e com justificativa no PR.

## Tema

- Utilize o tema padrao do gluestack como base.
- A paleta principal da aplicacao deve ser `lime`.
- A cor primaria obrigatoria e `lime-800`.
- Nao introduza paletas concorrentes como primaria sem aprovacao explicita.

## Icones

- Utilize sempre `lucide-react-native` para icones.
- Nao utilizar bibliotecas alternativas de icones sem alinhamento previo.

## Navegacao

- Utilize sempre `@react-navigation/bottom-tabs` para a navegacao principal da aplicacao.
- A navegacao principal e dividida em 5 acoes fixas:
  - `market`
  - `complaints`
  - `home`
  - `donations`
  - `learn`
- Novas telas devem se integrar a esse fluxo sem quebrar a estrutura principal de 5 acoes.

## Formularios

- **KeyboardAvoidingView obrigatório**: Todo componente com formulário (inputs, textarea, etc) deve estar envolvido em `KeyboardAvoidingView` para evitar que o teclado virtual cubra os campos.
- Padrão de uso:
  ```jsx
  <KeyboardAvoidingView behavior="padding" className="flex-1">
    <ScrollView contentContainerClassName="p-4 pb-8">
      {/* Formulário aqui */}
    </ScrollView>
  </KeyboardAvoidingView>
  ```
- O `behavior="padding"` é o padrão recomendado para iOS. Para Android, ele é ignorado.
- Sempre combine com `ScrollView` para permitir scroll quando necessário.
- Use `contentContainerClassName` para padding em vez de container externo.

## Regras para contribuicoes

- Toda alteracao de UI deve respeitar estes padroes.
- Em caso de divergencia do estado atual do codigo, proponha migracao incremental antes de mistura de padroes.
- Evite introduzir dependencias que conflitem com gluestack v5, NativeWind, lucide-react-native ou React Navigation tabs.

## Checklist rapido

Antes de concluir uma entrega, valide:

1. Componentes em gluestack v5.
2. Estilos com NativeWind.
3. Fontes nativas para compatibilidade com devices.
4. Tema principal lime com primary `lime-800`.
5. Icones via lucide-react-native.
6. Navegacao principal com @react-navigation/bottom-tabs e 5 acoes.
