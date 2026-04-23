# Configuration, environment, and dates

Two orthogonal concerns that both demand **centralization**. Configuration must flow through `ConfigService`. Business dates must flow through shared timezone-aware helpers. Neither may be accessed ad hoc by feature code.

## 1 — Configuration access

### 1.1 Hard rules

- All configuration and environment reads go through `@nestjs/config` `ConfigService`.
- **No direct `process.env` reads** in controllers, domain services, guards, DTOs, or schemas.
- Required values use `ConfigService.getOrThrow<T>("KEY_NAME")` — fail fast at construction or module init.
- Optional values use `ConfigService.get<T>("KEY_NAME")` with a documented default when appropriate.
- Integration and infrastructure layers (`modules/integration/`, `strategies/`, bootstrap) are the only places that read env config.
- Domain code receives config through injected infrastructure services, not through raw env reads.

### 1.2 Registering config at the root

In `AppModule`:

```ts
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true
            // validate with the repo's standard validator (joi or class-validator-based) if the project uses one
        })
        // ...other infrastructure and feature modules
    ]
})
export class AppModule {}
```

- `isGlobal: true` so features do not re-import `ConfigModule`.
- If the project has an env schema validator, use it. Fail fast at startup if required env is missing.

### 1.3 Env var naming

- SCREAMING_SNAKE_CASE: `MONGO_URI`, `CLERK_SECRET_KEY`, `SENDGRID_API_KEY`, `SQS_QUEUE_URL`, `AWS_REGION`.
- Vendor-prefixed: `AWS_*`, `CLERK_*`, `SENDGRID_*`, `SENTRY_*`.
- Stable. Do not rename an env var without auditing `ConfigService.get(...)` / `getOrThrow(...)` call sites and every deployment config (compose, k8s manifests, CI secrets).

### 1.4 Derived / computed config

- If a value is derived from env data and reused often (e.g., a constructed URL, a parsed list, a boolean flag), compute it **once** in the infrastructure or integration service that consumes it.
- Cache the derived value on the service instance. Do not recompute on every call.

### 1.5 Forbidden

- ❌ `process.env.FOO` anywhere in `src/modules/**` (feature code).
- ❌ `process.env.FOO` anywhere in `src/common/**` unless the file is a pure bootstrap utility.
- ❌ Direct env reads inside domain services, guards, or DTOs.
- ❌ Silently falling back to a default for a required value. Fail fast with `getOrThrow`.

## 2 — Dates, times, and time zones

### 2.1 Hard rules

- **Date-only values are business values, not UTC instants.** Treat `YYYY-MM-DD` as a business date, not an `ISO 8601` datetime.
- **Never** parse `YYYY-MM-DD` inputs with naive `new Date("2026-03-05")` — the JavaScript engine interprets that as UTC midnight, which is almost never what the business means.
- Use `date-fns-tz` (the project default) for all business timezone conversions.
- Centralize the **canonical business timezone** in a single constant or config value. Do not sprinkle `"Asia/Dubai"` or `"America/New_York"` literals across services.

### 2.2 Conversion helpers

Define shared timezone helpers in `src/common/utils/` (or the project's equivalent):

```ts
// src/common/utils/timezone.util.ts
import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz";

export const BUSINESS_TIMEZONE = "Asia/Dubai"; // or from ConfigService at bootstrap

export const businessDateToUtcStart = (dateOnly: string): Date => zonedTimeToUtc(`${dateOnly}T00:00:00`, BUSINESS_TIMEZONE);

export const businessDateToUtcEnd = (dateOnly: string): Date => zonedTimeToUtc(`${dateOnly}T23:59:59.999`, BUSINESS_TIMEZONE);
```

- All services that interpret `YYYY-MM-DD` inputs use these helpers.
- Do not duplicate timezone logic inside a service. If the helper doesn't cover your case, extend the helper.

### 2.3 Start-of-day and end-of-day

- Be explicit. A date range `2026-03-05 → 2026-03-05` means `[2026-03-05 00:00:00 business-tz, 2026-03-05 23:59:59.999 business-tz]` — **not** a single instant.
- Always call the right helper (`businessDateToUtcStart` vs. `businessDateToUtcEnd`). Do not silently use one for both.

### 2.4 Persistence

- Persist instants in **UTC** (or the project's clearly defined standard — follow what already exists).
- Mongoose stores `Date` as BSON datetime, which is UTC. That is the target representation.
- Do not persist `YYYY-MM-DD` strings for timeline-sensitive fields (event start, deadline). Convert at the boundary using the helper, store as `Date`.
- Purely calendrical fields (e.g., "payment anniversary day of month") may stay as integers or date-only strings — document the decision at the schema.

### 2.5 DTO-level date validation

- Validate `YYYY-MM-DD` format with `@Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "start-date-invalid-format" })`.
- Convert to UTC in the **service**, using the shared helper. Not in the DTO, not in the controller.

### 2.6 Reading dates for responses

- When returning dates to clients, use the repository's documented response format. If the project emits ISO 8601 UTC strings, do that. If it emits business-tz `YYYY-MM-DD`, use `utcToZonedTime(...)` + formatter.
- Do not mix formats within the same response.

### 2.7 Forbidden

- ❌ `new Date("2026-03-05")` anywhere in business code. Use the helper.
- ❌ Hardcoded timezone literals scattered across services. One canonical constant.
- ❌ Silent UTC assumptions for business date inputs.
- ❌ Mixing `moment` or `dayjs` into a `date-fns-tz`-standard project. Use the project default.

## 3 — Where to put timezone logic

- Canonical timezone constant: `src/common/utils/timezone.util.ts` (or project equivalent).
- Date helpers: same file.
- Never a feature-local copy. If a feature needs a behavior that doesn't exist, extend the shared helper.
