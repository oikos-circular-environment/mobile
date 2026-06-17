# Epic Brief — Design System Oikos

## Resumo

Criar o design system do Oikos dentro do arquivo de design `pencil/oikos-pencil.pen`, estabelecendo a fundação visual da marca antes de qualquer rebrand de telas. A entrega central é a definição tipográfica — Oswald para títulos (hierarquia e impacto) e Space Grotesk para textos (leitura confortável) — formalizada em uma escala completa de 12 estilos com tokens reutilizáveis. O épico também consolida os tokens de cor (corrigindo a divergência da cor primária entre design e código), redesenha os 10 componentes master existentes usando a biblioteca shadcn como referência visual, cria 6 masters essenciais que o app já usa sem definição formal (Badge, Card, Avatar, BottomSheet, Select/Toggle, Skeleton) e aplica o novo sistema nas telas do Market Flow como prova do sistema. O escopo é exclusivamente de design: nenhuma mudança de código faz parte deste épico.

## Contexto & Problema

**Quem é afetado**: o time de desenvolvimento (hoje, principalmente Christian + agentes de IA que geram design e código a partir do Pencil) e, indiretamente, os usuários finais, que percebem um app sem identidade visual coesa.

**Onde no produto**: todo o app mobile (Expo/React Native) e seu arquivo de design `pencil/oikos-pencil.pen` — telas de auth, complaints (mapa, lista, criação) e market.

**A dor atual**:
- A tipografia não está definida em lugar nenhum: o código carrega apenas Oswald 700 e Space Grotesk 400, mas as telas do Pencil usam Inter em quase tudo, e o app aplica fontes ad-hoc (`fontFamily: "Oswald_700Bold"` inline). Não existe escala, nem pesos, nem regras de uso — cada tela inventa sua própria hierarquia.
- Design e código divergem em pontos estruturais: a variável `$primary` do Pencil aponta para green-800 enquanto o código usa lime-800 como cor primária.
- Componentes que o app usa todos os dias (Badge, Card, Avatar, BottomSheet, Select, Skeleton) não têm master no design — cada nova tela os redesenha do zero, gerando inconsistência e retrabalho.
- Sem uma fundação definida, qualquer rebrand de telas (como o redesign do market em andamento) constrói sobre areia: estilos seriam aplicados manualmente e divergiriam de novo.

**Por que agora**: o redesign do fluxo de market expôs o problema — não há fonte de verdade para decidir tamanhos, pesos e variantes. Definir o design system primeiro torna o rebrand das telas uma aplicação mecânica de tokens e componentes, e prepara a futura implementação no código (épico posterior).

## Fora de escopo

- Mudanças de código (tailwind/NativeWind, `_layout.tsx`, `src/components/ui/`)
- Rebrand da paleta de cores (paleta mantida; apenas consolidação de tokens)
- Novo arquivo `.pen` separado (decisão: zona dedicada no arquivo atual, pois refs não cruzam arquivos)
- Rebrand das telas de auth e complaints (épico posterior "Rebrand telas legadas")
- Tema dark (removido do documento de design; app é light-only — reintrodução futura é aditiva)
