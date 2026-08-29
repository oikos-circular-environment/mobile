# Market evolutivo — catálogo na mão da comunidade

Status: **ideia / briefing de produto**. Ainda não é epic nem tech plan.
Repos: `mobile` (listagem/detalhe em `src/app/(tabs)/market`) + `api` (hoje o Places só vive no CLI de seed).
Data: 2026-08-29.

## Tese

O Market hoje só existe se a empresa se cadastrar. Isso é o caminho certo para quem quer **controle** (horário, preço, resíduo, serviço), mas deixa o mapa vazio enquanto o cadastro não acontece.

A evolução é o modelo do Google Places: o ponto **existe** porque a comunidade (e o Google) apontam que ele existe. O dono **pode** reivindicar depois. Cadastro próprio continua sendo o padrão ouro — não some.

## O que já existe (ancoragem)

- Listagem pública: `GET /v1/market` (`lat`/`lon`/`radius`/`q`/`category`) — só empresas persistidas no Prisma.
- Detalhe no app: `src/app/(tabs)/market/[companyId].tsx` + abas geral/simulação.
- Cadastro completo (dono): hub em `src/app/(tabs)/(home)/companies/[companyId]/` (dados, endereço, horário, resíduos, serviços) + `CompanyValidation`.
- `Company` no Prisma **sempre** tem `user_id`, `identity` único (CPF/CNPJ) e `organization_id`. Não há `google_place_id` nem origem comunitária.
- Seed já mistura Places + sintéticos (`api/cli/`, `api/docs/seed-cli.md`) e guarda `google_place_id` só no JSON de seed — **não** no backend de produção.

O gap não é falta de Places: é o Places não alimentar o Market, e o modelo de empresa não admitir ficha sem dono.

## Direção de produto

### Visão principal: mapa (não lista)

A tela principal do Market é um **mapa interativo** (mesma base do fluxo de denúncias), com pins coloridos por origem e categoria. A listagem existe como alternativa (toggle), mas o mapa é o padrão.

**Por que mapa:**
- O usuário busca ponto de coleta **perto de si** — raio geográfico é o filtro mais importante.
- Mapa comunica densidade (áreas sem cobertura vs. áreas bem servidas).
- Pins com selo visual diferenciam cadastradas de comunitárias num relance.

**Filtros evoluídos (a partir da v1 com mapa):**

| Filtro | Opções | Default |
|---|---|---|
| Origem | Cadastradas / Comunidade / Todas | Todas |
| Categoria de resíduo | Multi-select de `WasteCategory` | Todas |
| Raio | 1km / 3km / 5km / 10km / cidade toda | 3km |
| Status | Aberta / Avaliação pendente / Arquivada | Aberta |
| Busca textual | Nome, endereço, bairro | vazio |

A busca textual **sugere** enquanto digita (debounce 300ms) e cai num bottom sheet com resultados, sem sair do mapa.

### Foco inicial: reciclagem

O Market nasce focado em **empresas de reciclagem** — o contexto delas, não a economia circular como um todo. Isso significa:

- **Entrada primária**: categorias de resíduo (`WasteCategory`) já existentes no sistema.
- **Exclusão temporária**: fornecedores de resíduo, catadores autônomos, cooperativas de outros ramos entram depois (fase 2+).
- **Razão**: validar o modelo com um recorte claro. Se o mapa funciona para reciclagem, expandir para outros ramos é questão de taxonomy, não de produto.

### Duas origens, uma lista

| Origem | Quem edita | Confiança | Ordem padrão |
|---|---|---|---|
| **Cadastrada** (dono no app) | Só o responsável (fluxo atual) | Selo visível | Primeiro |
| **Comunidade** (Places e/ou sugestão cidadã) | Ninguém "manda"; só sugerir + votar | Sem selo | Depois |

O cadastro de empresa **não muda de papel**: continua o padrão de toda empresa reivindicada. O que muda é o **antes** — a ficha já pode existir.

## Dois tipos de ficha (não dois produtos)

### Cadastrada (`claimed` / selo)

- Dono autenticado, CNPJ/CPF, organization, validações atuais.
- Dados oficiais: horário, endereço, telefone, resíduos, serviços.
- Aparece no Market com selo (nome de UI ainda aberto; ver vocabulário).
- Simulação de preço/resíduo só faz sentido de verdade aqui — na comunitária o dado é hipótese votada.

### Comunidade (`unclaimed`)

- Sem dono. Pode nascer do Google Places (ingest no backend) ou, mais tarde, de um cidadão apontando um ponto que o Google não trouxe.
- Usuário **não edita** o registro. Só **sugere** e **vota** em sugestões.
- Horário pode vir pré-preenchido do Places quando existir; o resto (resíduo, serviço, CNPJ) costuma vir vazio até a comunidade preencher.
- Campos públicos com autor visível: quem sugeriu aparece no nome/apelido. Objetivo: frear vandalismo por exposição social, não por anonimato.

Campos cobertos pela mesma lógica de sugestão+voto: **horário, endereço, telefone, resíduo, serviço** (e o que mais for público na ficha). Nome comercial também, se o Places vier genérico (“reciclagem”, “ferro-velho”).

## Reivindicar Propriedade do Negócio

Botão no detalhe da ficha comunitária, no espírito do Google: **“Você é o responsável por este ponto?”** (preferido) ou “Você é o proprietário desta empresa?”.

### Documentos necessários para comprovação

O dossiê deve conter os seguintes documentos, todos obrigatórios:

**Dados do usuário (PF):**
- CPF do responsável (já vinculado ao usuário no sistema)
- Documento de identidade com foto (RG, CNH ou equivalente) — ambos os lados
- Comprovante de residência atualizado (até 90 dias) no endereço do negócio OU documento que comprove vínculo com o endereço

**Dados do negócio (PJ):**
- CNPJ ativo na Receita Federal
- Cartão CNPJ (CND) atualizado ou Certificado de Regularidade do FGTS (CRF)
- Contrato social ou documento de constituição da empresa (última alteração)
- Alvará de funcionamento municipal (quando aplicável)
- Comprovante de vínculo entre o CPF do responsável e o CNPJ: procuração, contrato de trabalho, ou declaração de sócio/diretor

**Documento de endereço (cobertura do local):**
- Conta de serviços públicos (água, luz, gás, telefone) no nome do titular OU do CPF vinculado, com endereço compatível com o cadastro
- Alternativa: certidão negativa de débitos municipais do imóvel

### Fluxo de reivindicação

1. Usuário logado inicia o pedido de reivindicação.
2. Sistema trava concorrência: **um claim pendente por ficha**; segundo pedido entra em fila de espera (FIFO) ou é recusado até o primeiro resolver.
3. Upload dos documentos via endpoint seguro (multipart, criptografia em trânsito, armazenamento temporário com TTL de 30 dias).
4. Criação de um registro na tabela `ownership_claims` com status `pending` e snapshot dos dados enviados.
5. **Revisão humana na v1**: operador interno avalia dossiê e aprova/rejeita. Automação (consulta Receita, matching de Place + CNPJ) é fase posterior.
6. Aprovação **promove** a ficha: mesma entidade, origem vira `claimed`, selo aparece, dono passa a editar pelo hub atual. Sugestões comunitárias abertas ou são aplicadas pelo dono ou arquivadas — não ficam competindo com o dado oficial.
7. Rejeição: ficha continua comunitária; o usuário pode tentar de novo com outro dossiê (mínimo 7 dias entre tentativas).

### Riscos explícitos

Alguém usa a ficha da comunidade e diz que a empresa é dele. Sem documento + revisão, o claim é só um takeover. Por isso claim **não** é self-serve na v1.

## Places no backend (não no seed)

Mover o que o CLI já faz (`GooglePlacesProvider`, text search de reciclagem por cidade) para um job/serviço da API:

- Ingest periódico por bbox/cidade (não a cada `GET /v1/market` — custo e ToS).
- Deduplicar com cadastradas: `google_place_id` único; fallback geo+nome; se o dono cadastrar um CNPJ cujo endereço casa com um Place, **fundir** (não duplicar pin).
- Respeitar [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies): cache, attribution, o que pode persistir. Isso é restrição de produto, não detalhe de implementação.
- A lista do Market **mescla** cadastradas + comunitárias no mesmo contrato (`GET /v1/market`), com campo de origem + selo.

Seed CLI continua para testes; produção não depende de `npm run cli`.

## Avaliação do lugar e validação comunitária

A comunidade interage com as fichas em três eixos distintos, cada um com impacto diferente no catálogo:

### 1. Avaliação de utilidade (alimenta o score)

O cidadão indica se o ponto **é útil** ou **não é útil** para quem busca reciclagem. É uma avaliação subjetiva de qualidade: funcionando bem, atende bem, vale a pena ir.

- Cooldown: um voto por ficha por usuário (pode alterar depois).
- Acumula pontuação no sistema de gamificação (fase posterior).
- **Não** remove ficha do catálogo — é sinal de qualidade, não de existência.

### 2. Validação de existência (pode arquivar ficha)

O cidadão vota se o ponto **existe de fato** ou **não existe mais** (fechou, demoliu, nunca existiu). É uma validação objetiva de realidade.

- Voto majoritário com quórum mínimo (ex.: 3 votos de "não existe" de usuários distintos em 30 dias).
- Quando atingido, a ficha comunitária é **arquivada** (não aparece mais na listagem padrão; acessível via filtro "arquivadas").
- Ficha **cadastrada** (com dono) não é arquivada automaticamente — o dono pode desafiar.
- Registro completo do voto (usuário, timestamp, justificativa textual opcional) para auditoria.

### 3. Categorização: é reciclagem ou não? (não é avaliação)

A questão "este ponto é de reciclagem?" **não é uma avaliação de lugar** — é uma **categorização do negócio**. O Market quer empresas de reciclagem E empresas que não são de reciclagem (fornecedores de resíduo, catadores, cooperativas de outro ramo).

- Se o ponto **é reciclagem**: já está na categoria correta (WasteCategory).
- Se o ponto **não é reciclagem**: precisa de uma categoria própria (ex.: "fornecedor de resíduo", "comércio geral", "ponto de coleta informal"). Não é motivo de remoção — é motivo de **recategorização**.
- A categorização comunitária funciona por sugestão + voto (mesmo fluxo de "sugestão de dado"), não por avaliação de utilidade.
- Critério de exclusão do Market: o ponto não existe, ou o ramo do negócio é totalmente alheio ao ecosistema de resíduo (ex.: padaria sem vínculo com reciclagem). Mesmo assim, a exclusão é apenas da listagem padrão — filtro "todas" pode revelar.

### Resumo dos eixos

| Eixo | Tipo | Impacto | Alimenta |
|---|---|---|---|
| Utilidade | Subjetivo | Score/gamificação | Ranking secundário |
| Existência | Objetivo | Arquivamento da ficha | Higiene do catálogo |
| Categorização | Objetivo | Reclassifica o ramo | Taxonomia (não é remoção) |

## Gamificação (fase posterior)

Não entra no primeiro corte. Princípio: interação que **melhora o catálogo** pontua; vanity não.

Candidatos a score (decidir antes de desenhar medalha):

- Sugerir dado que depois é aceito (voto ou dono).
- Votar em sugestão que vira consenso.
- Avaliar ponto (com cooldown / um voto por ficha).
- Apontar ponto novo que passa em filtro anti-spam.
- Claim aprovado (evento raro, peso alto).
- **Não** pontuar: abrir detalhe, filtrar, só cadastrar empresa (já tem o selo).

Medalha/score é consequência; o catálogo comunitário precisa existir sem ela.

## Vocabulário sugerido (UI)

| Conceito | Evitar | Usar |
|---|---|---|
| Origem cadastrada | “oficial Google” | **Cadastrada** + selo (ex. “Verificada” / “No Oikos”) |
| Origem Places/comunidade | “fake”, “não verificada” (soa punitivo) | **Da comunidade** ou **Ainda sem responsável** |
| Reivindicação | “paternidade”, “claim” na UI | **Reivindicar Propriedade do Negócio** / **Você é o responsável por este ponto?** |
| Sugestão | “editar” (implica write direto) | **Sugerir correção** |

## Fora de escopo deste briefing

- Implementação, tickets, OpenAPI.
- Preço na ficha comunitária como verdade (só sugestão votada, com disclaimer).
- Moderação automática de texto (necessário depois; v1 pode ser denúncia + fila).
- Gamificação e medalhas.
- Expansão para ramos além de reciclagem (fornecedores, catadores, cooperativas de outros segmentos).

## Riscos / decisões em aberto

1. **Schema**: `Company.user_id` e `identity` obrigatórios quebram ficha sem dono. Ou a entidade de listagem deixa de ser `Company` “cheia”, ou esses campos ficam opcionais + `provenance`. Decisão de API, não de tela.
2. **ToS e custo Google**: ingest vs. proxy live; attribution na ficha comunitária.
3. **Dedup**: dois pins (cadastro + Place) é pior que mapa vazio.
4. **Revisão de propriedade**: quem é o revisor (ops interno vs. papel na app); SLA; retenção/purge de documento com foto; o BullMQ não substitui a tabela de eventos.
   - **Fila `ownership-claim-review` (BullMQ + Redis)**: job assíncrono que processa a revisão do dossiê. Cada transição de status (`pending` -> `under_review` -> `approved` / `rejected`) é registrada com timestamp, actor_id e motivo. A fila expõe métricas (throughput, tempo médio de revisão, fila de espera) via endpoint de observabilidade. Dados do documento só permanecem armazenados enquanto o claim estiver ativo; após conclusão, só o hash e o status são retidos para auditoria.
5. **Autor visível**: LGPD / perfil público mínimo (nome de exibição, não e-mail).
6. **Simulação** no detalhe comunitário: esconder ou marcar como estimado.
7. **Cidadão cria ponto** sem passar pelo Google: fase 2, senão o mapa vira spam no dia 1.
8. **Resíduo/serviço comunitário**: taxonomia já existe (`WasteCategory`); sugestão deve escolher categoria do catálogo, não texto livre solto.
9. **Mapa vs. performance**: mapa com muitos pins pode causar lag em devices mais fracos. Solução: clustering (agrupar pins em zoom baixo), lazy loading por viewport, e limite de pins visíveis (ex.: 200 por viewport). Referência: o fluxo de denúncias já resolve isso com `react-native-maps` + clustering.

## Fases (quando virar epic)

1. **Mapa + modelo + ingest**: tela de mapa interativo (pins por origem/categoria), filtros evoluídos (origem, categoria, raio, status, busca), ingest de Places no backend, `google_place_id`, mescla no `GET /v1/market`, selo e ordenação, detalhe read-only comunitário. Foco em empresas de reciclagem.
2. **Sugestão + voto** nos campos públicos, autor visível.
3. **Reivindicar propriedade do negócio**: dossiê completo (CPF + RG/CNH + comprovante de residência + CNPJ + contrato social + comprovante de vínculo + conta de serviço) + fila BullMQ (`ownership-claim-review`) + auditoria no Postgres (tabela `ownership_claims` com log de estados) + promoção da ficha.
4. **Avaliação do lugar + validação de existência**: utilidade (score), votação de existência (arquivamento), categorização comunitária (reciclagem vs. fornecedor de resíduo).
5. **Score/medalhas**, depois de listar o que pontua.

Cross-repo obrigatório: mobile só consome; a verdade mora na API.
