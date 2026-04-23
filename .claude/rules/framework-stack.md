# Framework and library stack

Backend projects governed by this standard run on NestJS. This file defines the default framework, the default library stack for each concern, and the Dockerization standard. Do not swap defaults casually. When a default exists for a concern, use it first unless the user explicitly requires a different choice or the repository already has a deliberate established alternative.

## 1 — Framework

- **NestJS** is the backend framework. Use NestJS official patterns for modules, controllers, providers, guards, pipes, decorators, interceptors, and exception filters.
- Do not build new backend features in raw Express, Fastify (without NestJS), Hono, Adonis, Next.js API routes, tRPC servers, or custom ad hoc server structures.
- Do not introduce a second backend framework or a parallel framework stack alongside NestJS.
- When framework behavior is in question, prefer NestJS official documentation over memory or blogs. WebFetch to docs rather than guessing lifecycle, DI, or decorator behavior.

## 2 — Core application stack

- **`typescript`** — the backend is written entirely in TypeScript. No `.js` in `src/`.
- **`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`** — default NestJS application + HTTP platform stack.
- **`reflect-metadata`, `rxjs`** — framework-level runtime dependencies. Treat them as infrastructure, not optional libraries.
- Target modern `ES2023` (or the repository's established target) with `strictNullChecks` enabled.

## 3 — Configuration

- **`@nestjs/config`** — default configuration and environment-access layer.
- Centralize config loading. Use `ConfigService.getOrThrow(...)` (or the equivalent) for required values — fail fast.
- Do not read `process.env` directly from controllers, services, or domain code. Integration and infrastructure layers may read through `ConfigService`; domain code must not.
- See `rules/configuration-and-dates.md`.

## 4 — Persistence

- **`mongoose` + `@nestjs/mongoose`** — default persistence stack.
- Register models inside the **owning feature module** via `MongooseModule.forFeature([...])`, never globally from `AppModule`.
- **`mongodb`** — include only when raw driver types or low-level behavior are actually needed. Do not default to raw driver usage in domain code.
- Do not introduce Prisma, TypeORM, Sequelize, Drizzle, or a second persistence stack unless the user explicitly requests a database/ORM change.
- See `rules/persistence.md`.

## 5 — Validation and transformation

- **`class-validator` + `class-transformer`** — default request validation and DTO transformation stack.
- **`@nestjs/mapped-types`** — default helper for update DTOs and derived DTOs (`PartialType`, `OmitType`, `PickType`).
- **`zod`** — allowed only as a _secondary_ validation library for dynamic, runtime-defined, or schema-composed payloads. Do not use Zod as a replacement for normal DTO validation.
- Global `ValidationPipe` is configured once with `{ transform: true, whitelist: true, forbidNonWhitelisted: true }`.
- See `rules/dtos-and-validation.md`.

## 6 — Authentication and authorization

- **`passport`, `@nestjs/passport`, `passport-jwt`, `@nestjs/jwt`** — default JWT auth stack.
- **Clerk** — default external identity provider. Clerk issues tokens; the NestJS JWT strategy validates them using the configured Clerk signing key.
- Do not introduce a second identity provider, a parallel login system, or a second auth stack unless the user explicitly requests one.
- **`bcrypt`** — not part of the default baseline. Include it only when the backend manages local credentials that require password hashing. Do not add it proactively on Clerk-only projects.
- See `rules/auth.md`.

## 7 — Security, transport, and request controls

- **`helmet`** — default HTTP security header middleware. Apply in `main.ts` during bootstrap.
- **`cookie-parser`** — only when the backend actually reads cookies. Do not add it by default to header-only auth projects.
- **`@nestjs/throttler`** — default rate-limiting library. Register `ThrottlerGuard` globally via `APP_GUARD`. Prefer it over ad hoc custom throttling logic.

## 8 — Dates, times, and time zones

- **`date-fns-tz`** — default timezone-aware date conversion library.
- Use it for business timezone conversion, date-only interpretation, and explicit timezone transforms.
- Do not rely on naive `new Date("YYYY-MM-DD")` parsing for business dates when timezone behavior matters.
- See `rules/configuration-and-dates.md`.

## 9 — Integrations and external communication

- **`axios`** — default HTTP client when no better official SDK exists. Keep it inside the integration layer; do not use it from controllers or domain services.
- **`@aws-sdk/client-s3`, `@aws-sdk/client-sqs`, `@aws-sdk/s3-request-presigner`** — default AWS SDK family. Use AWS SDK v3 packages, not older monolithic SDK patterns.
- **`@sendgrid/mail`** — default SendGrid client when SendGrid is the chosen email provider. Keep provider-specific code inside integration services.
- Add new vendor SDKs only inside `modules/integration/`. See `rules/integrations.md`.

## 10 — Observability

- **`@sentry/nestjs`** — default error monitoring and tracing integration.
- Initialize Sentry in `instruments.ts`, imported at the **top** of `main.ts` before any framework imports.
- `AllExceptionsFilter` should use `@SentryExceptionCaptured()` (or equivalent) to auto-report unhandled errors.
- For caught errors in non-critical paths, log with NestJS `Logger` and call `captureException` manually.

## 11 — Testing, linting, formatting

- **`jest`, `@nestjs/testing`, `ts-jest`** — default testing stack. Colocate unit tests as `<feature>.service.spec.ts`.
- **`eslint`, `typescript-eslint`, `prettier`** — default lint/format stack. Always run the repository's `npm run lint` and `npm run format` scripts rather than reinventing commands.

## 12 — Not default unless explicitly needed

- **`@nestjs/microservices`** — not part of the default architecture. Do not introduce RPC handlers, transport wiring, or internal microservice decomposition unless the user explicitly requests an architecture change.
- **`ai`, `@ai-sdk/openai`, `openai`** — feature-specific. Add only when the project genuinely includes AI functionality, and keep it inside the integration layer.
- **GraphQL, gRPC, Kafka, Redis, message brokers** — not defaults. Introduce only when the project requires them.

## 13 — Discovering the project's scripts

- Before running verification, discover the project's real scripts and tooling.
- Check `package.json` `scripts` (Read). Typical names:
    - `npm run start:dev` — dev server
    - `npm run start:prod` — production start
    - `npm run build` — compile
    - `npm run lint` / `npm run format`
    - `npm test` / `npm run test:watch` / `npm run test:e2e`
- Also check for `Makefile`, `justfile`, or CI config when scripts are not obvious.
- Use the project scripts. Do not invent ad hoc command lines when a script already exists.

## 14 — Dockerization standard

Backend projects using this standard must be Dockerized.

### 14.1 Structure

- Keep Dockerization project-local with a repo-root `Dockerfile` and `.dockerignore`.
- One backend service produces **one main application image**. Do not pack multiple unrelated backend processes into one container.

### 14.2 Dockerfile style

- Default to a **simple, readable** Dockerfile.
- Prefer a single-stage build unless the project has a clear reason for multi-stage (smaller production image, separate build-only tooling, etc.).
- Use an **official Node.js LTS image** matching the project's runtime expectations.
- Default to `node:<lts>-slim` for compatibility and debuggability. Use Alpine only when image size materially matters and native dependencies are known to work there.
- **Copy dependency manifests first** (`package.json`, lockfile) to maximize layer caching. Then `npm ci`. Then copy the rest of the source.
- Use `npm ci` when a lockfile exists, not `npm install`.
- Copy only the files needed for build and runtime. Do not `COPY . .` when a narrower copy is clearly sufficient.
- Start the app with the repository's production start command (e.g., `CMD ["npm", "run", "start:prod"]`).

### 14.3 Secrets and environment

- Do not hardcode application environment variables in the Dockerfile unless the user explicitly asks for that.
- Keep secrets out of the image. Inject them at runtime through environment configuration or deployment tooling.

### 14.4 `.dockerignore`

Maintain a `.dockerignore` that excludes at least:

- `.git`
- `node_modules`
- local env files (`.env`, `.env.*`)
- coverage output (`coverage/`)
- local caches (`.cache/`, `.turbo/`, etc.)
- editor metadata (`.vscode/`, `.idea/`, `.DS_Store`)
- Claude/Codex artifacts (`.claude/`, `AGENTS.md`, `CLAUDE.md`) if they should not ship in the image

### 14.5 Compose and orchestration

- Add `docker-compose.yml` only when the backend genuinely needs local multi-service orchestration (database, queue, cache, emulator).
- Do not add Compose by default for a single backend service that runs fine with a plain `docker build` + `docker run`.
