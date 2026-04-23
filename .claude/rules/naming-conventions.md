# Naming conventions

Naming is a core part of structural consistency. Follow these rules exactly for new work, and match local precedent in legacy areas. All naming must be IDE-search-friendly and unambiguous.

## 1 — Files

- **All source files use kebab-case** with dot-separated type suffixes. The suffix communicates the file role.
- One class or primary export per file.
- No default exports. Named exports only.

| File type            | Pattern                                              | Example                                 |
| -------------------- | ---------------------------------------------------- | --------------------------------------- |
| Module               | `<feature>.module.ts`                                | `event.module.ts`                       |
| Controller           | `<feature>.controller.ts`                            | `event.controller.ts`                   |
| Service              | `<feature>.service.ts`                               | `event.service.ts`                      |
| Service spec         | `<feature>.service.spec.ts`                          | `event.service.spec.ts`                 |
| Feature-local guard  | `<feature>.guard.ts`                                 | `workshop.guard.ts`                     |
| Create DTO           | `create-<feature>.dto.ts`                            | `create-event.dto.ts`                   |
| Update DTO           | `update-<feature>.dto.ts`                            | `update-event.dto.ts`                   |
| Purpose-specific DTO | `get-<purpose>.dto.ts`                               | `get-event-stats.dto.ts`                |
| Sub-object DTO       | `<sub-object>.dto.ts`                                | `location.dto.ts`                       |
| Mongoose schema      | `<entity>.schema.ts`                                 | `event.schema.ts`                       |
| Embedded sub-schema  | `<sub-entity>.schema.ts` (colocated in `schemas/`)   | `form-item.schema.ts`                   |
| Decorator            | `<name>.decorator.ts`                                | `idempotency-key.decorator.ts`          |
| Integration service  | `<vendor>.service.ts`                                | `sqs.service.ts`, `sendgrid.service.ts` |
| Shared type          | `<name>.type.ts`                                     | `email-payload.type.ts`                 |
| Exception filter     | `<scope>-exception.filter.ts` or `<scope>.filter.ts` | `http-exception.filter.ts`              |
| Guard (global)       | `<name>.guard.ts`                                    | `jwt.guard.ts`, `admin.guard.ts`        |
| Strategy             | `<name>.strategy.ts`                                 | `jwt.strategy.ts`                       |
| Constants            | `<name>.constants.ts` or `<name>.ts`                 | `metadata-keys.ts`                      |
| Utility              | `<name>.util.ts` or `<name>.ts`                      | `timezone.util.ts`                      |

- Match the established naming of the local area rather than imposing a second convention.

## 2 — Folders

| Aspect                   | Rule                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Feature folder           | **kebab-case**, singular by default (`event/`, `workshop/`, `participant/`)                                 |
| Collection-style feature | Plural only when the repository already uses plural naming there (`enrollees/`)                             |
| Child resource folder    | Same convention as a top-level feature, nested under the parent (`event/workshop/`, `workshop/attendance/`) |
| Shared subfolders        | Fixed names: `constants/`, `decorators/`, `dto/`, `types/`, `utils/`, `schemas/`, `guards/`, `strategies/`  |

## 3 — Classes and types

| Entity                  | Naming                                                               | Export     |
| ----------------------- | -------------------------------------------------------------------- | ---------- |
| Module class            | PascalCase + `Module` (`EventModule`)                                | named      |
| Controller class        | PascalCase + `Controller` (`EventController`)                        | named      |
| Service class           | PascalCase + `Service` (`EventService`)                              | named      |
| DTO class               | PascalCase + descriptive suffix (`CreateEventDto`, `UpdateEventDto`) | named      |
| Mongoose schema class   | PascalCase entity name (`Event`, `Workshop`, `Participant`)          | named      |
| Document type           | PascalCase + `Document` (`EventDocument`)                            | named type |
| Schema factory constant | PascalCase entity + `Schema` (`EventSchema`)                         | named      |
| Embedded schema class   | PascalCase (`FormItem`, `LocationEmbed`)                             | named      |
| Guard class             | PascalCase + `Guard` (`AdminGuard`, `JwtAuthGuard`)                  | named      |
| Filter class            | PascalCase + `Filter` (`HttpExceptionFilter`)                        | named      |
| Strategy class          | PascalCase + `Strategy` (`JwtStrategy`)                              | named      |
| Custom decorator        | PascalCase function (`Public`, `CurrentUser`, `IdempotencyKey`)      | named      |
| Shared type             | PascalCase (`ErrorResponse`, `EmailPayload`, `User`)                 | named type |
| Metadata key constant   | SCREAMING_SNAKE_CASE (`IS_PUBLIC_KEY`, `IDEMPOTENCY_KEY_HEADER`)     | named      |

- Use `export type` (or `import type`) for anything that is purely a type.
- Do not use default exports anywhere.

## 4 — Methods

| Context                | Naming                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------- |
| Service CRUD methods   | camelCase verb + entity (`createEvent`, `getEvent`, `updateEvent`, `deleteEvent`)     |
| Service query methods  | camelCase verb describing the query (`getAllPublicEvents`, `listEnrolleesByWorkshop`) |
| Controller methods     | camelCase mirroring the service method name                                           |
| Private helper methods | camelCase prefixed by the action (`resolvePath`, `buildLookup`, `assertOwnership`)    |
| Event handlers         | camelCase + handler verb (`handleSubscription`, `onPaymentSucceeded`)                 |

- Controller method names should align 1:1 with the service method they call.
- Avoid generic names like `handle`, `process`, or `execute` without a domain qualifier.

## 5 — Enums

- Enum names: PascalCase (`EventType`, `Role`, `WorkshopStatus`).
- Enum member keys: SCREAMING_SNAKE_CASE.
- Enum member string values:
    - **PascalCase** for user-facing display enums (`GENERAL = "General"`, `WORKSHOP = "Workshop"`).
    - **lowercase** for role-like / identifier enums (`ADMIN = "admin"`, `USER = "user"`).
- Do not mix both casings within the same enum.
- One enum per concern per file. Group tightly related enums only when they are consumed together.

## 6 — Validation, error, and success messages

- All `class-validator` message strings use **kebab-case** (`"please-provide-a-name"`, `"start-date-invalid-format"`).
- All Mongoose schema `required` tuples and `validate.message` strings use **kebab-case**.
- All NestJS exception messages (`NotFoundException`, `BadRequestException`, etc.) use **kebab-case** and behave as translation keys (`"event-does-not-exist"`, `"workshop-not-accepting-registrations"`).
- Success response strings from service write operations follow the same pattern (`"event-created-successfully"`, `"workshop-deleted-successfully"`).
- Do not casually rename any public-facing message (validation, error, success). Clients may depend on it — Grep for usages first.

## 7 — Route paths and params

- Controller route prefix uses kebab-case and usually matches the folder name (`@Controller("event")`, `@Controller("workshop")`).
- Path params are camelCase when multi-word (`:workshopId`, `:eventId`).
- Keep param names stable. Guards and services may read them by name.
- Prefer nested route shapes that reflect resource structure (`/event/:eventId/workshop/:workshopId`).

## 8 — Database naming

- Schema class names mirror domain naming (singular, PascalCase).
- Foreign-key fields follow `<parent>Id` exactly (`eventId`, `workshopId`, `participantId`). No variations like `event_id`, `eventID`, or `parentEvent`.
- Index names are auto-generated by Mongoose. If custom naming is required, use kebab-case.

## 9 — Environment variables

- Environment variable names use **SCREAMING_SNAKE_CASE** (`MONGO_URI`, `CLERK_SECRET_KEY`, `SENDGRID_API_KEY`).
- Group by vendor or concern prefix (`AWS_`, `CLERK_`, `SENDGRID_`, `SENTRY_`).
- Do not rename env vars casually. Audit `ConfigService.get(...)` usage and deployment configs first.
