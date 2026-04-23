# Error handling, filters, logging, and observability

This file defines how errors are thrown, caught, shaped, and logged. The public error response shape is **stable across all failures**, and internal logging is rich without leaking to clients.

## 1 — Exception types

- Use NestJS **built-in HTTP exceptions** exclusively: `NotFoundException`, `BadRequestException`, `ForbiddenException`, `UnauthorizedException`, `ConflictException`, `UnprocessableEntityException`, `InternalServerErrorException`.
- Do **not** create custom exception classes. The built-in set covers every case in this project.
- Use `HttpException` with a specific status only when the built-in set does not match (rare).
- Use `RpcException` from `@nestjs/microservices` **only** if the project explicitly uses the microservices transport. This is not part of the default standard — see `rules/framework-stack.md`.

## 2 — Exception message format

- All exception messages are **kebab-case** strings that serve as translation keys.
- Messages are descriptive, context-specific, and stable. Clients may switch on them.

```ts
// GOOD
throw new NotFoundException("workshop-does-not-exist");
throw new BadRequestException("workshop-not-accepting-registrations");
throw new ForbiddenException("not-allowed-to-edit-event");
throw new ConflictException("email-already-enrolled");

// BAD
throw new NotFoundException("Not found");
throw new BadRequestException("Bad request");
throw new NotFoundException("Workshop not found in database");
```

- Do not use sentences, punctuation, uppercase, or vendor-specific phrasing.
- Never embed dynamic data in the message string (ids, emails). Use structured logging for that.

## 3 — Public error response shape

All global exception filters produce a consistent `ErrorResponse`:

```ts
export type ErrorResponse = {
    statusCode: number;
    timestamp: string; // ISO 8601
    path?: string; // request URL
    message: string; // kebab-case translation key
};
```

- Defined in `src/common/types/error-response.type.ts` (or the project's equivalent).
- **Do not alter** this shape or add fields without user approval. Clients depend on it.
- Stack traces, raw exception objects, vendor payloads, secrets, database internals, and PII never appear in this response.

## 4 — Global exception filters

Filters are registered via `APP_FILTER` in `AppModule`. **Registration order determines priority — the last-registered filter wins**.

| Filter                 | Catches                                                                           | Public status             |
| ---------------------- | --------------------------------------------------------------------------------- | ------------------------- |
| `AllExceptionsFilter`  | Everything not caught by specific filters (register first).                       | `500`                     |
| `MongoExceptionFilter` | `MongooseError.ValidationError`, `CastError`, `MongoServerError` (duplicate key). | `422` / `400` / `409`     |
| `HttpExceptionFilter`  | `HttpException` and subclasses (register last, highest priority).                 | Preserves original status |

Order in `AppModule` providers (top to bottom):

```ts
providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: MongoExceptionFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
],
```

- `AllExceptionsFilter` is the fallback. It also integrates with Sentry (see §7).
- `MongoExceptionFilter` translates Mongoose/Mongo errors into the `ErrorResponse` shape with a sensible status:
    - `ValidationError` → `422`.
    - `CastError` → `400`.
    - Duplicate key (`MongoServerError` code `11000`) → `409` with a kebab-case message like `"duplicate-key"` or a schema-specific key.
- `HttpExceptionFilter` preserves the status from the thrown `HttpException` and produces the `ErrorResponse`.

Add new filters only when introducing a new exception category that the existing filters do not cover.

## 5 — Validation errors (class-validator)

- The global `ValidationPipe` throws `BadRequestException` on validation failure. `HttpExceptionFilter` catches it.
- The default NestJS validation error shape is replaced by the project's `ErrorResponse`: the filter flattens the first validation message into `message` (kebab-case).
- Because every validator carries a kebab-case `message`, client-facing output remains consistent.

See `rules/dtos-and-validation.md`.

## 6 — Service-level error pattern

Every service method follows this pattern:

```ts
async getWorkshop(eventId: string, workshopId: string) {
    // Get the workshop scoped by the parent event
    const workshop = await this.workshopModel.findOne({ _id: workshopId, eventId });
    // Check if the workshop exists
    if (!workshop) throw new NotFoundException("workshop-does-not-exist");
    // Return workshop
    return workshop;
}
```

- Fetch the resource. Immediately check existence. Throw `NotFoundException` if missing.
- For business-state failures, throw `BadRequestException("...-reason")`.
- For authorization failures, throw `ForbiddenException("...-not-allowed")`.
- For duplicate resource collisions (rare, usually the DB catches it), throw `ConflictException("...-already-exists")`.
- Write operations return a kebab-case success string. Read operations return the document or DTO.

See `rules/controllers-and-services.md` §2 for the full service contract.

## 7 — Logging

### 7.1 Logger usage

- Every service has a NestJS `Logger` as a private field:

    ```ts
    private readonly logger = new Logger("service-<feature>");
    ```

- Integration services use an integration-prefixed context: `new Logger("integration-sqs")`.
- Guards, filters, and infrastructure services use descriptive contexts (`"guard-admin"`, `"filter-all-exceptions"`).

### 7.2 When to log

- **Operational failures at the point of failure** — integration errors, retryable failures, non-critical side-effect errors.
- **Unexpected exceptions** — captured automatically by `AllExceptionsFilter` via Sentry.
- **Fire-and-forget side effects** that fail: `this.logger.error("...", { error, payload })` + `captureException(err)`.

### 7.3 Never log

- ❌ Secrets, tokens, passwords.
- ❌ Full sensitive payloads (PII, card details, full auth headers).
- ❌ Raw Clerk JWTs or other bearer tokens.
- ❌ Full request bodies when they may contain sensitive fields.

### 7.4 Log shape

- Prefer **structured, contextual logs** over vague string logs.
- Include the minimum context needed to reproduce: resource id, parent id, operation name. Not the full document.

## 8 — Sentry integration

- Sentry is integrated via `@sentry/nestjs`.
- Initialize Sentry in `src/instruments.ts` and import it at the **top** of `main.ts` before any framework imports:

    ```ts
    // src/main.ts
    import "./instruments";
    // ... then Nest imports
    ```

- `AllExceptionsFilter` uses `@SentryExceptionCaptured()` (or the equivalent decorator) to auto-report every unhandled exception it catches.
- For caught errors in non-critical paths (fire-and-forget SQS publishes, integration call failures), call `captureException(err)` manually inside the integration service.
- Do **not** send deliberately thrown user-facing exceptions (`NotFoundException("workshop-does-not-exist")`) to Sentry — they are expected control flow. The filter chain already distinguishes these.

## 9 — Fire-and-forget errors

- Fire-and-forget calls (`void this.sqsService.publishMessage(...)`) handle errors **inside the integration service**:

    ```ts
    try {
        await this.client.send(command);
    } catch (err) {
        this.logger.error("sqs-publish-failed", { error: err });
        captureException(err);
        // Do not rethrow. Fire-and-forget contract.
    }
    ```

- The caller never sees the error. The ops path sees it via Sentry + structured logs.

## 10 — Forbidden patterns

- ❌ Custom exception classes. Use NestJS built-ins.
- ❌ English-prose exception messages (`"Not found"`, `"Bad request"`).
- ❌ Exposing stack traces, vendor payloads, or database errors to clients.
- ❌ Filters that implement business logic or validation. Filters only translate responses.
- ❌ Logging secrets or sensitive payloads.
- ❌ Swallowing errors silently (`catch {}` with no log and no rethrow).
- ❌ Changing the `ErrorResponse` shape without user approval.
