# Oikos

## Desenvolvimento

A api local (`localhost:3333`) fica acessível via túnel Cloudflare em `local.oikos.company` — é o valor padrão de `EXPO_PUBLIC_BASE_URL` no `.env` e no ambiente `development` do EAS. Pra subir o túnel:

```
npm run tunnel
```

Requer `cloudflared` instalado e autenticado (`cloudflared tunnel login`) com acesso à zona `oikos.company`. O túnel (`oikos-local-dev`) e o registro DNS já existem na Cloudflare — esse comando só conecta.

## Observações

### iOS
- Para compilar para iOS, é necessário ter um MacOS com Xcode instalado. Ou utilizando serviços de virtualização como o Expo Application Services (EAS) Build. No entanto é necessário pagar 550 reais por ano para publicar na App Store.
