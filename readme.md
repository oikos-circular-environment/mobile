# Oikos

Oikos é uma plataforma digital voltada para fortalecer a economia circular no Brasil, conectando atores da cadeia de resíduos (geradores, coletores, cooperativas, recicladores, empresas e setor público) para facilitar o reaproveitamento de materiais, reduzir descarte inadequado e gerar impacto ambiental e social positivo.

Este projeto nasce da combinação de duas frentes:
- Estratégia de negócio e validação de mercado (Business Model Readiness Level - BRL).
- Estruturação de produto e engenharia de software (Laboratório de Engenharia de Software).

## Objetivo do Projeto

Desenvolver e validar uma solução tecnológica escalável para o ecossistema de resíduos, com foco em:
- Aumentar a taxa de reciclagem e reaproveitamento.
- Melhorar a conexão entre oferta e demanda de resíduos.
- Apoiar decisões com dados de mercado e operação.
- Viabilizar um modelo sustentável economicamente, ambientalmente e socialmente.

## Contexto

O projeto considera um cenário nacional com grande potencial de melhoria na gestão de resíduos e na reciclagem, incluindo:
- Baixa taxa geral de reciclagem de RSU frente ao potencial do mercado.
- Perdas econômicas significativas com materiais recicláveis descartados inadequadamente.
- Oportunidades de integração entre empresas, cooperativas, governo e sociedade civil.

## Principais Focos

1. Evolução de maturidade do modelo de negócio (BRL)
- Avançar do nível BRL 3 para BRL 4, com projeções simplificadas de receita/custos e avaliação inicial de viabilidade.
- Evoluir para BRL 5 com validação por feedback de mercado (clientes, especialistas e parceiros).

2. Validação econômica e operacional
- Definir fluxos de receita prioritários (assinaturas, implantação, campanhas e possibilidades futuras de API de dados/patrocínios).
- Estimar custos de operação e infraestrutura, priorizando eficiência e uso estratégico de camadas gratuitas no início do projeto.
- Construir cenários (otimista, realista e pessimista) para orientar decisões de crescimento.

3. Impacto ambiental e social mensurável
- Reduzir desperdício e aumentar reaproveitamento de resíduos.
- Incentivar práticas de economia circular e logística mais eficiente.
- Gerar oportunidades de renda e inclusão para atores da cadeia de reciclagem.
- Mitigar riscos de privacidade, segurança de dados, exclusão digital e impactos logísticos.

4. Inteligência de mercado
- Consolidar análises de TAM, SAM e segmentos prioritários.
- Mapear comportamento de geração de resíduos, taxas de reciclagem e referências de preço por material.
- Acompanhar concorrência e benchmarks para refinar posicionamento.

5. Engenharia de software orientada a produto
- Traduzir hipóteses de negócio em funcionalidades testáveis.
- Aplicar artefatos de descoberta e produto (busca de anterioridade, perfil de clientes, diagrama de empatia e matriz de posicionamento).
- Evoluir o sistema com qualidade técnica e foco em entrega contínua.

## Escopo Funcional (visão macro)

- Marketplace de resíduos para conectar geradores e compradores/receptores.
- Funcionalidades de apoio à operação (ex.: gestão de rotas, campanhas e módulos específicos por perfil).
- Mapeamento e visualização de dados para suporte à tomada de decisão.
- Camadas de relacionamento com usuários (suporte, comunicação e educação ambiental).

## Estrutura do Repositório

Este projeto está organizado em dois principais módulos:
- api/: backend da plataforma, com foco em regras de negócio, persistência e serviços.
- rn/: aplicativo mobile (React Native/Expo) para experiência dos usuários em campo.

## Monorepo com npm Workspaces

Este repositório está configurado como monorepo com npm workspaces para facilitar o compartilhamento de código entre backend e frontend.

### Workspaces atuais

- `@oikos/api`: backend.
- `@oikos/rn`: app mobile.
- `@oikos/contracts`: pacote compartilhado para contratos/tipos.

### Estrutura

```txt
oikos/
	api/
	rn/
	packages/
		contracts/
```

### Comandos úteis (na raiz)

```bash
npm install
npm run dev:api
npm run dev:rn
npm run build:api
```

### Por que essa estrutura ajuda

- Permite criar pacotes internos simples para reaproveitamento imediato.
- Evita duplicação de tipos, validações e contratos entre API e app.
- Facilita evolução gradual, mesmo com um único desenvolvedor.

### Caso de uso futuro: tRPC + TanStack Query

Uma evolução natural é criar um pacote dedicado para contratos/roteador tRPC e compartilhar tipagem ponta a ponta:
- Backend expõe roteadores tRPC fortemente tipados.
- Frontend consome os endpoints com TanStack Query usando os mesmos tipos.
- Reduz erro de integração e acelera manutenção.

Com a base de workspaces pronta, basta adicionar novos pacotes em `packages/*` e referenciá-los pela versão do pacote (ex.: `0.1.0`) nas dependências dos apps para que o npm faça o link local no monorepo.

## Direção do Projeto

Oikos combina tecnologia, validação de mercado e impacto socioambiental para construir uma solução viável no longo prazo. O foco atual está em consolidar a proposta de valor, validar o modelo de negócio com dados reais e transformar os aprendizados em produto robusto e escalável.
