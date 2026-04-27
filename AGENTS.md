# Backend Project Standard For Codex

This file is the single project-local Codex instruction file for this repository.

Its purpose is to make backend projects converge on the same structure, naming, boundaries, and maintenance quality. It is written to be strict enough for Codex to follow directly and practical enough to reuse across similar backend repositories.

## 1. Instruction Model

- This repository intentionally uses one repo-root `AGENTS.md` only.
- Do not create nested `AGENTS.md`, `AGENTS.override.md`, fallback instruction files, or assistant-specific rule folders unless the user explicitly asks for them.
- Do not assume any global Codex configuration exists.
- Treat Codex `.rules` files as command-approval and sandbox policy, not as a place for architecture or coding conventions.
- If legacy instruction sources exist, such as `.cursor/`, `.claude/`, `TEAM_GUIDE.md`, or old project docs, treat them as historical reference only.
- The current codebase is the source of truth for runtime behavior.
- This file is the source of truth for the target engineering standard.
- If the current codebase and this file differ:
- For narrow edits in an existing area, preserve behavior and match the local pattern unless it is clearly broken.
- For new modules, new files, or deliberate refactors, follow this standard exactly.

## 2. Operating Rules For Codex

- Read before editing. Always inspect the nearest relevant files before changing code.
- Start with the real implementation, not assumptions.
- Prefer the smallest change that fully solves the task.
- Follow the existing project structure with maximal fidelity. Match folder placement, file placement, naming, wiring, layering, and local implementation patterns as closely as possible.
- Do not introduce a second pattern when one stable pattern already exists.
- Do not silently refactor unrelated code while doing a scoped task.
- Preserve behavior unless the user explicitly asks to change behavior.
- Prefer explicit code over clever code.
- Prefer boring, maintainable abstractions over speculative abstractions.
- Do not overengineer. Do not add abstraction, indirection, generic infrastructure, helper layers, factories, base classes, or reusable utilities unless the current task materially needs them.
- When a rule here is too generic for the current framework, apply the same boundary using the framework's native equivalent.
- If the repository is TypeScript-based, use the repository's existing TypeScript patterns and compiler constraints.
- If the repository exposes package-manager scripts, task runners, or Make targets, use those instead of inventing ad hoc commands.
- Before running verification, discover the repository's real scripts and tooling from files such as `package.json`, `Makefile`, `justfile`, CI config, or task runner config.
- Follow official documentation and well-established best practices for the framework and primary libraries in use, unless the repository already has a deliberate and stable alternative.
- Prefer official documentation over blogs, memory, or guesswork for framework behavior, lifecycle details, configuration, and integration patterns.
- When working on OpenAI or Codex integrations, use official OpenAI documentation rather than memory. Prefer the OpenAI docs MCP if available.

## 3. Framework Standard

- Backend projects governed by this standard must use NestJS.
- Do not introduce a different backend framework or a parallel framework stack.
- Do not build new backend features in raw Express, Fastify without NestJS, Hono, Adonis, Next.js API routes, tRPC servers, or custom ad hoc server structures unless the user explicitly requires a framework change.
- Use NestJS official patterns for modules, controllers, providers, guards, decorators, pipes, and exception handling.
- When in doubt about backend framework behavior, prefer NestJS official documentation and NestJS-native solutions first.

## 3.1 Default Library Stack

- These are the default backend libraries for projects using this standard.
- Do not swap these out casually for alternatives.
- When a default library exists for a concern, use it first unless the user explicitly requires a different choice or the project already has a deliberate established alternative.

### Core Application Stack

- `typescript`
- Default language for the entire backend codebase.
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
- Default NestJS application and HTTP platform stack.
- Use these as the base for controllers, providers, guards, filters, decorators, and application bootstrap.
- `reflect-metadata`, `rxjs`
- Standard NestJS runtime dependencies. Treat them as framework-level infrastructure, not optional app libraries.

### Configuration

- `@nestjs/config`
- Default configuration and environment-access layer.
- Use it for centralized config loading and fail-fast reads.
- Do not replace it with scattered env parsing or direct `process.env` reads in feature code.

### Persistence

- `mongoose` + `@nestjs/mongoose`
- Default persistence stack for MongoDB-backed services under this standard.
- Use it for schemas, model injection, indexes, document queries, and transactions.
- Register models in the owning feature module with `MongooseModule.forFeature(...)`.
- `mongodb`
- Infrastructure dependency only when raw driver types or low-level behavior are actually needed.
- Do not default to raw driver usage in domain code when Mongoose already covers the use case.

### Validation And Transformation

- `class-validator` + `class-transformer`
- Default request validation and DTO transformation stack.
- Use these for normal request DTO validation at the application boundary.
- `@nestjs/mapped-types`
- Default helper for update DTOs and derived DTO contracts.
- `zod`
- Allowed secondary validation library for dynamic, runtime-defined, or schema-composed payloads.
- Do not use Zod as the default replacement for normal DTO validation when `class-validator` and `class-transformer` are sufficient.

### Authentication And Authorization

- `passport`, `@nestjs/passport`, `passport-jwt`, `@nestjs/jwt`
- Default JWT-based authentication stack.
- Use these for token extraction, strategy definition, and NestJS auth integration.
- Do not introduce a second auth stack for the same backend unless the user explicitly requests it.
- `Clerk`
- Default external authentication provider for backend projects using this standard.
- Treat Clerk as the identity provider and token issuer, while NestJS handles server-side token validation and request authorization.
- Do not introduce a second identity provider or parallel login system unless the user explicitly requests an auth-provider change.
- `bcrypt`
- Not part of the default baseline unless the backend actually manages local credentials that require password hashing.
- Do not add it proactively when the auth design uses third-party identity providers or token-only auth.

### Security, Transport, And Request Controls

- `helmet`
- Default HTTP security header middleware.
- `cookie-parser`
- Use only when the backend actually reads cookies.
- Do not add it by default to projects that use header-only auth.
- `@nestjs/throttler`
- Default rate-limiting and throttling library.
- Prefer it over ad hoc custom throttling logic.

### Dates And Time Handling

- `date-fns-tz`
- Default timezone-aware date conversion library.
- Use it for business timezone conversion, date-only interpretation, and explicit timezone transforms.
- Do not rely on naive `Date` parsing for business dates when timezone behavior matters.

### Integrations And External Communication

- `axios`
- Default HTTP client for external APIs when no better official SDK exists.
- Keep it in the integration layer, not in controllers or domain services.
- `@aws-sdk/client-s3`, `@aws-sdk/client-sqs`, `@aws-sdk/s3-request-presigner`
- Default AWS SDK family when the backend integrates with AWS S3 or SQS.
- Use AWS SDK v3 packages, not older monolithic SDK patterns.
- `resend`
- Default Resend client when Resend is the chosen email provider.
- Keep provider-specific mail code inside integration services.

### Observability

- `@sentry/nestjs`
- Default monitoring and exception-capture integration.
- Use it for production error reporting and operational visibility when the project includes monitoring.

### Testing, Linting, And Formatting

- `jest`, `@nestjs/testing`, `ts-jest`
- Default testing stack.
- `eslint`, `typescript-eslint`, `prettier`
- Default linting and formatting stack.
- Use project scripts for linting and tests instead of ad hoc commands where possible.

### Not Default Unless Explicitly Needed

- `@nestjs/microservices`
- Not part of the standard default backend architecture.
- Do not introduce RPC handlers, transport wiring, or internal microservice decomposition unless the user explicitly requests an architecture change.
- `ai`, `@ai-sdk/openai`
- Feature-specific libraries, not part of the default backend baseline.
- Use only when the project genuinely includes AI functionality.

## 3.2 Dockerization Standard

- Backend projects using this standard must be Dockerized.
- Keep Dockerization project-local with a repo-root `Dockerfile` and `.dockerignore`.
- One backend service should produce one main application image.
- Do not put multiple unrelated backend processes into one container.
- Default to a simple, readable Dockerfile.
- Prefer a single-stage Dockerfile unless the project has a clear reason to use a multi-stage build.
- Use multi-stage builds only when they materially improve the image, build flow, or deployment requirements.
- Use an official Node.js LTS image that matches the project's runtime expectations.
- Prefer `node:<lts>-slim` by default for compatibility and easier debugging.
- Use Alpine only when image size materially matters and native dependencies are known to work correctly there.
- Copy dependency manifests first to maximize layer caching.
- Use `npm ci` when a lockfile exists.
- Copy only the files needed for the backend build and runtime.
- Start the app with the repository's production start command, such as `npm run start:prod`.
- Do not hardcode app environment variables in the Dockerfile unless the user explicitly asks for that.
- Keep secrets out of the image. Inject them at runtime through environment configuration or deployment tooling.
- Maintain a `.dockerignore` that excludes at least:
- `.git`
- `node_modules`
- local env files
- coverage output
- local caches
- editor metadata
- Add `docker-compose` or other orchestration files only when the backend genuinely needs local multi-service orchestration such as a database, queue, cache, or emulator.
- Do not add Compose by default for a single backend service that can already run with a plain Docker build.

## 4. Architecture Baseline

- Backend architecture governed by this standard must be a modular monolith.
- Do not introduce microservices, service-per-domain splits, RPC-first service decomposition, or mixed backend architecture styles unless the user explicitly requires an architecture change.
- The default target is one backend codebase with clear internal module boundaries, not multiple independently shaped backend services.
- One feature directory represents one business domain or aggregate root.
- Shared cross-cutting code must be separated from domain code.
- Authentication and authorization must have a dedicated area.
- Third-party integrations must have a dedicated area.
- Transport-level error shaping must have a dedicated area.
- Root application files must focus on bootstrap and composition, not domain logic.
- Nested resources should live inside the owning feature when they share the same parent aggregate, authorization boundary, or persistence boundary.
- Only create a new top-level feature when the domain is meaningfully separate.
- Do not use `common/` as a dumping ground for code that simply feels reusable.

## 5. Preferred Directory Layout

Use this as the default target layout for TypeScript backend projects, especially NestJS projects:

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

- This structure is not a loose suggestion. Treat it as the default target shape for backend projects using this standard.
- When editing an existing area, match the surrounding local structure exactly unless the user explicitly asks for a structural refactor.
- When creating a new area, follow this structure exactly unless the repository already has a clearly established equivalent NestJS pattern.

## 6. Root Application Files

- `main.ts` or the bootstrap entrypoint owns application startup.
- Bootstrap files may configure middleware, security headers, CORS, global validation, request parsing, and server startup.
- Bootstrap files must not contain feature business logic.
- `app.module.ts` or the root composition file owns top-level imports, global providers, infrastructure wiring, and application-wide modules.
- Do not register feature-specific business rules in the root module.
- `app.controller.ts` and `app.service.ts` should remain minimal. They are not a second domain layer.
- If monitoring or tracing is initialized globally, keep that initialization at the root and keep feature code unaware of setup details.

## 7. Module Design Rules

- Each feature owns its own controller, service, DTOs, schemas or models, and module wiring.
- Register models inside the owning feature module, not globally in the root module.
- Export only the services that other modules actually need.
- When one feature needs another feature's behavior, depend on that feature's exported service, not on its internal files.
- Avoid exporting raw models or schemas across modules unless the repository already relies on that pattern.
- Keep child resources under the parent feature when they are not independently meaningful at the top level.
- Avoid giant features that mix unrelated domains.
- Avoid horizontal "controllers/", "services/", and "models/" directories at the project root. Prefer feature colocation.
- Shared infrastructure code belongs in dedicated shared areas such as `common/`, `auth/`, `integration/`, or `filters/`, not inside unrelated features.
- If a feature needs its own guard, keep it inside that feature.
- If a feature needs helper utilities that only make sense inside that feature, keep them inside that feature instead of moving them to `common/`.

## 8. Controller Rules

- Controllers are thin transport adapters.
- A controller method should mainly do five things:
- define the route
- bind params, query, body, headers, or files
- apply guards and decorators
- call the appropriate service method
- return the service result or perform required transport-specific response handling
- Controllers must not own business rules.
- Controllers must not query vendors directly.
- Controllers must not perform multi-step orchestration that belongs in a service.
- Manual response handling is allowed only when the transport requires it, such as streaming, file download, SSE, or framework-specific response piping.
- Keep controller method names aligned with the service action they call.
- Prefer route shapes that reflect resource structure.
- Keep route parameter names stable when guards, policies, or service logic depend on them.
- Public routes must be explicitly marked as public using the repository's standard bypass mechanism.
- If the same precondition is needed by multiple routes in a controller, prefer a guard or a shared service call rather than repeating inline checks.

## 9. Service Rules

- Services own business logic, orchestration, and persistence flow.
- Services are the default home for state transitions.
- Services should load the relevant parent aggregate before acting on nested resources.
- Services should validate domain preconditions before writing.
- Services should throw framework-native exceptions or repository-standard domain exceptions for invalid operations.
- Services should keep side effects in a clear order:
- resolve dependencies and parent resources
- validate access and business state
- perform durable writes
- trigger non-critical side effects
- return the final result
- Keep service methods focused on one use case.
- Split very large service methods when they stop reading as one use case.
- Do not move primary business flow into schema hooks, ORM callbacks, or decorators unless the repository already uses that pattern intentionally.
- If document state matters, prefer loading the document, mutating it intentionally, and saving it.
- If the write is a simple direct update or bulk update after validation, direct update methods are acceptable.
- Use transactions when multiple writes must succeed or fail as a single unit.
- End every opened transaction or session properly, including failure paths.
- Do not trigger external side effects before the primary write succeeds unless the product explicitly requires that order.

## 10. Authentication And Authorization

- Clerk is the default authentication provider under this standard.
- The backend does not own primary identity issuance when using this pattern. Clerk issues the token, and the backend validates and consumes it.
- Default request auth flow:
- the client sends a Clerk-issued bearer token in the `Authorization` header
- the NestJS JWT strategy extracts the bearer token
- the backend validates the token using the configured Clerk signing key
- the strategy normalizes the payload into one shared authenticated user shape
- controllers and guards consume the normalized user object, not the raw JWT payload
- The normalized user shape should contain the identifiers and authorization metadata the backend actually uses, such as:
- session id
- user id
- role
- permissions or resource-scoped access metadata
- Keep auth-provider-specific token parsing inside the auth strategy layer.
- Do not spread Clerk-specific payload parsing across controllers or domain services.
- Keep global authentication in a dedicated auth layer.
- Normalize authenticated request state into one shared user shape before controllers consume it.
- Controllers should access the authenticated user through the repository's standard decorator or request accessor, not by manually unpacking raw tokens.
- Use a standard public-route marker for intentionally unauthenticated endpoints.
- Use a dedicated coarse-grained admin guard for truly admin-only actions.
- Put resource-scoped authorization in feature-local guards or policy checks near the protected feature.
- Guards answer "may this request enter this route?" They should not implement domain workflows.
- Business-state checks such as publication state, registration windows, parent-child validity, or ownership-by-data should remain in services.
- If authorization depends on a route parameter, do not rename that parameter casually. Audit all guards and dependent services first.
- Authentication concerns belong in the auth layer.
- Authorization concerns belong in guards and services close to the domain they protect.

## 11. DTOs, Validation, And API Contracts

- Use DTOs or request schema objects for transport-level contracts.
- Create DTOs define required input for creation flows.
- Update DTOs should usually derive from create DTOs through mapped-type helpers or the framework's equivalent partial-schema mechanism.
- Keep DTOs local to the feature unless they are truly shared.
- Place widely reused DTOs in a shared DTO area, not in an arbitrary feature.
- Use nested DTO validation when the payload contains nested objects.
- Use the repository's standard transformation and validation system at the application boundary.
- Reject unknown fields at the boundary when the framework supports it.
- Use runtime validation beyond DTOs when data shape is dynamic or depends on database-defined configuration.
- Do not force all validation into decorators if the real problem requires runtime schema composition.
- API-facing error messages should be stable and machine-friendly.
- Prefer kebab-case or an equally stable code-like message style for public error strings.
- Do not casually rewrite existing public error strings if clients may depend on them.
- Keep success responses predictable:
- simple mutations may return a stable success string
- queries should return structured domain data
- special cases such as uploads, signed URLs, stats, streams, or token exchanges may return structured response objects

## 12. Persistence And Data Modeling

- Keep schemas, models, or entities inside the owning feature.
- Define indexes next to the schema they belong to.
- Keep embedded subdocuments close to their parent schema.
- Use hidden or non-selected fields for internal-only values that should not be returned by default.
- Keep timestamps on persistent models when the repository uses them as a standard.
- Unique constraints belong in the persistence model, not only in service logic.
- Service logic may still perform pre-checks for clearer errors, but the database remains the final integrity boundary.
- Keep persistence naming aligned with domain naming.
- Resolve parent entities before querying or mutating child entities.
- Prefer explicit queries scoped by the parent entity rather than unconstrained global lookups.
- Use transactions for cascading deletes, approval batches, and other multi-document state changes that must remain consistent.
- Do not move domain models into `common/` unless they are genuinely shared across multiple modules.
- Avoid hidden persistence magic that makes writes hard to trace.

## 12.1 Database And Schema Design Standard

- The default database for backend projects using this standard is MongoDB.
- The default database access layer is Mongoose through `@nestjs/mongoose`.
- Do not introduce Prisma, TypeORM, Sequelize, Drizzle, raw SQL, or a second persistence stack unless the user explicitly requests a database or ORM change.
- Database design should follow the existing modular monolith boundaries. Each feature owns its own schemas and data access boundaries.

### Schema Definition Style

- Define top-level schemas as NestJS Mongoose classes using `@Schema()` and `@Prop()`.
- Export a `HydratedDocument<T>` alias for each top-level schema.
- Export the final schema with `SchemaFactory.createForClass(...)`.
- Keep one schema class per file unless a tiny embedded helper schema is tightly coupled and local.
- Use singular schema class names such as `Event`, `Provision`, `Participant`, `Workshop`, and `Feedback`.
- Use explicit `type` declarations in `@Prop(...)`. Do not rely on implicit inference when the field shape matters.
- Prefer top-level schemas with `@Schema({ timestamps: true })`.
- Use embedded schemas with `@Schema({ _id: false })` when the subdocument should not have its own identity.

### Field Design Rules

- Every persisted field should have an intentional shape, validation rule, and default behavior.
- Use `required: [true, "message"]` or conditional required rules for fields that must exist.
- Use `trim`, `lowercase`, `enum`, `match`, and custom validators at the schema level when the invariant belongs to the persisted field itself.
- Keep schema validation messages stable and machine-friendly.
- Use `default: undefined` for optional fields when that produces cleaner documents and better conditional validation behavior.
- Use computed defaults only when they are deterministic and clearly part of the data model.
- Prefer explicit boolean defaults like `default: false` rather than relying on absent values for state flags.

### IDs, References, And Relationships

- Use Mongo `ObjectId` references for relations between aggregates and major child records unless there is a clear reason to use a different identifier type.
- Name parent-reference fields explicitly as `<parent>Id`, such as `eventId`, `provisionId`, `participantId`, `workshopId`, or `attendanceId`.
- Define refs explicitly with `ref: "<ModelName>"`.
- Use UUID fields for idempotency keys and special internal identifiers where appropriate.
- Keep hidden internal identifiers such as idempotency keys and private codes as `select: false` when they should not be returned by default.
- Prefer explicit parent-scoped queries over global lookups.
- Prefer refs plus service-level loading over `populate`-heavy design.
- Do not make `populate`, virtual populate, or autopopulate the default relation strategy.

### Embedded Documents And Dynamic Shapes

- Use embedded subdocument schemas for tightly owned nested structures that have no independent lifecycle, such as entries, categories, targets, dates, and form-item definitions.
- Use `type: [SubSchema]` for ordered embedded collections when item structure is known.
- Use `type: Map` only when the shape is truly dynamic and keyed by runtime-defined field names.
- When storing dynamic values, use `Map` with an explicit `of` schema where possible.
- Use `SchemaTypes.Mixed` only for the truly variable leaf values that cannot be modeled more precisely.
- Do not default to `Mixed` or loose maps when a concrete schema is practical.

### Validation Placement

- Put persistence-level invariants in the schema when they are intrinsic to the stored data.
- Good schema-level rules include:
- required fields
- enum membership
- format constraints
- duplicate prevention
- conditional field requirements
- embedded-array validity
- parent-local uniqueness enforced by indexes
- Keep request-shape validation in DTOs.
- Keep workflow and business-process validation in services.
- Use schema validators to protect stored data quality, not to replace service orchestration.

### Indexing And Uniqueness

- Use `unique: true` on a field for true single-field uniqueness constraints.
- Use `Schema.index(...)` after `SchemaFactory.createForClass(...)` for compound indexes.
- Define compound uniqueness when uniqueness only makes sense within a parent scope, such as `email + workshopId` or `identification + participantId`.
- Add plain indexes for frequently queried foreign keys or high-value lookup fields.
- Keep indexes beside the schema definition so they stay visible during changes.
- Do not rely only on service pre-checks for uniqueness. The database must enforce the final constraint.

### Query And Mutation Style

- Query children through their parent boundary whenever practical.
- Validate that the parent exists before reading or mutating the child collection when the route is parent-scoped.
- Avoid document graphs that require broad eager loading to answer normal requests.
- Keep reads explicit and predictable.
- Use direct updates for simple field updates after validation.
- Use document mutation plus `save()` when document-level logic or conditional field handling is clearer that way.
- Use transactions for multi-document mutations that must stay consistent.

### Schema Safety Rules

- Do not hide important persistence behavior in pre-save hooks, post-save hooks, or schema plugins unless the repository explicitly standardizes that pattern.
- Do not add autopopulate-style behavior by default.
- Do not over-normalize the data model into many tiny collections without a clear query or lifecycle reason.
- Do not denormalize blindly either. Embed when ownership is tight, reference when lifecycle, querying, or cardinality makes that cleaner.
- Keep schema design boring, explicit, and easy to reason about from the file alone.

## 13. Integrations And Side Effects

- All third-party SDK access, vendor payload mapping, and raw HTTP integration logic must live in a dedicated integration layer.
- Domain services should depend on integration services, not on raw vendor clients.
- Keep vendor-specific field names and request formats out of controllers and domain services.
- Configuration for integrations must be read through the repository's central configuration mechanism.
- Do not scatter `process.env` access through controllers or domain services.
- Fail fast on missing required configuration using the repository's standard `getOrThrow` or equivalent pattern.
- Persist core business state before triggering non-critical side effects.
- Fire-and-forget side effects are allowed only when failure does not invalidate the primary user flow.
- If a fire-and-forget side effect fails, the integration layer must catch, log, and report it through the repository's monitoring path.
- Integration wrappers should expose business-meaningful methods such as `publishMessage`, `sendEmail`, `createBadge`, or `generateUploadUrl`, not vendor-shaped primitives unless the repository intentionally standardizes them.
- Do not bury retry or idempotency assumptions in undocumented helper code.

## 14. Idempotency And Retry Safety

- Use idempotency for retry-prone create flows, externally triggered submissions, webhook-like writes, and public forms that may be resent.
- Extract idempotency keys through a standard decorator, middleware, or request helper.
- Validate the key format at the boundary.
- Store the idempotency key on the created record or in a dedicated idempotency store.
- Back idempotency with a unique index or equivalent persistence constraint whenever possible.
- Service logic may check for an existing record first for a clean result, but the database remains the final protection against race conditions.
- Do not force idempotency onto every mutation. Use it where duplicate submission is a real risk.

## 15. Configuration And Environment

- Centralize configuration access.
- Application code should read config through the repository's configuration service or config module.
- Prefer fail-fast reads for required values.
- Do not let feature code reach directly into environment variables.
- Keep config names stable and explicit.
- Keep environment wiring at the application and integration layers, not buried in domain logic.
- If a value is derived from environment data and reused often, compute it once in the appropriate service or configuration boundary.

## 16. Dates, Times, And Time Zones

- Date-only values are business values, not instants.
- Never parse `YYYY-MM-DD` inputs with naive date constructors unless the repository explicitly defines that behavior.
- Convert date-only input using the correct business timezone and a shared utility when possible.
- Be explicit about start-of-day and end-of-day semantics.
- Store persisted instants in UTC or in the repository's clearly defined standard.
- Keep timezone decisions out of random controller and service code. Centralize them in shared utilities or clearly named helpers.
- If one backend has a canonical business timezone, define it once and reuse it consistently.

## 17. Error Handling And Public Response Shape

- Use framework-native exceptions or repository-standard domain exceptions for expected failures.
- Use global filters or middleware to translate exceptions into public transport responses.
- Keep the public error response shape consistent.
- A standard backend error payload should usually contain:
- status code
- timestamp
- request path or action
- stable message or error code
- Do not leak stack traces, raw exception objects, vendor payloads, secrets, or database internals to clients.
- Internal logs may contain richer debugging context than public responses.
- Filters are responsible for response translation, not for replacing service validation.
- Keep public errors minimal and stable.
- If one integration fails internally but should not break the primary flow, log and monitor it without exposing vendor details to clients.

## 18. Logging And Observability

- Log operational failures where they occur.
- Capture unexpected failures in the repository's monitoring system when one exists.
- Integration services should log and capture vendor failures with enough context to debug them later.
- Do not log secrets, tokens, passwords, or full sensitive payloads.
- Prefer structured, contextual logs over vague string logs.
- Public responses remain clean even when internal logging is rich.

## 19. Naming And File Conventions

- Use kebab-case for filenames.
- Use dot-suffixed filenames that communicate the file role.
- Standard examples:
- `<feature>.module.ts`
- `<feature>.controller.ts`
- `<feature>.service.ts`
- `<feature>.guard.ts`
- `<feature>.schema.ts`
- `create-<feature>.dto.ts`
- `update-<feature>.dto.ts`
- `get-<purpose>.dto.ts`
- Use singular names for aggregate roots when that is the repository pattern.
- Use plural child-resource names when the resource is naturally a collection and the repository already uses plural naming there.
- Match the established naming of the local area rather than imposing a second convention.
- Prefer named exports for new code.
- If an existing local area already uses default exports, do not churn files only to remove them.
- Use `import type` for type-only imports where the toolchain supports it.
- Use the repository's established path alias rules for cross-module imports.
- Use relative imports inside a small local feature when that is the repository standard.
- Avoid barrel files unless the repository already uses them intentionally.

## 20. Code Style And Readability

- Optimize for clarity first.
- Prefer explicit branches over compressed cleverness when business logic matters.
- Keep functions reasonably short, but do not split trivial code just to satisfy an arbitrary size rule.
- Comments should explain non-obvious intent, invariants, transaction boundaries, or business rules.
- Do not narrate every obvious line with comments.
- Preserve important local comment style when editing a legacy file, but do not expand comment noise unnecessarily.
- Avoid `any` when a real type is readily available.
- If the repository already relaxes a TypeScript rule in a specific area, follow the local constraint rather than performing unrelated type cleanup.
- Do not introduce dead abstractions, utility wrappers, or helper files for a single use unless they materially improve clarity.

## 21. Shared Code Rules

- `common/` is for true cross-module reuse.
- Shared code must be organized by intent, such as `constants`, `decorators`, `dto`, `types`, and `utils`.
- Do not place feature-specific business logic in `common/`.
- Do not move code to shared areas just because two files look similar once.
- Promote code to shared areas only when reuse is real, stable, and clearly beneficial.
- Shared DTOs belong in shared DTO folders.
- Shared low-level helpers belong in shared utils.
- Shared auth concerns belong in auth.
- Shared vendor concerns belong in integration.

## 22. Change Safety And Forbidden Patterns

- Do not add a second architectural style beside the existing one.
- Do not deviate from the established project structure casually. Structural consistency is a core requirement, not a preference.
- Do not move business logic into controllers, guards, filters, or decorators.
- Do not call vendor SDKs directly from controllers or domain services.
- Do not read `process.env` directly from domain code.
- Do not rename route params, public error messages, DTO fields, or env keys without auditing downstream usage.
- Do not mix unrelated refactors into a feature task.
- Do not introduce hidden persistence behavior in hooks or middleware unless the repository already standardizes it.
- Do not put feature models or feature authorization rules into `common/`.
- Do not create new top-level folders when an existing feature or shared area is the correct home.
- Do not assume tests are authoritative if the repository clearly contains stale or abandoned tests.

## 23. Verification And Definition Of Done

- A task is not done when the code merely looks correct. It is done when the change is wired correctly, consistent with the repository structure, and verified as much as the repository supports.
- Before verification, discover the project's real verification commands.
- Prefer the narrowest meaningful verification for the scope of the change.
- For a narrow code change, prefer targeted lint, build, typecheck, or focused tests over expensive full-suite runs.
- For cross-cutting or risky changes, broaden verification accordingly.
- If the repository has stale or commented-out tests, do not treat them as the product specification.
- If no useful automated verification exists, say so explicitly.
- Never claim tests, lint, or builds passed unless they were actually run.
- When you change module wiring, DTOs, schemas, guards, or shared contracts, verify the highest-risk part of that change, not just the lowest-cost command.

## 24. Preferred Workflow For New Backend Work

- For a new feature:
- create the feature directory under `src/modules/`
- add the module, controller, service, DTOs, and schemas in that feature
- add guards only if the feature needs route entry control
- register the feature's models in the feature module
- import the feature module into the root module
- keep business logic in the service
- keep third-party communication in integration services
- add targeted verification
- For a new child resource:
- place it under the parent feature
- scope queries and writes through the parent aggregate
- reuse the parent feature's permission boundary when appropriate
- avoid promoting it to a top-level module unless it truly becomes an independent domain
- For a refactor:
- keep behavior stable unless the task explicitly asks for behavior change
- preserve public contracts unless the task explicitly includes a contract update
- refactor by strengthening the existing architecture, not by replacing it with a second one

## 25. Practical Priority Order

When multiple rules compete, use this order:

1. Preserve correctness and explicit user requirements.
2. Preserve real runtime behavior unless change is requested.
3. Follow the established project pattern in the area being changed.
4. For new work, follow this document's target architecture.
5. Prefer simpler and more maintainable code over clever or generic code.
