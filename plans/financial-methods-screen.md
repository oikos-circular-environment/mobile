# Plano: companies/financial-methods.tsx — Métodos Financeiros

## Objetivo
Documentar o estado atual da tela e a decisão de não conectá-la à API neste momento.

## Análise do estado atual
- Form com `react-hook-form` + `FinancialMethodsFormValues`
- `defaultValues` populados com dados mockados de `companyFinancial` (de `@/libs/types/financial-method`)
- `onSubmit` apenas faz `console.log`
- Usa sub-componentes `<PaymentsTab>` e `<ReceiptsTab>`

## Análise do SDK
**Não existe endpoint de métodos financeiros no SDK gerado** (`src/libs/oikos-sdk/index.ts`).

## Decisão
- **Nenhuma alteração necessária nesta tela por ora**
- O arquivo `src/libs/types/financial-method.ts` permanece com dados mock
- A tela continua funcional com dados locais até que o backend exponha um endpoint

## Quando implementar
Quando o endpoint `/v1/companies/financial-methods` (ou equivalente) for adicionado ao backend e o SDK for regenerado via `npm run generate:api`, criar:
- `queryKey: ['company', 'financial-methods']` no `UserCompanyContext`
- Mutation `saveFinancialMethods` no contexto
- Conectar esta tela ao contexto

## Arquivos a modificar
- Nenhum no momento
