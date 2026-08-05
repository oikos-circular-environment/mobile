# Oikos Mobile — Diagramas C4 (Deploy)

Diagramas gerados a partir da DSL do Structurizr (`devops/docker/structurizr/data/workspace.dsl`), validados e exportados para Mermaid via o MCP self-hospedado (`structurizr/mcp`, ver `devops/docker/docker-compose.structurizr.yml`). Referem-se ao pipeline descrito em [`publishing-path.md`](./publishing-path.md), `eas.json` e `.eas/workflows/build-and-submit.yml`.

Para regenerar após mudar o pipeline: edite a DSL e rode as tools `validate` e `export-mermaid` do MCP (`http://127.0.0.1:3210/mcp`, viewKeys `MobileContext` e `MobileDeploy`).

## System Context

```mermaid
graph LR
  linkStyle default fill:#ffffff

  subgraph diagram ["System Context View: Oikos Mobile"]
    style diagram fill:#ffffff,stroke:#ffffff

    1["<div style='font-weight: bold'>Desenvolvedor</div><div style='font-size: 70%; margin-top: 0px'>[Person]</div><div style='font-size: 80%; margin-top:10px'>Faz push para a branch<br />production</div>"]
    style 1 fill:#ffffff,stroke:#444444,color:#444444
    3["<div style='font-weight: bold'>Oikos Mobile</div><div style='font-size: 70%; margin-top: 0px'>[Software System]</div><div style='font-size: 80%; margin-top:10px'>App React Native / Expo</div>"]
    style 3 fill:#ffffff,stroke:#444444,color:#444444

    1-. "<div>git push (branch production)</div><div style='font-size: 70%'></div>" .->3

  end
```

## Deployment (EAS Build → Submit → Update)

Pipeline de build, submissão às lojas e distribuição OTA, disparado por push na branch `production`.

```mermaid
graph LR
  linkStyle default fill:#ffffff

  subgraph diagram ["Deployment View: Oikos Mobile - Production"]
    style diagram fill:#ffffff,stroke:#ffffff

    subgraph 13 ["Apple App Store Connect"]
      style 13 fill:#ffffff,stroke:#444444,color:#444444

      14["<div style='font-weight: bold'>App Store Connect</div><div style='font-size: 70%; margin-top: 0px'>[Infrastructure Node]</div><div style='font-size: 80%; margin-top:10px'>ascAppId 6786017565</div>"]
      style 14 fill:#ffffff,stroke:#444444,color:#444444
    end

    subgraph 15 ["Google Play Console"]
      style 15 fill:#ffffff,stroke:#444444,color:#444444

      16["<div style='font-weight: bold'>Play Console</div><div style='font-size: 70%; margin-top: 0px'>[Infrastructure Node]</div><div style='font-size: 80%; margin-top:10px'>track alpha</div>"]
      style 16 fill:#ffffff,stroke:#444444,color:#444444
    end

    subgraph 17 ["Dispositivo do Usuario"]
      style 17 fill:#ffffff,stroke:#444444,color:#444444

      18["<div style='font-weight: bold'>App</div><div style='font-size: 70%; margin-top: 0px'>[Container: React Native / Expo]</div><div style='font-size: 80%; margin-top:10px'>Instalado no dispositivo do<br />usuario</div>"]
      style 18 fill:#ffffff,stroke:#444444,color:#444444
    end

    subgraph 7 ["GitHub"]
      style 7 fill:#ffffff,stroke:#444444,color:#444444

      8["<div style='font-weight: bold'>build-and-submit.yml</div><div style='font-size: 70%; margin-top: 0px'>[Infrastructure Node: EAS Workflow]</div><div style='font-size: 80%; margin-top:10px'>Quality checks + build +<br />submit</div>"]
      style 8 fill:#ffffff,stroke:#444444,color:#444444
    end

    subgraph 9 ["EAS Cloud"]
      style 9 fill:#ffffff,stroke:#444444,color:#444444

      10["<div style='font-weight: bold'>EAS Build</div><div style='font-size: 70%; margin-top: 0px'>[Infrastructure Node]</div><div style='font-size: 80%; margin-top:10px'>Compila .ipa (iOS) e .aab<br />(Android), profile production</div>"]
      style 10 fill:#ffffff,stroke:#444444,color:#444444
      11["<div style='font-weight: bold'>EAS Submit</div><div style='font-size: 70%; margin-top: 0px'>[Infrastructure Node]</div><div style='font-size: 80%; margin-top:10px'>Envia binario para as lojas</div>"]
      style 11 fill:#ffffff,stroke:#444444,color:#444444
      12["<div style='font-weight: bold'>EAS Update</div><div style='font-size: 70%; margin-top: 0px'>[Infrastructure Node]</div><div style='font-size: 80%; margin-top:10px'>Publica atualizacao OTA<br />(channel production)</div>"]
      style 12 fill:#ffffff,stroke:#444444,color:#444444
    end

    8-. "<div>Dispara build (android, ios)</div><div style='font-size: 70%'></div>" .->10
    10-. "<div>Build concluido</div><div style='font-size: 70%'></div>" .->11
    11-. "<div>Submit iOS</div><div style='font-size: 70%'></div>" .->14
    11-. "<div>Submit Android</div><div style='font-size: 70%'></div>" .->16
    10-. "<div>Publica OTA apos build</div><div style='font-size: 70%'></div>" .->12
    12-. "<div>Entrega atualizacao OTA<br />(channel production)</div><div style='font-size: 70%'></div>" .->18

  end
```
