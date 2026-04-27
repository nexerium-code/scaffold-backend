# Project structure

Structural consistency is a core requirement, not a preference. Backend projects governed by this standard are **modular monoliths** built on NestJS. One backend codebase, clear internal module boundaries, and no parallel architectures.

## 1 — Architecture baseline

- The backend is a **modular monolith**. One repository, one runnable service, many internal feature modules.
- Do not introduce microservices, service-per-domain splits, RPC-first decomposition, or mixed architecture styles unless the user explicitly requests an architecture change.
- Each feature directory represents **one business domain or aggregate root**.
- Nested resources live inside the owning feature when they share the same parent aggregate, authorization boundary, or persistence boundary. Only promote a child to a top-level feature when the domain is meaningfully separate.
- Cross-cutting code is separated from domain code into clearly named shared areas (`common/`, `filters/`, `modules/auth/`, `modules/integration/`).
- Authentication and authorization have a dedicated area.
- Third-party integrations have a dedicated area.
- Transport-level error shaping has a dedicated area.
- Root application files focus on bootstrap and composition only, not domain logic.

## 2 — Preferred directory layout

Use this as the default target shape for new backend projects and for all new work inside an existing repository that has not explicitly diverged:

```text
src/
  main.ts
  app.module.ts
  app.controller.ts
  app.service.ts

  common/
    constants/
    decorators/
    dto/
    types/
    utils/

  filters/

  modules/
    auth/
      decorators/
      guards/
      strategies/
      types/
      auth.module.ts

    integration/
      integration.module.ts
      <vendor>.service.ts

    <feature>/
      dto/
      schemas/
      <feature>.module.ts
      <feature>.controller.ts
      <feature>.service.ts
      <feature>.guard.ts

      <child-resource>/
        dto/
        schemas/
        <child-resource>.controller.ts
        <child-resource>.service.ts
        <child-resource>.guard.ts
```

- Treat this as the **default target shape**, not a suggestion.
- For new areas, follow this layout exactly unless the repository has a clearly established equivalent NestJS pattern that supersedes it.
- For edits inside an existing area, match the surrounding local structure exactly. Do not restructure a feature while completing an unrelated task.
- Avoid horizontal top-level folders such as `controllers/`, `services/`, or `models/`. Prefer feature colocation.

## 3 — Global conventions

- **Language** — TypeScript only (`.ts`). No `.js` files in `src/`.
- **Exports** — Named exports only. No default exports.
- **Imports** — Use the repository's established path alias for cross-module imports (commonly `src/` prefix). Use relative paths (`./`, `../`) inside a small local feature when that is the repository standard. Use `import type` for type-only imports.
- **Barrel files** — Avoid barrel `index.ts` files unless the repository already uses them intentionally.
- **File naming** — kebab-case with dot-separated type suffixes (`create-event.dto.ts`, `event.schema.ts`, `idempotency-key.decorator.ts`). See `rules/naming-conventions.md`.

## 4 — Root application files

| File                | Purpose                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `main.ts`           | Bootstrap: creates the Nest app, applies global pipes, middleware (Helmet, CORS, body parsers, cookie-parser when used), starts server    |
| `app.module.ts`     | Top-level composition: infrastructure imports (ConfigModule, MongooseModule root, ThrottlerModule), all feature modules, global providers |
| `app.controller.ts` | Health-check endpoint only                                                                                                                |
| `app.service.ts`    | Health-check logic only                                                                                                                   |
| `instruments.ts`    | Sentry (or equivalent monitoring) SDK initialization — imported **at the top** of `main.ts` before any framework imports                  |

- `main.ts` must not contain feature business logic.
- `app.module.ts` must not contain feature-specific business rules. It composes; it does not implement.
- `app.controller.ts` / `app.service.ts` are not a second domain layer. Do not grow them.

## 5 — Module design rules

- Each feature owns its own controller, service, DTOs, schemas, module wiring, and any feature-local guards.
- **Register Mongoose models inside the owning feature module** via `MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }])`. Do not register feature models globally in `AppModule`.
- Export only the services other modules actually need (`exports: [FeatureService]`). When one feature needs another's behavior, depend on the **exported service**, never on internal files, schemas, or repositories.
- Avoid exporting raw schemas or models across modules unless the repository already standardizes that pattern.
- Keep child resources under the parent feature when they are not independently meaningful at the top level.
- Avoid giant feature modules that mix unrelated domains. Split by aggregate, not by convenience.
- Feature-local helpers that only make sense inside one feature stay inside that feature, not in `common/`.
- If a feature needs its own guard (resource-scoped authorization), keep the guard inside the feature, not in the global auth area.

## 6 — Registrations in `AppModule`

- **Global guards** registered via `APP_GUARD` providers. Standard registration order (first registered runs first):
    1. `ThrottlerGuard`
    2. `JwtAuthGuard`
    3. `PermissionsGuard` (if present)
- **Global exception filters** registered via `APP_FILTER` providers. Registration order determines priority — **last registered wins**. See `rules/error-handling.md`.
- **Global pipes** registered via `APP_PIPE` or in `main.ts` via `app.useGlobalPipes(...)`. The project standard is the NestJS `ValidationPipe` with `{ transform: true, whitelist: true, forbidNonWhitelisted: true }`.
- **Infrastructure modules** (`ConfigModule`, `MongooseModule.forRoot(...)`, `ThrottlerModule`, the auth module, the integration module) are imported at the root.
- **Feature modules** are imported at the root. Feature modules themselves register their own schemas and providers.

## 7 — Shared code rules (`common/`)

- `common/` is for **true cross-module reuse**. It is not a dumping ground.
- Organize shared code by intent:
    - `common/constants/` — cross-cutting literal values and metadata keys.
    - `common/decorators/` — parameter decorators and metadata decorators (`@Public`, `@CurrentUser`, `@IdempotencyKey`).
    - `common/dto/` — DTOs reused by multiple features.
    - `common/types/` — shared TypeScript types, enums, payload types, response types (`error-response.type.ts`, `email.payload.type.ts`).
    - `common/utils/` — framework-agnostic helpers (date conversion, formatting, hashing adapters).
- Do not place feature-specific business logic in `common/`.
- Do not promote code to `common/` just because two files look similar once. Promote only when reuse is real, stable, and clearly beneficial.
- Keep `common/` shallow. Avoid deep sub-hierarchies.
- Shared auth concerns go in `modules/auth/`. Shared vendor concerns go in `modules/integration/`.

## 8 — Filters area (`filters/`)

- Holds global exception filters registered via `APP_FILTER` in `AppModule`.
- One filter per concern: `http-exception.filter.ts`, `mongo-exception.filter.ts`, `all-exceptions.filter.ts`, and any transport-specific filters the project genuinely uses.
- All filters produce the consistent `ErrorResponse` shape defined in `common/types/error-response.type.ts`.

## 9 — Auth area (`modules/auth/`)

- Holds the JWT strategy, guards, auth-specific decorators, and the normalized authenticated user type.
- `decorators/` — `public.decorator.ts`, `user.decorator.ts`, and related metadata decorators.
- `guards/` — `jwt.guard.ts`, `admin.guard.ts`, `permissions.guard.ts`, etc.
- `strategies/` — `jwt.strategy.ts` and any additional Passport strategies.
- `types/` — `user.type.ts` and related auth-specific types.
- See `rules/auth.md` for the full contract.

## 10 — Integration area (`modules/integration/`)

- Single place for all third-party SDK access and raw HTTP integration code.
- One vendor per service file: `sqs.service.ts`, `s3.service.ts`, `email.service.ts`, `clerk.service.ts`, etc.
- Domain services depend on integration services. Controllers and domain services never talk to vendor SDKs directly.
- See `rules/integrations.md` for the full contract.

## 11 — Change-safety rules

- Do not add a second architectural style beside the existing one.
- Do not create new top-level folders when an existing feature or shared area is the correct home.
- Do not move feature models, schemas, or feature authorization rules into `common/`.
- Do not move business logic into controllers, guards, filters, or decorators.
- Do not rename route params, DTO field names, env keys, or public error messages without auditing downstream usage with Grep first.
- Do not mix unrelated refactors into a feature task. Flag out-of-scope cleanup separately.
