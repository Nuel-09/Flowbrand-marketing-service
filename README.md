<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

**SEIL (backend service)** — NestJS API for the SEIL guided marketing strategy product: **PostgreSQL** + **TypeORM**, **`/api/v1`** API prefix, **JWT auth**, document upload (PDF/DOCX, local disk MVP) with synchronous text extraction, **Anthropic Claude** funnel generation (four fixed stages), and progress polling.

**System design (as-built):** [docs/SYSTEM_DESIGN.md](./docs/SYSTEM_DESIGN.md)

### Stack

- NestJS 11, TypeORM, `pg`
- `@nestjs/config` with `.env` / `.env.local`
- Global prefix **`api/v1`**, `ValidationPipe` (whitelist + transform)
- JWT (`@nestjs/jwt`, Passport JWT strategy)
- Optional local DB: `docker compose up -d` (Postgres 16)

### HTTP routes (initial)

| Method | Path                                        | Notes                                                                                                              |
| ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/v1`                                   | API hello                                                                                                          |
| GET    | `/api/v1/health`                            | Liveness (no DB query)                                                                                             |
| POST   | `/api/v1/auth/register`                     | Email + password → JWT                                                                                             |
| POST   | `/api/v1/auth/login`                        | JWT                                                                                                                |
| GET    | `/api/v1/users`                             | List users (**Bearer JWT** required)                                                                               |
| POST   | `/api/v1/funnels/upload`                    | Multipart `file` (PDF/DOCX, ≤ 5 MiB), **Bearer JWT**                                                               |
| GET    | `/api/v1/funnels/upload/progress/:uploadId` | Upload status for owner, **Bearer JWT**                                                                            |
| POST   | `/api/v1/funnels/generate-from-upload`      | JSON `{ "uploadId" }` — **JWT**; upload must be `ready`; needs **`ANTHROPIC_API_KEY`**; saves `funnel_generations` |

### Anthropic Claude (funnel generation)

Set **`ANTHROPIC_API_KEY`** in `.env` (from [Anthropic Console](https://console.anthropic.com/)). Optional **`ANTHROPIC_MODEL`** (default `claude-haiku-4-5`). Without a key, `POST .../generate-from-upload` returns **503** `AI_NOT_CONFIGURED`.

### OpenAPI (Swagger UI)

With the app running, open **`/api/v1/docs`**. Authorize with `Bearer <accessToken>` from `POST /auth/login`. Set `PUBLIC_URL` in production for accurate server URLs in Swagger.

### Deploy (Docker)

Build and run (set database env vars to match your Postgres; `PORT` is optional, default `3000`):

```bash
docker build -t flowbrand-marketing-service .
docker run --rm -p 3000:3000 -e DB_HOST=... -e DB_PORT=5432 -e DB_USERNAME=... -e DB_PASSWORD=... -e DB_NAME=... -e TYPEORM_SYNC=false -e PUBLIC_URL=http://localhost:3000 flowbrand-marketing-service
```

Then visit `http://localhost:3000/api/v1/docs`. For managed platforms (Render, Fly.io, Railway, Azure, AWS, [Nest Mau](https://mau.nestjs.com)), use this `Dockerfile` or `npm run build` + `npm run start:prod`, bind `PORT` from the platform, and attach a Postgres instance.

### Environment

Copy `.env.example` to `.env`. For first-time local schema without migrations, set `TYPEORM_SYNC=true` **only in development** — use migrations before production.

When you run broader **archived** e2e specs from `archive/tests/`, they need a running Postgres matching `.env` and `JWT_SECRET`.

### Render deployment

Set variables in the **Render dashboard → your Web Service → Environment** (never commit secrets to Git). Link a **Render PostgreSQL** instance to the web service so **`DATABASE_URL`** is injected automatically, or paste the **Internal Database URL** as `DATABASE_URL` (single line; `DB_URL` is also accepted).

| Variable                  | Required          | Purpose                                                                                                                                                                                                                                                 |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`DATABASE_URL`**        | Yes (typical)     | Postgres connection string from linked DB or manual paste. If unset, use **`DB_HOST`**, **`DB_PORT`**, **`DB_USERNAME`**, **`DB_PASSWORD`**, **`DB_NAME`** (or **`DB_DATABASE`**) instead.                                                              |
| **`JWT_SECRET`**          | Yes               | Signs JWT access tokens. Use a long random value (32+ characters); keep it stable across deploys unless you want all clients to re-authenticate.                                                                                                        |
| **`ANTHROPIC_API_KEY`**   | For funnel AI     | Required for `POST /api/v1/funnels/generate-from-upload`. Without it the API returns **503** `AI_NOT_CONFIGURED`.                                                                                                                                       |
| **`ANTHROPIC_MODEL`**     | No                | Claude model id; defaults to **`claude-haiku-4-5`** if unset.                                                                                                                                                                                           |
| **`NODE_ENV`**            | Recommended       | Set to **`production`**.                                                                                                                                                                                                                                |
| **`PORT`**                | Usually automatic | Render sets this; the app listens on `process.env.PORT`.                                                                                                                                                                                                |
| **`PUBLIC_URL`**          | Recommended       | Public base URL of the API, **no trailing slash** (e.g. `https://your-service.onrender.com`). Improves Swagger “Try it out” server URLs.                                                                                                                |
| **`TYPEORM_SYNC`**        | Recommended       | Use **`false`** in production and apply schema with **migrations**. Only use `true` for throwaway demos.                                                                                                                                                |
| **`SWAGGER_ENABLED`**     | No                | Defaults to on; set to **`false`** to disable `/api/v1/docs`.                                                                                                                                                                                           |
| **`UPLOAD_STORAGE_ROOT`** | No                | Directory for uploaded PDFs/DOCX. Defaults to **`./var/uploads`** under the app. On Render, the filesystem is **ephemeral** unless you attach a **persistent disk** (uploads can be lost on redeploy); plan for object storage for durable files later. |

**Deploy:** Connect the GitHub repo in Render, enable **Auto-Deploy** for your branch, use this repo’s **`Dockerfile`** (or Node build + `npm run start:prod` with the same env vars). After each push, Render rebuilds and deploys; you do not need to open the Postgres service for routine deploys if the database is already linked.

## Project setup

```bash
$ npm install
$ copy .env.example .env   # Windows — adjust credentials if needed
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Tests

- **`npm run test`** — runs **`src/funnels/funnel-ai.service.spec.ts`** (JSON parsing + mocked Anthropic `fetch`).
- **Older e2e / broader specs** — still under **`archive/tests/`** (see `archive/tests/README.md`). `npm run test:e2e` currently aliases the same minimal `npm test`.

## Deployment

See **[Render deployment](#render-deployment)** above for this service’s environment checklist. General NestJS deployment guidance: [NestJS deployment](https://docs.nestjs.com/deployment). Optional AWS-focused tool: [Nest Mau](https://mau.nestjs.com).

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
