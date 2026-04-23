# DTOs and validation

DTOs are the application's transport-level contract. They define what the outside world may send, what a response looks like, and what validation the application trusts at the boundary. This file covers DTO design, `class-validator` usage, and API contract stability.

## 1 — DTO placement

- **Feature-local DTOs** live in `src/modules/<feature>/dto/`.
- **Shared DTOs** reused across features live in `src/common/dto/`.
- Do not place feature-specific DTOs in `common/` just because another feature _might_ use them one day. Promote to shared only when reuse is real.
- One DTO per file. File name follows the kebab-case convention (`create-<feature>.dto.ts`, `update-<feature>.dto.ts`, `<sub-object>.dto.ts`, `get-<purpose>.dto.ts`).

## 2 — Create / Update DTO pattern

- **Create DTO** defines required input for a creation flow. Use `class-validator` decorators on every field with an explicit **kebab-case** `message`.
- **Update DTO** is derived via `PartialType(Create<Feature>Dto)` from `@nestjs/mapped-types`. The file should contain nothing else:

    ```ts
    import { PartialType } from "@nestjs/mapped-types";
    import { CreateEventDto } from "./create-event.dto";

    export class UpdateEventDto extends PartialType(CreateEventDto) {}
    ```

- If you need a partial that omits some fields, use `PartialType(OmitType(CreateEventDto, ["...",  "..."] as const))`.

## 3 — `class-validator` rules

- Every field on every DTO must have at least one validator. No undeclared fields.
- Every validator must have an explicit **kebab-case `message`**:

    ```ts
    @IsNotEmpty({ message: "please-provide-a-name" })
    @MaxLength(120, { message: "name-too-long" })
    name: string;

    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "start-date-invalid-format" })
    startDate: string;

    @IsEnum(EventType, { message: "event-type-invalid" })
    type: EventType;

    @IsOptional()
    @IsMongoId({ message: "workshop-id-invalid" })
    workshopId?: string;
    ```

- Validation messages are translation keys. They must be stable, specific to the failing field, and lowercase with hyphens.
- Do not use generic messages like `"Bad request"`, `"Invalid"`, `"Field is required"`.
- Never change a published validation message casually. Clients may switch on it.

## 4 — Nested DTOs

For nested objects or arrays of objects, define a separate DTO and validate the nested structure:

```ts
export class TargetDto {
    @IsMongoId({ message: "target-id-invalid" })
    id: string;

    @IsEnum(TargetType, { message: "target-type-invalid" })
    type: TargetType;
}

export class CreateNotificationDto {
    @IsString({ message: "title-must-be-string" })
    @IsNotEmpty({ message: "please-provide-a-title" })
    title: string;

    @IsArray({ message: "targets-must-be-array" })
    @ArrayMinSize(1, { message: "please-provide-at-least-one-target" })
    @ValidateNested({ each: true })
    @Type(() => TargetDto)
    targets: TargetDto[];
}
```

- Always pair `@ValidateNested({ each: true })` with `@Type(() => Dto)` from `class-transformer`.
- Nested DTOs live in the same `dto/` folder when feature-local, or in `common/dto/` when shared.

## 5 — Global ValidationPipe

- The global `ValidationPipe` is configured in `main.ts` with:

    ```ts
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true
        })
    );
    ```

- **`transform: true`** — incoming plain objects become DTO class instances. Type coercion happens here.
- **`whitelist: true`** — properties not decorated on the DTO are stripped.
- **`forbidNonWhitelisted: true`** — unknown properties cause a `BadRequestException`. This rejects extra fields at the boundary.
- Do not override these globally without a strong reason.

## 6 — Runtime (dynamic) validation

- Use `class-validator` decorators for normal, statically-shaped DTOs.
- Use **Zod** (or the repository's established runtime-validation library) only when the payload shape is **dynamic**, runtime-defined, or schema-composed (e.g., form-builder submissions, config-driven payloads).
- Do not force all validation into decorators when the real problem requires runtime schema composition.
- Do not replace `class-validator` with Zod across the codebase. Zod is a secondary tool for specific cases.

## 7 — Schema-level validation is a secondary safety net

- DTO validation is the **primary** boundary.
- Mongoose schema validators (`required`, `enum`, `match`, `validate`) are a **secondary** safety net behind DTOs.
- When both exist, keep messages consistent (kebab-case translation keys). See `rules/persistence.md`.

## 8 — Response shape stability

- **Write operations** typically return a stable kebab-case success string (`"event-created-successfully"`).
- **Read operations** return structured domain data — either the Mongoose document or an explicitly shaped object.
- **Special cases** (signed URLs, stats aggregations, streams, token exchanges, file uploads) may return a purpose-specific response object. Define a clear response type and keep it stable.
- Do not casually change response shapes. Clients are coupled to them.

## 9 — API contract stability

- DTO field names, validation messages, route paths, path param names, and response field names are **public contracts**.
- Before renaming any of them: Grep the codebase, check client repos if referenced, and ask the user. Document the migration plan.
- When you must rename, prefer additive changes (add the new field, deprecate the old, remove after clients migrate) over in-place rewrites.

## 10 — Forbidden patterns

- ❌ No undocumented fields on DTOs (every field validated).
- ❌ No missing `message` on validators.
- ❌ No English-prose validation messages. Always kebab-case.
- ❌ No business logic inside DTOs or class-validator custom validators. DTOs validate _shape_, not _workflow_.
- ❌ No mixing update DTOs that re-declare fields. Always derive from create via `PartialType`.
- ❌ No circular DTO imports. If two DTOs need the same nested shape, extract it into `common/dto/` or a sibling DTO file.
