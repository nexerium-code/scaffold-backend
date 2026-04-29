# Feature workflow

This is the canonical flow for building any new feature or child resource. Every feature follows the same pipeline:

**schema → DTO → service → controller → module wiring → verification**

All business logic lives in the service. The controller is a thin transport adapter. The module is composition only.

Before starting, use Read/Grep/Glob to inspect **at least one** nearby existing feature and mirror its structure, decorator usage, comment density, and error style. Do not invent a parallel shape.

## 0 — Before you write code

- Use Read/Grep/Glob to inspect the nearest existing feature in `src/modules/` and copy its shape.
- Use TodoWrite to list the steps for the feature (module, schema, DTOs, service methods, controller routes, guards, verification). Mark each task `in_progress` / `completed` as you go.
- Ask the user for any ambiguous contract, authorization boundary, or persistence decision before writing code. Clarifying questions are cheaper than rework.

## 1 — Directory skeleton

Create the feature under `src/modules/<feature>/`:

```text
src/modules/<feature>/
  dto/
    create-<feature>.dto.ts
    update-<feature>.dto.ts
  schemas/
    <feature>.schema.ts
  <feature>.module.ts
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.guard.ts            # only if the feature needs a feature-local guard
```

For a child resource of `<feature>`:

```text
src/modules/<feature>/<child>/
  dto/
  schemas/
  <child>.controller.ts
  <child>.service.ts
  <child>.guard.ts              # optional
```

## 2 — Schema (Mongoose)

File: `src/modules/<feature>/schemas/<feature>.schema.ts`

| Step                | Rule                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Schema class        | `@Schema({ timestamps: true })` on a PascalCase class matching the entity name (`Event`, `Workshop`).                  |
| Fields              | `@Prop({ type: ..., required: [true, "kebab-case-message"], ... })` for each persisted field. Explicit `type` always.  |
| Document type       | Export `export type <Entity>Document = HydratedDocument<<Entity>>`.                                                    |
| Factory             | Export `export const <Entity>Schema = SchemaFactory.createForClass(<Entity>)`.                                         |
| Parent refs         | Use `@Prop({ type: MongooseSchema.Types.ObjectId, ref: "<ParentEntity>", required: [true, "..."] })`. Name the field `<parent>Id`; use `Types.ObjectId` for the TypeScript property type. |
| Embedded schemas    | Separate `@Schema({ _id: false })` class, referenced as `@Prop({ type: [SubSchema], default: [] })`.                   |
| Indexes             | Add `<Entity>Schema.index({ ... }, { unique: ... })` after the factory call. Compound indexes live next to the schema. |
| Validation messages | All `required` tuples and `validate.message` strings are **kebab-case**.                                               |
| Hidden fields       | Sensitive/internal fields (`idempotencyKey`, private codes) use `select: false`.                                       |

See `rules/persistence.md` for the full schema design contract.

## 3 — DTOs (validation layer)

Files in `src/modules/<feature>/dto/`:

| File                      | Purpose                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `create-<feature>.dto.ts` | `class-validator`-decorated class defining required input for creation. Every decorator has a kebab-case `message`. |
| `update-<feature>.dto.ts` | `export class Update<Feature>Dto extends PartialType(Create<Feature>Dto) {}`. Nothing else.                         |
| `<sub-object>.dto.ts`     | Separate DTO for embedded objects, referenced via `@ValidateNested({ each: true })` + `@Type(() => SubDto)`.        |
| `get-<purpose>.dto.ts`    | Purpose-specific query/response DTOs when they don't fit create/update.                                             |

- Shared DTOs reused across features live in `src/common/dto/`, not inside a single feature.
- See `rules/dtos-and-validation.md`.

## 4 — Service (business logic)

File: `src/modules/<feature>/<feature>.service.ts`

| Step                         | Rule                                                                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decorator                    | `@Injectable()`.                                                                                                                                                        |
| Logger                       | `private readonly logger = new Logger("service-<feature>");` as the first class field.                                                                                  |
| Constructor DI               | Inject Mongoose models via `@InjectModel(Entity.name)`, plus `ConfigService`, integration services, or other feature services as needed.                                |
| One method per use case      | `async createFeature`, `async getFeature`, `async updateFeature`, `async deleteFeature`, plus query methods as needed.                                                  |
| Comment every logical block  | Above each step, `// <Verb> <what>`. Match the density of the surrounding service files.                                                                                |
| Ordering inside a method     | 1) resolve parent / load resource → 2) existence + authorization + business-state checks → 3) durable writes → 4) non-critical side effects → 5) return result.         |
| Exceptions                   | Throw NestJS built-ins (`NotFoundException`, `BadRequestException`, `ForbiddenException`, `ConflictException`) with **kebab-case** messages.                            |
| Success returns              | Write operations return a kebab-case success string (`"event-created-successfully"`). Read operations return the document or DTO.                                       |
| Idempotency                  | Create flows accept an `idempotencyKey`, pre-check for an existing record, rely on a unique Mongo index as the final safety net.                                        |
| Transactions                 | Use Mongoose sessions for multi-document writes (cascading deletes, batched approvals). Wrap in `try/catch/finally`, abort on error, and always `session.endSession()`. |
| Fire-and-forget side effects | `void this.sqsService.publishMessage(...)` for non-critical work. Errors handled inside the integration service.                                                        |

See `rules/controllers-and-services.md` for the full service contract.

## 5 — Controller (transport layer)

File: `src/modules/<feature>/<feature>.controller.ts`

| Step                     | Rule                                                                                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route prefix             | `@Controller("<feature>")` using the kebab-case resource name.                                                                                             |
| Constructor DI           | Inject **only** the feature's own service.                                                                                                                 |
| Auth decorators          | `@Public()` for unauthenticated endpoints. `@UseGuards(AdminGuard)` for admin-only. Feature-local guards for resource-scoped authorization.                |
| User decorator           | `@CurrentUser() user: User` when the method needs the authenticated user. Prefix with `_` (e.g., `_user`) when the param exists only for guard activation. |
| Idempotency decorator    | `@IdempotencyKey() idempotencyKey: string` on create endpoints that require retry safety.                                                                  |
| DTOs                     | `@Body()`, `@Query()`, `@Param()` typed to feature DTOs. Validation happens automatically via the global `ValidationPipe`.                                 |
| Zero business logic      | Every method is a one-liner (or near) that delegates to the service: `return this.featureService.createFeature(dto, user, idempotencyKey);`.               |
| Manual response handling | Allowed only when transport requires it (streaming, file download, SSE, framework-specific response piping). Otherwise return the service result.          |

See `rules/controllers-and-services.md` and `rules/auth.md` for the full controller contract.

## 6 — Module wiring

File: `src/modules/<feature>/<feature>.module.ts`

```ts
@Module({
    imports: [
        MongooseModule.forFeature([{ name: <Entity>.name, schema: <Entity>Schema }]),
        // Only features whose exported services this feature consumes:
        // e.g., IntegrationModule, AuthModule if its public exports are needed.
    ],
    controllers: [<Feature>Controller],
    providers: [<Feature>Service],
    exports: [<Feature>Service], // only if other features genuinely need it
})
export class <Feature>Module {}
```

Then import `<Feature>Module` into `src/app.module.ts`.

- **Do not** register the feature's Mongoose model globally in `AppModule`. Register it in the feature module.
- **Do not** export internal files, schemas, or repositories across modules. Export the service only when another feature needs its behavior.

## 7 — Guards (feature-local)

File: `src/modules/<feature>/<feature>.guard.ts`

- Use for resource-scoped authorization tied to this feature (ownership checks, parent-child validity checks that must gate entry).
- Keep business-state checks (publication state, registration windows) in the **service**, not the guard.
- Apply via `@UseGuards(<Feature>Guard)` at method or controller level.
- See `rules/auth.md`.

## 8 — Child resources

- Place child resources under the parent feature (`src/modules/<feature>/<child>/`) when they share the parent's authorization or persistence boundary.
- The child controller routes nest under the parent (`@Controller("<feature>/:<parent>Id/<child>")` or equivalent).
- The child service loads the parent aggregate first, then operates on the child collection scoped by `<parent>Id`.
- Do not promote a child to a top-level module unless it genuinely becomes an independent domain.

## 9 — Verification (Definition of Done)

A task is not done when the code merely looks correct. Before reporting completion:

1. **Discover scripts** — Read `package.json` once for the real verification commands.
2. **Narrow verification first** — run targeted TypeScript check, lint, or focused tests for the file/feature you changed. Use the project's scripts (e.g., `npm run build`, `npm run lint`, `npm test -- <path>`).
3. **Broaden for risky changes** — if you touched module wiring, global providers, DTOs, schemas, guards, or shared contracts, run a broader build/lint/typecheck.
4. **Never claim verification passed unless it was actually run.** Report what you ran and what passed.
5. If no useful automated verification exists for the change (e.g., a pure config tweak), say so explicitly.
6. For UI-integrated changes, explicitly note that backend tests do not verify UI behavior.

See `rules/coding-style.md` §Verification for the full contract.

## 10 — Quick checklist before you call the task done

- [ ] Files placed under `src/modules/<feature>/` following the directory skeleton.
- [ ] Naming conforms to `rules/naming-conventions.md` (kebab-case files, PascalCase classes, camelCase methods).
- [ ] Mongoose model registered in the **feature** module, not the root module.
- [ ] Feature module imported in `AppModule`.
- [ ] All validation / error / success strings are kebab-case.
- [ ] Controller is a thin dispatcher with zero business logic.
- [ ] Service methods have step-by-step `// <Verb> <what>` comments matching the surrounding code's density.
- [ ] No `process.env` reads inside domain code; config flows through `ConfigService`.
- [ ] No third-party SDK calls from controllers or domain services; all vendor calls go through `modules/integration/`.
- [ ] Existing public contracts (routes, DTO fields, error messages, env keys) unchanged unless the task explicitly required it.
- [ ] Verification actually executed. Results reported.
