# Metadados — App Store Connect (Distribuição › App para iOS v1.0)

> **Este documento é histórico.** A fonte de verdade dos metadados passou a ser
> `store.config.js`, publicado por `eas metadata:push` (ver
> [`publishing-path.md`](./publishing-path.md#publicação-na-app-store)).
> Editar aqui não altera a ficha na App Store.
>
> Idioma da ficha: Português (Brasil).

---

## Texto promocional (170 caracteres)

```
Denuncie ocorrências ambientais com foto e localização, vote com a comunidade e encontre empresas de reciclagem perto de você.
```

## Descrição (4.000 caracteres)

```
Oikos é uma plataforma de economia circular que conecta pessoas, comunidades e empresas na proteção do meio ambiente.

DENÚNCIE OCORRÊNCIAS AMBIENTAIS
Encontrou descarte irregular de resíduos, poluição ou outro problema ambiental na sua região? Registre a ocorrência em segundos: tire fotos ou grave vídeos, marque a localização exata no mapa e descreva o problema. Sua denúncia fica visível para toda a comunidade.

ACOMPANHE E VOTE COM A COMUNIDADE
Veja no mapa as denúncias já registradas perto de você, acompanhe o status de cada uma (em aberto, em resolução, resolvida) e vote se um problema já foi solucionado. O sistema de votação da comunidade garante que o encerramento de uma denúncia reflita o consenso de quem vive na região.

ENCONTRE EMPRESAS DE RECICLAGEM E COLETA
Busque empresas parceiras por proximidade e descubra quais materiais e serviços cada uma aceita ou oferece — de recicláveis comuns a resíduos que exigem cuidados especiais, classificados conforme o grau de periculosidade (ABNT NBR 10004). Consulte endereço, horário de funcionamento e formas de contato direto (telefone e WhatsApp).

SIMULE VALORES ANTES DE NEGOCIAR
Monte uma simulação com os itens e quantidades que você quer descartar ou vender e veja o valor estimado antes de fechar negócio com uma empresa parceira.

Junte-se à Oikos e ajude a construir uma economia mais circular e um ambiente mais limpo para todos.
```

## Palavras-chave (100 caracteres)

```
reciclagem,economia circular,meio ambiente,denuncia,sustentabilidade,coleta,residuos,ecologia
```

## URL de suporte

`https://oikos.company/suporte`

## URL de marketing

Deixar em branco (campo opcional).

## Copyright

`2026 Christian Cesar Rodrigues Santos`

A Apple espera o formato "ano + titular". O CNPJ `61.892.896/0001-55` não entra
neste campo.

---

## Informações para a equipe de revisão dos apps

### Início de sessão

A conta de teste da revisão (`apple@oikos.company`) já existe. As credenciais
vivem nas variáveis `ASC_DEMO_ACCOUNT_NAME` e `ASC_DEMO_ACCOUNT_PASSWORD` do
ambiente `production` do EAS, lidas por `store.config.js` — nunca versionadas.

### Notas

```
O app não exige login para navegar no mapa de denúncias e no marketplace de empresas de reciclagem (Market). O login é obrigatório apenas para: registrar uma nova denúncia, votar na resolução de uma denúncia e publicar uma resolução.

Uma conta de teste com acesso completo será fornecida nos campos "Nome do usuário" e "Senha" acima.

Para testar o fluxo completo, é necessário conceder permissão de localização (usada para marcar a ocorrência no mapa) e de câmera/microfone (usada para anexar fotos e vídeos à denúncia).
```

### Informações de contato

| Campo | Valor |
|---|---|
| Nome | Christian |
| Sobrenome | Cesar Rodrigues Santos |
| E-mail | suporte@oikos.company |
| Telefone | +55 65 99915-1997 |

---

## Pendências antes de enviar para revisão

Todas resolvidas. Os valores finais vivem em `store.config.js` e em
`store/shared/contact.json`; o que ainda não foi publicado na loja está listado
em [`publishing-path.md`](./publishing-path.md#pendências).

- [x] URL de suporte — `https://oikos.company/suporte`
- [x] Copyright — `2026 Christian Cesar Rodrigues Santos`
- [x] Telefone de contato — cadastrado na App Store Connect
- [x] E-mail de contato — `suporte@oikos.company`
- [x] Conta de teste para a revisão — nas variáveis `ASC_DEMO_ACCOUNT_*` do
      ambiente `production` do EAS, nunca versionadas
