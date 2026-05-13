# Flowbrand marketing service

NestJS **HTTP API** for **SEIL**, a guided marketing-strategy product: users authenticate with **JWT**, upload **PDF or DOCX** business documents (up to **5 MiB**), the service extracts text (**pdf-parse**, **mammoth**), then **Anthropic Claude** returns a structured marketing funnel (**awareness → engagement → conversion → retention**) persisted in **PostgreSQL** via **TypeORM**.

| Topic | Detail |
| ----- | ------ |
| **Global prefix** | `/api/v1` |
| **Interactive docs** | `/api/v1/docs` (Swagger UI; optional `SWAGGER_ENABLED`) |
| **Local database** | `docker compose up -d` — Postgres **16** + API (`docker-compose.yml`) |

Repository: [github.com/Nuel-09/Flowbrand-marketing-service](https://github.com/Nuel-09/Flowbrand-marketing-service)

---

## Stack

- **NestJS 11**, **TypeORM**, `pg`
- **Auth:** `@nestjs/jwt`, Passport JWT, `bcryptjs`
- **Uploads:** Multer **memory** storage, size limit shared with `MAX_UPLOAD_BYTES` in code
- **Config:** `@nestjs/config` (`.env.local`, then `.env`)
- **Validation:** global `ValidationPipe` (whitelist, forbid unknown fields, transform)

---

## HTTP API (summary)

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/api/v1` | Service hello (`SEIL marketing strategy API — ok`) |
| GET | `/api/v1/health` | Liveness (no DB check) |
| POST | `/api/v1/auth/register` | Email + password → user + JWT |
| POST | `/api/v1/auth/login` | JWT access token |
| GET | `/api/v1/users` | List users (**Bearer JWT**) |
| POST | `/api/v1/funnels/upload` | Multipart field `file` (PDF/DOCX, ≤ 5 MiB); **JWT**; stores file under `UPLOAD_STORAGE_ROOT`, extracts text before responding |
| GET | `/api/v1/funnels/upload/progress/:uploadId` | Poll status for an upload you own; **JWT** |
| POST | `/api/v1/funnels/generate-from-upload` | Body `{ "uploadId" }`; upload must be `ready`; **JWT**; requires **`ANTHROPIC_API_KEY`**; creates `funnel_generations` row |

---

## Environment

Copy **`.env.example`** → **`.env`**. Never commit real secrets.

| Variable | When | Purpose |
| -------- | ---- | ------- |
| **`DATABASE_URL`** or **`DB_URL`** | Typical deploy | Single Postgres URL (wins over discrete `DB_*` vars if set) |
| **`DB_HOST`**, **`DB_PORT`**, **`DB_USERNAME`**, **`DB_PASSWORD`**, **`DB_NAME`** (or **`DB_DATABASE`**) | If no URL | Individual connection fields |
| **`JWT_SECRET`** | Always in deploy | Signs access tokens (use a long random value, 32+ chars) |
| **`ANTHROPIC_API_KEY`** | Funnel generation | Required for `POST .../generate-from-upload`; missing → **503** `AI_NOT_CONFIGURED` |
| **`ANTHROPIC_MODEL`** | Optional | Default **`claude-haiku-4-5`** |
| **`NODE_ENV`** | Recommended | **`production`** in deploy |
| **`PORT`** | Optional | Listen port (default **3000**) |
| **`PUBLIC_URL`** | Recommended in prod | Public API base URL, **no trailing slash** — improves Swagger “Try it out” |
| **`TYPEORM_SYNC`** | Dev vs prod | **`true`** only for local throwaway schema; **`false`** + migrations in production |
| **`SWAGGER_ENABLED`** | Optional | Set **`false`** to disable `/api/v1/docs` |
| **`UPLOAD_STORAGE_ROOT`** | Optional | Upload directory; default **`./var/uploads`** (ephemeral on many hosts unless you add persistent storage) |

---

## Quick start (local)

```bash
npm install
cp .env.example .env
```

On **Windows CMD**, use `copy .env.example .env` instead of `cp`. Then set **`DB_*`** and **`JWT_SECRET`** in `.env`.

Start Postgres (optional): from the repo root:

```bash
docker compose up -d postgres
```

Run the API in watch mode:

```bash
npm run start:dev
```

Open **`http://localhost:3000/api/v1/docs`**. Authorize with **`Bearer <token>`** from **`POST /api/v1/auth/login`**.

Full stack (Postgres + API in Docker):

```bash
docker compose up -d --build
```

Compose uses **`TYPEORM_SYNC=true`** for a quick demo only; use migrations and **`TYPEORM_SYNC=false`** for real production.

---

## Build & run (Node)

```bash
npm run build
npm run start:prod
```

---

## Docker image (manual run)

```bash
docker build -t flowbrand-marketing-service .
docker run --rm -p 3000:3000 \
  -e DB_HOST=... -e DB_PORT=5432 -e DB_USERNAME=... -e DB_PASSWORD=... -e DB_NAME=... \
  -e TYPEORM_SYNC=false -e JWT_SECRET=... -e PUBLIC_URL=http://localhost:3000 \
  flowbrand-marketing-service
```

Use the same env vars as in **Environment** (or pass **`DATABASE_URL`**). On platforms like **Render**, link a Postgres instance, set **`JWT_SECRET`**, **`ANTHROPIC_API_KEY`**, **`NODE_ENV=production`**, and deploy from this **`Dockerfile`** or **`npm run start:prod`** after build.

---

## Tests

- **`npm test`** — runs **`src/funnels/funnel-ai.service.spec.ts`** (JSON parsing + mocked Anthropic `fetch`).
- **`npm run test:e2e`** — currently the same as **`npm test`**.
- Broader or older specs live under **`archive/tests/`** (see **`archive/tests/README.md`**); those need a running Postgres aligned with `.env` and **`JWT_SECRET`**.

---

## Anthropic / funnel output

Set **`ANTHROPIC_API_KEY`** from [Anthropic Console](https://console.anthropic.com/). The model returns **JSON** with four string fields: **`awareness`**, **`engagement`**, **`conversion`**, **`retention`**, each plain text suitable for a non-technical reader.

---

## License

This package is **private** and **`UNLICENSED`** in `package.json` unless your organization adds a separate license file.

---

## NestJS reference

Framework docs: [docs.nestjs.com](https://docs.nestjs.com).
