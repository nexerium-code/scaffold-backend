# Authentication and authorization

Clerk is the default identity provider. The backend validates Clerk-issued JWTs; it does not own primary identity. Authorization splits cleanly between coarse guards and fine-grained service checks.

## 1 — Request flow

1. Client sends a Clerk-issued bearer token in the `Authorization: Bearer <token>` header.
2. `JwtAuthGuard` (registered globally via `APP_GUARD`) runs for every route unless `@Public()` is applied.
3. The NestJS JWT strategy (`JwtStrategy`) extracts the bearer token and validates it using the configured Clerk signing key (`CLERK_SECRET_KEY` or `CLERK_JWT_KEY` via `ConfigService`).
4. The strategy **normalizes** the raw Clerk payload into one shared authenticated user shape and attaches it to `request.user`.
5. Controllers and guards consume the **normalized `User` object**, never the raw JWT payload.

## 2 — The normalized `User` shape

Defined in `src/modules/auth/types/user.type.ts` (or the repository's equivalent):

```ts
export type User = {
    sessionId: string;
    userId: string;
    role: Role;
    permissions?: string[];
    // plus any resource-scoped access metadata the backend actually consumes
};
```

- Include identifiers and authorization metadata the backend actually uses. Do not pad with unused fields.
- The shape is a contract — treat it as public across features.
- Do not add Clerk-specific fields (`sid`, `sub`, vendor flags) to this type. Keep vendor parsing inside the strategy.

## 3 — Strategy layer

File: `src/modules/auth/strategies/jwt.strategy.ts`

- Uses `passport-jwt` via `@nestjs/passport`.
- Registers under a named strategy (`"jwt"`) so `JwtAuthGuard` can reference it explicitly.
- Reads the signing key and issuer from `ConfigService.getOrThrow(...)`.
- `validate(payload)` normalizes the payload and returns the `User` object that becomes `request.user`.
- All Clerk-specific parsing — claim names, session extraction, role derivation — stays **inside** the strategy.

## 4 — Guards

All guards live in `src/modules/auth/guards/` (global) or inside a feature (`src/modules/<feature>/<feature>.guard.ts`).

### 4.1 Global guards (registered via `APP_GUARD`)

Standard registration order in `AppModule` (first registered runs first):

1. `ThrottlerGuard` — rate limiting.
2. `JwtAuthGuard` — authentication. Bypassed for routes marked `@Public()` (reads `IS_PUBLIC_KEY` metadata via `Reflector`).
3. `PermissionsGuard` (optional) — coarse role/permission check based on metadata decorators.

### 4.2 `AdminGuard` (or equivalent)

- Applied via `@UseGuards(AdminGuard)` at controller or method level.
- Checks `user.role === Role.ADMIN` (or the project's admin criterion).
- Coarse-grained only. Does **not** enforce domain-specific permissions.

### 4.3 Feature-local guards

- Live at `src/modules/<feature>/<feature>.guard.ts`.
- Enforce **resource-scoped authorization** tied to that feature (ownership checks, parent-child validity that must gate entry, tenant scoping).
- Applied via `@UseGuards(<Feature>Guard)` at method or controller level.
- May read route params to enforce the guard condition — this is why route param names must remain stable.

### 4.4 What guards are _not_ for

- ❌ Business-state workflow checks (publication state, registration window, payment status) — those go in the **service**.
- ❌ Multi-step orchestration — services.
- ❌ Vendor SDK calls — integration layer.
- ❌ Shaping the response — filters.

Rule of thumb: guards answer **"may this request enter this route?"** Services answer **"may this operation proceed against this domain state?"**

## 5 — Decorators

All auth decorators live in `src/modules/auth/decorators/` (or the project's `common/decorators/` area, matching local precedent).

### 5.1 `@Public()`

- Marks a route as unauthenticated.
- Sets metadata with a known key (`IS_PUBLIC_KEY`) that `JwtAuthGuard` reads via `Reflector.getAllAndOverride(...)`.
- Use sparingly — the default is authenticated.

### 5.2 `@CurrentUser()`

- Parameter decorator that returns the normalized `User` from `request.user`.
- Preferred signature: `@CurrentUser() user: User`.
- When the param exists only to activate a guard (e.g., admin-guarded route that does not use the user), prefix with `_`: `@CurrentUser() _user: User`.

### 5.3 `@IdempotencyKey()`

- Parameter decorator that extracts the idempotency-key header.
- Validates the key format at the boundary (throws `BadRequestException("idempotency-key-invalid")` when malformed).
- Applied on create endpoints that are retry-prone.

## 6 — Applying auth at the controller

```ts
@Controller("workshop")
export class WorkshopController {
    constructor(private readonly workshopService: WorkshopService) {}

    // Unauthenticated
    @Get(":workshopId/public")
    @Public()
    getPublicWorkshop(@Param("workshopId") workshopId: string) {
        return this.workshopService.getPublicWorkshop(workshopId);
    }

    // Admin-only, user not needed
    @Delete(":workshopId")
    @UseGuards(AdminGuard)
    deleteWorkshop(@Param("workshopId") workshopId: string, @CurrentUser() _user: User) {
        return this.workshopService.deleteWorkshop(workshopId);
    }

    // Authenticated + resource-scoped guard
    @Post(":workshopId/register")
    @UseGuards(WorkshopAccessGuard)
    registerForWorkshop(@Param("workshopId") workshopId: string, @Body() dto: CreateRegistrationDto, @CurrentUser() user: User, @IdempotencyKey() idempotencyKey: string) {
        return this.workshopService.registerForWorkshop(workshopId, dto, user, idempotencyKey);
    }
}
```

## 7 — Authorization in services

Services handle **fine-grained** authorization that depends on data:

- Ownership checks (`if (doc.ownerId !== user.userId) throw new ForbiddenException("not-allowed-to-edit")`).
- Tenant isolation (`if (doc.tenantId !== user.tenantId) throw new ForbiddenException("..."))`.
- Business-state gating (`if (event.status !== "published") throw new BadRequestException("event-not-published")`).

This belongs in the service because it requires loading the document and inspecting domain state. Keep it close to the code that performs the action.

## 8 — Route param stability

- Authorization often depends on route params (`:workshopId`, `:eventId`). Guards and services may read them by name.
- Do **not** rename route params casually. Grep for `@Param("oldName")` and `request.params["oldName"]` before any rename.
- When renaming is truly required, update guards, services, route definitions, and any downstream clients in the same change.

## 9 — Forbidden patterns

- ❌ Raw JWT payload parsing in controllers or domain services.
- ❌ Clerk-specific fields leaking into domain code.
- ❌ Business workflow checks inside guards.
- ❌ Domain orchestration inside decorators.
- ❌ Two parallel auth stacks (e.g., Clerk + a second identity provider) unless the user explicitly asks.
- ❌ Adding `bcrypt` unless the backend actually stores local password hashes.
- ❌ Reading `CLERK_SECRET_KEY` or any other auth config via `process.env` directly. Always through `ConfigService`.
