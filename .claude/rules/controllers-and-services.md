# Controllers and services

Controllers are transport. Services are business logic. The split is strict. This file defines both contracts, plus the orchestration and transaction rules that services must follow.

## 1 — Controller contract

A controller method does exactly five things:

1. **Define the route** — method verb decorator (`@Get`, `@Post`, `@Patch`, `@Put`, `@Delete`) and path.
2. **Bind the request** — `@Body()`, `@Query()`, `@Param()`, `@Headers()`, `@Req()`, `@UploadedFile()` as needed, typed to DTOs.
3. **Apply guards and decorators** — `@UseGuards(...)`, `@Public()`, `@CurrentUser()`, `@IdempotencyKey()`, rate limiting overrides.
4. **Call the service** — one call to `this.<feature>Service.<method>(...)`.
5. **Return the result** — the service's return value, or a transport-specific response when required.

### 1.1 Hard rules

- **Zero business logic in controllers.** No conditionals on domain state, no multi-step orchestration, no vendor SDK calls, no database queries, no cross-feature composition.
- **No direct vendor SDK access.** Vendor calls go through `modules/integration/` services, and those services are consumed by **domain services**, not controllers.
- **No direct `process.env` reads.** Config flows through `ConfigService`, and only infrastructure layers read it.
- **No repeated inline preconditions.** If the same check appears in multiple routes, promote it to a guard or a shared service call.
- **Inject only the feature's own service** in the controller constructor. If you find yourself injecting a second service, rethink the design — services can call services, controllers should not compose them.
- **Never leak raw exceptions, stack traces, vendor payloads, or database internals** to the response. Let global exception filters shape the response. See `rules/error-handling.md`.

### 1.2 Route shape

- Prefer route shapes that reflect resource structure: `/event`, `/event/:eventId`, `/event/:eventId/workshop`, `/event/:eventId/workshop/:workshopId`.
- Path params use camelCase when multi-word (`:workshopId`, not `:workshop_id` or `:workshopid`).
- Keep param names stable. Guards and services may read `request.params[...]` by name — renaming is a cross-cutting change.

### 1.3 Auth decorators

- Public routes must be **explicitly** marked with the repository's public marker (`@Public()`). The default is authenticated.
- Admin-only endpoints apply the global admin guard (`@UseGuards(AdminGuard)`).
- Resource-scoped authorization uses feature-local guards applied at method level.
- Unused auth params exist only to activate a guard — prefix them with `_` (e.g., `_user: User`).

### 1.4 Manual response handling

- Allowed only when transport requires it: streaming, file downloads, SSE, or framework-specific response piping.
- In those cases, document why briefly (one-line comment) and still keep all decisions-making inside the service.

### 1.5 Controller example shape (reference, not a template to copy blindly)

```ts
@Controller("event")
export class EventController {
    constructor(private readonly eventService: EventService) {}

    @Post()
    @UseGuards(AdminGuard)
    createEvent(@Body() dto: CreateEventDto, @CurrentUser() user: User, @IdempotencyKey() idempotencyKey: string) {
        return this.eventService.createEvent(dto, user, idempotencyKey);
    }

    @Get(":eventId")
    @Public()
    getEvent(@Param("eventId") eventId: string) {
        return this.eventService.getEvent(eventId);
    }
}
```

## 2 — Service contract

Services own business logic, orchestration, persistence flow, and coordination with integration services.

### 2.1 Hard rules

- Services are the **default home for state transitions**.
- Services are the only place where write orchestration, business-state validation, multi-document transactions, and domain workflows live.
- Services depend on integration services (`SqsService`, `SendgridService`, `S3Service`, `ClerkService`) — never on raw vendor SDKs.
- Services throw **framework-native NestJS exceptions** with kebab-case messages. See `rules/error-handling.md`.
- Services use the repository's `Logger` with a context string: `new Logger("service-<feature>")`.

### 2.2 Standard method ordering

Every service method that mutates state should follow this order:

1. **Resolve dependencies** — load the parent aggregate or required context first.
2. **Existence check** — throw `NotFoundException("...-does-not-exist")` if the resource is missing.
3. **Authorization / ownership check** — throw `ForbiddenException(...)` when the user cannot act on the resource. (Coarse auth is already handled by guards; this step enforces fine-grained domain rules.)
4. **Business-state check** — registration windows, publication state, idempotency pre-check, parent-child validity.
5. **Durable write** — the primary database mutation, inside a transaction if multi-document.
6. **Non-critical side effects** — fire-and-forget SQS, email, webhook dispatch. Wrapped in `void ...`.
7. **Return** — kebab-case success string for writes, document or DTO for reads.

### 2.3 Comment every logical block

- Every logical step in a service method gets a comment on the line **above** it.
- Pattern: `// <Verb> <what>` — e.g., `// Get the workshop by event ID`, `// Check if the workshop exists`, `// Return success message`.
- Match the density of the surrounding code. If the feature is heavily commented, follow that. If it is not, keep the same level.
- Do not explain _what_ trivially obvious code does; comment the _intent_ and the _step_.

### 2.4 Service method example shape (reference)

```ts
async getWorkshop(eventId: string, workshopId: string) {
    // Get the workshop by event ID and workshop ID
    const workshop = await this.workshopModel.findOne({ _id: workshopId, eventId });
    // Check if the workshop exists
    if (!workshop) throw new NotFoundException("workshop-does-not-exist");
    // Return workshop
    return workshop;
}
```

```ts
async createWorkshop(eventId: string, dto: CreateWorkshopDto, idempotencyKey: string) {
    // Get the parent event
    const event = await this.eventModel.findById(eventId);
    // Check if the event exists
    if (!event) throw new NotFoundException("event-does-not-exist");
    // Check idempotency — return existing record if retry
    const existing = await this.workshopModel.findOne({ idempotencyKey }).select("+idempotencyKey");
    if (existing) return "workshop-created-successfully";
    // Create the workshop scoped to the event
    await this.workshopModel.create({ ...dto, eventId, idempotencyKey });
    // Publish a non-critical workshop-created event
    void this.sqsService.publishMessage({ type: "workshop.created", eventId, workshopId: dto.slug });
    // Return success message
    return "workshop-created-successfully";
}
```

### 2.5 Document mutation vs. direct update

- Use **direct updates** (`updateOne`, `findByIdAndUpdate`) for simple field updates after validation, where the logic is flat.
- Use **load-mutate-save** (`findById` → mutate document → `save()`) when document-level logic, conditional field handling, or subdocument operations make it clearer.
- Prefer whichever reads as one clear use case. Do not mix both styles in one method.

### 2.6 Transactions

- Use Mongoose sessions for any operation that must mutate multiple documents as a single unit (cascading deletes, bulk approvals, cross-collection state changes).
- Always open, commit/abort, and end the session in `try/catch/finally`:

```ts
const session = await this.connection.startSession();
session.startTransaction();
try {
    // Perform multi-document writes with { session }
    await session.commitTransaction();
    return "...-successfully";
} catch (err) {
    await session.abortTransaction();
    throw err;
} finally {
    await session.endSession();
}
```

- Inject the Mongoose connection via `@InjectConnection()`.
- Never trigger external side effects from inside a transaction. Fire them **after** the transaction commits.

### 2.7 Fire-and-forget side effects

- Use `void` for async operations that should not block the response (SQS publishes, email sends, non-critical webhooks):

```ts
void this.sqsService.publishMessage({ ... });
```

- The integration service catches, logs, and reports these errors to Sentry internally. The domain service does not await.
- If a side effect is business-critical (payment, subscription state change), it is **not** fire-and-forget — await it and handle failure as part of the primary flow.
- Do not trigger external side effects before the primary write succeeds, unless the product explicitly requires that order.

### 2.8 Idempotency

- Create flows that are retry-prone, webhook-like, or public-form-driven must accept an `idempotencyKey` parameter.
- Pre-check for an existing record keyed by `idempotencyKey` for a clean fast-path return.
- Back idempotency with a **unique Mongo index** on `idempotencyKey` as the final race-condition safety net. Pre-checks are not sufficient.
- Do not force idempotency onto every mutation. Use it where duplicate submission is a real risk.

### 2.9 Method size and splitting

- Keep service methods focused on **one use case**. Split when a method stops reading as one use case.
- Do not split trivial code just to satisfy an arbitrary size rule.
- Extract private helpers (`private resolveParent(...)`, `private assertOwnership(...)`) when the same sub-step is used by multiple methods within the service.
- Do not move primary business flow into schema hooks, ORM callbacks, middleware, or decorators unless the repository already uses that pattern intentionally.

### 2.10 Forbidden in services

- No direct vendor SDK imports. Go through `modules/integration/`.
- No `process.env` reads. Go through `ConfigService`.
- No HTTP response manipulation. That belongs to the controller's transport layer.
- No swallowing errors silently. Either handle and recover, or rethrow. Logged-and-dropped errors must use `this.logger.error(...)` + Sentry capture.
- No cross-feature persistence writes. If feature A needs to write to feature B's collection, it calls B's exported service method.
