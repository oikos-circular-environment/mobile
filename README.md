# Oikos

## Desenvolvimento

A api local (`localhost:3333`) fica acessível via túnel Cloudflare em `local.oikos.company` — é o valor padrão de `EXPO_PUBLIC_BASE_URL` no `.env` e no ambiente `development` do EAS, e também a origem usada pelo `npm run generate:api`. O túnel é iniciado no repositório da **api** (`npm run tunnel`), já que é o dev server dela que ele expõe.

## Observações

### iOS
- Para compilar para iOS, é necessário ter um MacOS com Xcode instalado. Ou utilizando serviços de virtualização como o Expo Application Services (EAS) Build. No entanto é necessário pagar 550 reais por ano para publicar na App Store.
