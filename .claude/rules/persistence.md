# Persistence (MongoDB + Mongoose)

Default database: **MongoDB**. Default access layer: **Mongoose** via `@nestjs/mongoose`. This file defines the schema design contract, indexing strategy, and query/mutation style.

Do not introduce Prisma, TypeORM, Sequelize, Drizzle, raw SQL, or a second ORM stack unless the user explicitly approves the change.

## 1 — Placement

- Schemas live inside the **owning feature** at `src/modules/<feature>/schemas/<entity>.schema.ts`.
- Register models in the **feature module** via `MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }])`. Never register feature-owned schemas in `AppModule`.
- Indexes live next to the schema they belong to (same file, after `SchemaFactory.createForClass`).
- Embedded subdocument schemas live in the same `schemas/` folder as the parent (or colocated in the parent file when tiny and tightly coupled).
- Do not put domain models or schemas in `common/` unless they are genuinely shared across multiple features.

## 2 — Schema definition style

- Top-level schemas are **NestJS Mongoose classes** decorated with `@Schema()` and `@Prop()`.
- One main schema class per file. Tiny embedded helper schemas may share the file when they are tightly coupled to the parent.
- Class names are **singular PascalCase** for aggregate roots (`Event`, `Workshop`, `Participant`, `Feedback`).
- Top-level schemas use `@Schema({ timestamps: true })` — `createdAt` and `updatedAt` are part of the project standard.
- Embedded subdocument schemas use `@Schema({ _id: false })` when the subdoc should not carry its own identity.
- Always use **explicit `type`** in `@Prop(...)`. Do not rely on implicit inference when field shape matters.

### 2.1 Required export shape

```ts
@Schema({ timestamps: true })
export class Event {
    @Prop({ type: String, required: [true, "please-provide-a-name"], trim: true })
    name: string;

    @Prop({ type: String, enum: EventType, required: [true, "please-provide-event-type"] })
    type: EventType;

    @Prop({ type: Types.ObjectId, ref: "Organizer", required: [true, "organizer-id-required"] })
    organizerId: Types.ObjectId;

    @Prop({ type: String, required: true, select: false })
    idempotencyKey: string;
}

export type EventDocument = HydratedDocument<Event>;

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.index({ organizerId: 1, createdAt: -1 });
EventSchema.index({ idempotencyKey: 1 }, { unique: true });
```

- Export the class (named).
- Export `type <Entity>Document = HydratedDocument<<Entity>>`.
- Export `const <Entity>Schema = SchemaFactory.createForClass(<Entity>)`.
- Add indexes **after** the factory call.

## 3 — Field design

Every persisted field has an intentional shape, validation, and default.

- **Required fields** use the tuple form: `required: [true, "kebab-case-message"]`. Conditional requireds use a function: `required: [function () { return this.type === "scheduled"; }, "start-date-required-for-scheduled"]`.
- **String normalization**: apply `trim: true` and `lowercase: true` when the invariant belongs to the stored data (emails, slugs, codes).
- **Enums**: `enum: MyEnum` on enum-typed fields.
- **Pattern constraints**: `match: /regex/` for format invariants at the data layer.
- **Custom validators**: `validate: { validator: fn, message: "kebab-case-message" }`.
- **Optional fields**: prefer `default: undefined` when that produces cleaner documents and better conditional validation.
- **Boolean flags**: always explicit, `default: false` or `default: true`. Do not rely on absent fields to mean "false".
- **Computed defaults**: only when they are deterministic and clearly part of the data model.
- **Hidden fields**: use `select: false` for internal-only values (`idempotencyKey`, private codes, sensitive tokens) so they are not returned by default queries.
- Keep validation messages kebab-case and stable. See `rules/naming-conventions.md`.

## 4 — IDs, references, and relationships

- **Primary IDs** are Mongo `ObjectId`s unless there is a clear, justified reason to use a different type.
- **Parent-reference fields** are named `<parent>Id` exactly: `eventId`, `workshopId`, `participantId`, `provisionId`, `attendanceId`. No variations (`event_id`, `eventID`, `parent`, `parentEvent`).
- Parent refs declare `ref` explicitly: `@Prop({ type: Types.ObjectId, ref: "Event", required: [true, "..."] })`.
- **UUIDs** are acceptable for idempotency keys and special internal identifiers.
- **`select: false`** on hidden identifiers (idempotency keys, private codes) so they do not appear in default reads.
- **Prefer parent-scoped queries** (`{ _id: childId, parentId }`) over unconstrained global lookups.
- **Prefer explicit loads in services** over `populate`-heavy designs.
- **Do not** make `populate`, virtual populate, or autopopulate the default relationship strategy. When you need related data, load it explicitly in the service with a second query — it is clearer and easier to reason about.

## 5 — Embedded documents and dynamic shapes

- **Embedded subdocument schemas** for tightly owned nested structures with no independent lifecycle: entries, categories, targets, date ranges, form items, settings snapshots.
- **`type: [SubSchema]`** for ordered embedded collections with a known item shape.
- **`type: Map`** only when the shape is truly dynamic and keyed by runtime-defined field names. Use `Map` with an explicit `of` schema where possible.
- **`SchemaTypes.Mixed`** only for truly variable leaf values that cannot be modeled more precisely.
- Do not default to `Mixed` or loose `Map` when a concrete schema is practical.

## 6 — Validation layers

- **Schema validators** protect **data quality**. They catch invariants of the persisted data itself: required fields, enum membership, format constraints, parent-scoped uniqueness via indexes, embedded-array validity, conditional required fields.
- **DTO validators** validate **request shape** at the application boundary. See `rules/dtos-and-validation.md`.
- **Service code** validates **workflow and process rules**: registration windows, publication state, parent-child validity, ownership checks.
- Schema validators are a safety net **behind** DTO validation. They do not replace service orchestration.

## 7 — Indexing and uniqueness

- **Single-field uniqueness**: `@Prop({ ..., unique: true })`. This declares a unique index on the field.
- **Compound indexes and compound unique constraints**: after `SchemaFactory.createForClass`, call `<Entity>Schema.index({ field1: 1, field2: 1 }, { unique: true })`.
- **Parent-scoped uniqueness** is the common case for child resources. Examples: `{ email: 1, workshopId: 1 }` unique; `{ identification: 1, participantId: 1 }` unique.
- **Plain indexes** for frequently queried foreign keys and high-value lookup fields (`organizerId`, `eventId`, `createdAt` sort).
- **Keep indexes beside the schema definition** so they stay visible during changes.
- The **database** is the final uniqueness authority. Service pre-checks may short-circuit for cleaner error messages, but the unique index is the race-safe backstop.

## 8 — Query and mutation style

- **Query children through their parent boundary** whenever practical. For a parent-scoped route, ensure the parent exists before reading or mutating the child collection.
- **Avoid document graphs** that require broad eager loading to answer normal requests.
- **Keep reads explicit**. Prefer named projections, parent-scoped filters, and obvious query shapes.
- **Direct updates** (`updateOne`, `findOneAndUpdate`) for simple post-validation field updates.
- **Load-mutate-save** (`findById` → mutate → `save()`) when document-level logic, conditional subdocument handling, or middleware-style behavior is clearer that way.
- **Transactions** for multi-document atomic writes (cascading deletes, batched approvals, cross-collection state changes). See `rules/controllers-and-services.md` §Transactions.

## 9 — Schema safety (anti-patterns)

- ❌ Do not hide important persistence behavior in pre-save, post-save, or `pre("findOneAndUpdate")` hooks unless the repository explicitly standardizes that pattern. Writes should be traceable from the service.
- ❌ No autopopulate by default.
- ❌ No plugin magic that rewrites queries, injects fields, or mutates state invisibly.
- ❌ No over-normalization into many tiny collections without a clear query or lifecycle reason.
- ❌ No blind denormalization. Embed when ownership is tight and lifecycle is shared. Reference when lifecycle, cardinality, or query patterns make a ref cleaner.
- ❌ No feature models in `common/` unless they are genuinely shared across modules.

## 10 — Migrations and schema changes

- When adding a required field to an existing schema, coordinate with data: either provide a default, make it conditionally required, or plan a backfill.
- Renaming a persisted field is a contract change. Grep for the field name, check any downstream consumers, and plan a migration before editing the schema.
- Adding a unique index to an existing collection will fail if duplicates exist. Verify the data shape before merging.
- Never edit a schema file without also updating the indexes next to it if field semantics changed.

## 11 — Before editing any schema

- Use Read/Grep to find every consumer of the schema fields you are about to change.
- Use Grep to check for references by the Mongoose model name (`@InjectModel(Entity.name)`).
- Use Grep to check for raw queries that may hardcode field names.
- Ask the user before any rename, required-field addition, or index change on a production model.
