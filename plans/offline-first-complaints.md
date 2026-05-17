# Offline-First: Persistência Local de Denúncias

## Stack

| Camada | Tecnologia |
|---|---|
| Driver SQLite | `expo-sqlite` |
| ORM | `drizzle-orm` + `drizzle-kit` (migrations) |
| Server state | `@tanstack/react-query` (já existe) |
| Network detection | `@react-native-community/netinfo` |
| Token storage | `expo-secure-store` (já existe) |

## Fluxo Geral

```
Usuário cria denúncia
       │
       ▼
┌──────────────────┐
│   SQLite (local)  │ ← source of truth
│   complaints      │
│   sync_queue      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Está online?     │
└──────┬───────────┘
       │
   ┌───┴───┐
   ▼       ▼
  Sim     Não
   │       │
   ▼       ▼
Envia API  Adiciona à
imediato   sync_queue
   │       │
   ▼       ▼
Atualiza  Marca como
server_id "pending_sync"
no SQLite
```

## Modelo de Dados (SQLite)

### Tabela: `complaint`

```sql
CREATE TABLE complaint (
  id TEXT PRIMARY KEY,
  server_id INTEGER,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  observations TEXT,
  latitude REAL,
  longitude REAL,
  address TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);
```

### Tabela: `complaint_attachment`

```sql
CREATE TABLE complaint_attachment (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL REFERENCES complaint(id),
  uri TEXT NOT NULL,
  type TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  server_url TEXT,
  server_id INTEGER,
  created_at TEXT NOT NULL
);
```

### Tabela: `sync_queue`

```sql
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);
```

### Tabela: `profile`

```sql
CREATE TABLE profile (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  full_name TEXT,
  display_name TEXT,
  phone TEXT,
  is_collector INTEGER DEFAULT 0,
  address TEXT,
  updated_at TEXT NOT NULL
);
```

## Endpoints da API (para sync)

| SDK Function | Método | URL | Uso no sync |
|---|---|---|---|
| `getV1Complaints` | GET | `/v1/complaints` | Seed inicial + refresh do cache |
| `postV1Complaints` | POST | `/v1/complaints` | Envio de nova denúncia |
| `getV1ComplaintsById` | GET | `/v1/complaints/{id}` | Refresh de denúncia específica |
| `patchV1ComplaintsById` | PATCH | `/v1/complaints/{id}` | Atualização de denúncia |
| `patchV1ComplaintsByIdResolved` | PATCH | `/v1/complaints/{id}/resolved` | Resolver denúncia |
| `patchV1ComplaintsByIdCanceled` | PATCH | `/v1/complaints/{id}/canceled` | Cancelar denúncia |
| `getV1ComplaintsDashboard` | GET | `/v1/complaints/dashboard` | Dashboard de status |
| `postV1ComplaintsAttachments` | POST | `/v1/complaints/attachments` | Upload de anexo |

## Plano de Implementação

### Fase 1 — Setup

- [ ] Instalar dependencias: `npx expo install expo-sqlite @react-native-community/netinfo`
- [ ] Instalar drizzle: `npm install drizzle-orm` + `npm install -D drizzle-kit`
- [ ] Configurar `drizzle.config.ts` apontando para `src/db/schema.ts`
- [ ] Criar schema em `src/db/schema.ts` com todas as tabelas
- [ ] Gerar migration: `drizzle-kit generate`
- [ ] Executar migration no startup do app

### Fase 2 — Camada de Dados

- [ ] `src/db/client.ts` — Singleton drizzle + expo-sqlite
- [ ] `src/db/repositories/complaint-repository.ts` — CRUD complaints
- [ ] `src/db/repositories/attachment-repository.ts` — CRUD attachments
- [ ] `src/db/repositories/profile-repository.ts` — Cache de perfil
- [ ] `src/db/repositories/sync-queue-repository.ts` — Gerenciamento da fila

### Fase 3 — Motor de Sync

- [ ] `src/hooks/useNetworkStatus.ts` — Hook que escuta NetInfo
- [ ] `src/services/sync-engine.ts` — Processa sync_queue:
  - Lê pending items ordenados por criação
  - Tenta enviar cada um (POST complaint → POST attachments)
  - Sucesso: atualiza `server_id`, marca `synced`, remove da fila
  - Falha: incrementa `retry_count`, salva `last_error`
- [ ] `src/services/offline-mutation.ts` — Wrapper SQLite + enfileiramento

### Fase 4 — Integração com UI

- [ ] Refatorar `UserContext` para ler/escrever profile no SQLite
- [ ] Refatorar `ComplaintCreateContext` para persistir no SQLite
- [ ] Refatorar `complaints/index.tsx`:
  - `useQuery` lendo do SQLite como fallback offline
  - Após sync bem-sucedido, invalidate query
- [ ] Adicionar badge "Pendente" / "Sincronizando" nos cards
- [ ] Adicionar indicador de pendências no painel

### Fase 5 — Casos de Borda

- [ ] Inicialização: ao logar, seed do SQLite com dados do servidor
- [ ] Conflitos: usar `updated_at` para last-write-wins
- [ ] Logout: limpar dados locais do SQLite
- [ ] Token expirado: sync falha → redirecionar para login (interceptor já existe)

## Decisões Tomadas

| Decisão | Opção | Motivo |
|---|---|---|
| ORM | Drizzle ORM | Type-safe, migrations, compatível com expo-sqlite |
| Sync strategy | Fila de ações | Transparência para o usuário do que está pendente |
| Cache de denúncias | Cache local completo | App funciona offline lendo do banco local |
| Resolução de conflitos | Pendente (analisar backend) | Definir após mapear campos do servidor |
| Anexos | Pendente (analisar fluxo) | Definir se enviados junto ou após a denúncia |
