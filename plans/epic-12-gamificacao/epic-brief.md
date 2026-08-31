# Gamificação — Score e Medalhas

Status: **ideia / briefing de produto**. Extraído do epic-11-market-evolutivo.
Depende de: epic-11-market-evolutivo (fases 1-4: mapa, sugestão+voto, reivindicação, avaliação).
Data: 2026-08-29.

## Tese

A interação da comunidade que **melhora o catálogo** deve ser reconhecida. Gamificação é consequência, não requisito — o catálogo comunitário precisa existir sem ela.

Princípio: interação que **melhora o catálogo** pontua; vanity não.

## Candidatos a score

Decidir pesos antes de desenhar medalha:

| Ação | Peso sugerido | Notas |
|---|---|---|
| Sugerir dado que depois é aceito (voto ou dono) | Médio | Contribuiu com informação útil |
| Votar em sugestão que vira consenso | Baixo | Reforço de qualidade coletiva |
| Avaliar ponto (com cooldown / um voto por ficha) | Baixo | Sinal de qualidade, não de existência |
| Apontar ponto novo que passa em filtro anti-spam | Alto | Expandiu o catálogo |
| Claim aprovado (evento raro) | Muito alto | Reivindicação verificada com documento |

### O que NÃO pontua

- Abrir detalhe de uma ficha
- Filtrar / buscar
- Cadastrar empresa (já tem o selo como reconhecimento)
- Ação repetida sem contribuição nova (anti-farming)

## Funcionalidades

### v1 (mínimo viável)

- **Sistema de pontos**: score acumulado por usuário, persistido no backend
- **Feed de atividade**: mostra últimas ações pontuadas (quem, o quê, quando)
- **Perfil com score**: exibição no perfil do usuário (número + nível/título)

### v2 (extensão)

- **Medalhas / conquistas**: visuais, desbloqueadas por marcos específicos
- **Leaderboard**: ranking público ou por comunidade/cidade
- **Notificações**: "Você ganhou 50 pontos por sugerir um dado aceito"

## Design de medalhas (direção)

| Medalha | Condição | Raridade |
|---|---|---|
| Primeiro Passo | Primeira sugestão aceita | Comum |
| Guardião do Catálogo | 10 validações de existência | Incomum |
| Fundador | Apontar 5 pontos novos aceitos | Raro |
| Reivindicador | Claim aprovado | Muito raro |
| Curador | 20 sugestões aceitas consecutivas | Épico |

## Riscos / decisões em aberto

1. **Anti-farming**: cooldowns por ação, limite diário de pontos, ou detecção de padrão?
2. **Leaderboard público vs. privado**: leaderboard público pode desincentivar quem está atrás; privado pode matar a competição saudável.
3. **Decaimento de pontos**: pontos expiram após X meses? Senão, qualquer um que usou no início fica no topo para sempre.
4. **Integração com UI existente**: onde mostrar score? Perfil, detalhe da ficha, ambos?
5. ** Medalha vs. numérico**: gamificação visual (medalhas, badges) ou puramente numérico (score + nível)?
6. **Backend necessária**: nova tabela `user_scores`, `score_events`, `achievements`? Ou extensão de `User`?

## Referências

- Google Local Guide: pontos + níveis + medalhas por contribuição
- Waze: scoreboard + comportamentos reconhecidos
- Stack Overflow: reputation + badges como modelo de confiança

## Fora de escopo deste briefing

- Implementação, tickets, OpenAPI.
- Moderação de abuso do sistema de gamificação (necessário depois da v1).
- Integração com monetização ou benefícios materiais.
