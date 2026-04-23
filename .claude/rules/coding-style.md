# Coding style, TypeScript, verification, and forbidden patterns

This file covers the style rules, TypeScript discipline, comment conventions, verification expectations, and hard "do not do this" list. All of these apply on top of the feature-level rules in the rest of `.claude/rules/*.md`.

## 1 — Consistency is the highest priority

- **New code blends in.** Read nearby files in the same feature or layer before writing. Mirror their structure, naming, exports, imports, decorator usage, controller/service split, comment density, and error style.
- Do not introduce a second style next to an existing one. If the surrounding code is not ideal, **flag it separately** instead of "fixing" it inline.
- Where these rules are silent, follow **local precedent**.
- Divergence from project conventions requires direct user approval or an ADR.

## 2 — Clarity over cleverness

- Optimize for the reader. Prefer explicit branches over compressed cleverness when business logic matters.
- Prefer boring, maintainable code over generic, clever, or "future-proof" abstractions.
- Keep functions reasonably short, but do not split trivial code just to satisfy an arbitrary size rule.
- Name things so the reader does not need to jump to read the body to understand the call site.

## 3 — Do not overengineer

- No abstractions, base classes, factories, generic infrastructure, helper layers, or reusable utilities unless the current task materially needs them.
- No speculative "what if we need this later" extensibility.
- No half-finished implementations.
- No error handling for scenarios that cannot happen — trust internal code and framework guarantees. Validate only at real system boundaries (user input at DTOs, external APIs at integration services).
- No backwards-compat shims when you can just change the code. This is an internal codebase.
- No feature flags for hypothetical future requirements.
- Three similar lines is better than a premature abstraction.

## 4 — Comments

### 4.1 Service-method step comments

- Every logical step inside a service method gets a **one-line comment above it**.
- Pattern: `// <Verb> <what>`.

    ```ts
    // Get the workshop by event ID
    const workshop = await this.workshopModel.findOne({ _id: workshopId, eventId });
    // Check if the workshop exists
    if (!workshop) throw new NotFoundException("workshop-does-not-exist");
    // Return workshop
    return workshop;
    ```

- Match the density of the **surrounding file**. Heavily commented service? Add comments. Sparsely commented service? Keep it sparse.
- Comments describe the **step/intent**, not the mechanics the code already shows.

### 4.2 When to add a comment outside service methods

- Non-obvious intent.
- Invariants.
- Transaction boundaries.
- Business rules that are not self-evident.
- Workarounds for a specific bug or framework quirk.

### 4.3 When to never add a comment

- ❌ To narrate obvious code (`// increment i`).
- ❌ To describe what a well-named identifier already says.
- ❌ To reference the current task, ticket, or caller (`// added for issue #1234`, `// used by workshop flow`).
- ❌ Multi-paragraph docstrings on internal functions. One line is almost always enough.
- ❌ Comments out code for later. Delete it. Git history is the archive.

### 4.4 Legacy files

- If you are editing a legacy file with comment conventions different from these rules, **preserve the local comment style** for that file. Do not reformat comments opportunistically.

## 5 — TypeScript rules

- Target the repository's established TS config. `strictNullChecks` is expected. `ES2023` (or the project standard) is the target.
- Use `import type` for type-only imports.
- **Avoid `any`.** If a real type is available, use it. If a third-party type is missing, declare a minimal local type.
- If the repository already relaxes a TypeScript rule in a specific area, **follow the local constraint**. Do not opportunistically tighten it while doing unrelated work.
- Prefer `readonly` on class fields that never reassign (`private readonly logger = ...`, `private readonly connection: Connection`).
- Prefer `as const` for literal tuples and readonly arrays when it improves inference.
- Never use `ts-ignore` / `ts-expect-error` without a one-line comment explaining why.
- Do not cast to `any` to silence a type error. Diagnose the underlying cause.

## 6 — Imports

- Use the repository's established path alias for cross-module imports (commonly the `src/` prefix: `import { Role } from "src/common/enums"`).
- Use **relative imports** (`./`, `../`) inside a small local feature when that is the repository standard.
- Use `import type` for type-only imports.
- Avoid barrel files unless the repository already uses them intentionally.
- Group imports: external packages first, then project imports, then relative imports. Leave one blank line between groups. Follow Prettier/ESLint ordering if the project enforces it.

## 7 — Exports

- **Named exports only.** No default exports.
- One primary class, type, or function per file.
- If an existing legacy area uses default exports, do not churn files only to remove them.

## 8 — Unused parameters

- Parameters that exist only for guard activation (e.g., `@CurrentUser()` on an admin-guarded route that does not consume the user) get a `_` prefix: `@CurrentUser() _user: User`.
- TypeScript and ESLint should both accept the `_` prefix without warning.

## 9 — When to ask vs. when to autofix

### 9.1 Fix silently

- Trivial lint or formatting issues inside a file you are already editing.
- Obvious typos in comments or identifiers that are not part of a public contract.
- Automatically importing a missing symbol the task clearly needs.

### 9.2 Ask first

- Anything affecting business logic.
- Anything affecting API contracts (routes, DTO field names, error messages, response shapes, env keys).
- Anything affecting database schemas or indexes.
- Anything affecting module wiring or global providers (filters, guards, pipes).
- Introducing a new library dependency.
- Creating a new top-level folder or module.
- Ambiguous requirements, types, or edge cases.

## 10 — Verification (Definition of Done)

A task is **not done** when the code merely looks correct. It is done when the change is wired correctly, structurally consistent with the repository, and **verified** with the repository's actual commands.

### 10.1 Discover the project's scripts first

- Read `package.json` to find real script names. Typical: `npm run build`, `npm run lint`, `npm test`, `npm run start:dev`.
- Also check for `Makefile`, `justfile`, or CI config when scripts are not obvious.
- Use project scripts. Do not invent ad hoc command lines.

### 10.2 Narrow verification first

- For a narrow code change, run targeted verification: TypeScript build, ESLint on the changed file(s), focused tests.
- Prefer the narrowest meaningful check for the scope of the change.

### 10.3 Broaden verification for risky changes

When you change module wiring, DTOs, schemas, guards, filters, global providers, or shared contracts, run the higher-risk verification:

- Full build (`npm run build`).
- Full lint (`npm run lint`).
- Relevant test suites.
- Manual request if an integration-heavy endpoint is touched.

### 10.4 Reporting

- **Never** claim lint, tests, or builds passed unless they were actually run.
- Report what you ran and what the result was.
- If no useful automated verification exists for the change (pure config, documentation), say so explicitly.
- If automated tests are stale or commented out, do not treat them as the product specification. Ask the user whether behavior was intentional.
- For UI/frontend-adjacent backend changes, note explicitly that backend tests do not verify UI behavior.

## 11 — Forbidden patterns (change safety)

The items below are **hard rules**. Do not do them. They represent lessons from real incidents and keep the codebase coherent.

### 11.1 Architecture

- ❌ No second architectural style beside the existing one.
- ❌ No silent structural drift. New top-level folders require user approval when an existing feature or shared area is the correct home.
- ❌ No new top-level framework (tRPC, raw Express, GraphQL) alongside NestJS.
- ❌ No `@nestjs/microservices` decomposition unless the user explicitly requests it.

### 11.2 Layering

- ❌ No business logic in controllers, guards, filters, or decorators.
- ❌ No direct vendor SDK calls from controllers or domain services. Go through `modules/integration/`.
- ❌ No `process.env` reads in domain code. Go through `ConfigService`.
- ❌ No schema hooks (`pre("save")`, etc.) carrying primary business flow unless the project already standardizes that pattern.

### 11.3 Contracts

- ❌ No renames of route params, public error messages, DTO field names, response fields, or env keys without auditing downstream usage first.
- ❌ No changes to the `ErrorResponse` shape without user approval.
- ❌ No breaking public contract changes in a task that was scoped as internal.

### 11.4 Scope

- ❌ No unrelated refactors mixed into a feature task. If you notice something worth fixing outside the task, flag it separately.
- ❌ No bulk reformatting, reordering, or reorganizing beyond the change scope.
- ❌ No converting existing default exports to named exports (or vice versa) while doing unrelated work.

### 11.5 Shared code

- ❌ No feature models, feature schemas, or feature authorization rules in `common/`.
- ❌ No dumping helpers in `common/` that are only used by one feature.

### 11.6 Testing / verification

- ❌ No claiming tests pass without running them.
- ❌ No treating stale or abandoned tests as the product specification.
- ❌ No skipping hooks (`--no-verify`, `--no-gpg-sign`) to get a commit through. If a hook fails, fix the underlying issue.

### 11.7 Destructive actions

- ❌ No `git reset --hard`, `git push --force`, branch deletions, file deletions outside scope, or database-level destructive operations without explicit user confirmation.
- ❌ No amending a previously pushed commit unless the user explicitly asks.

## 12 — Communication charter

- Keep text output short and concise. One-sentence updates at key moments, not running commentary.
- Reference files with markdown links so the user can jump: `[event.service.ts](src/modules/event/event.service.ts:42)`.
- End of turn: one or two sentences summarizing what changed and what's next. No more.
- Ask clarifying questions early. Silent assumptions cause rework.
