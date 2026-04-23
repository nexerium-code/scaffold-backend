# Backend Project Standard For Claude

This file is the entry point to the project's Claude instruction set. It, together with every file under `.claude/rules/*.md`, is loaded automatically into Claude's context. Treat everything in this folder as binding standards for how backend work is done in this repository, not suggestions.

The purpose of this ruleset is to make every backend project Claude touches converge on the **same structure, naming, boundaries, architecture, and maintenance quality**. These rules are written to be strict enough for Claude to follow directly and portable enough to drop into any backend repository that shares this engineering philosophy.

## 1. Instruction Model

- `.claude/CLAUDE.md` and `.claude/rules/*.md` are the authoritative target standard for engineering decisions in this repository.
- The current codebase is the authoritative source of truth for runtime behavior. These rules define the direction; the code defines what currently is.
- Do not create nested `CLAUDE.md` files, per-feature instruction overrides, or parallel rule folders unless the user explicitly asks for them.
- Treat any legacy instruction files (`AGENTS.md`, `.cursor/`, `TEAM_GUIDE.md`, old project docs) as historical reference only. The `.claude/` folder is the current source of truth for Claude.
- Do not rely on global Claude configuration to hold project standards. Project-specific rules live here.
- Reserve `.claude/settings.json` and `.claude/settings.local.json` for harness configuration (permissions, hooks, env). Do not put architecture or coding conventions there.

### When the codebase and these rules disagree

- **Narrow edits in an existing area** → preserve current behavior and match the local pattern, even when the local pattern deviates from these rules. Consistency with the surrounding file wins.
- **New modules, new files, or deliberate refactors** → follow this ruleset exactly.
- **Clearly broken local patterns** → do not silently "fix" them inside an unrelated task. Flag the inconsistency and ask before changing.

## 2. Operating Principles For Claude

- **Read before editing.** Always inspect nearby files in the same feature or layer before changing code. Use Read, Grep, and Glob. For broader exploration, delegate to the `Explore` agent rather than scanning many files in the main context.
- **Match the house style literally.** Mirror module structure, file placement, naming, exports, TypeScript patterns, controller/service split, guard/decorator usage, DTO shape, schema style, commenting style and density, error handling, and imports. Do not introduce a second style next to an existing one.
- **Prefer the smallest change that fully solves the task.** Do not silently refactor unrelated code. Do not mix an unrelated cleanup into a scoped task.
- **Preserve behavior unless the user explicitly asks to change it.** Public contracts (routes, DTO field names, error messages, env keys, exported service methods) are stable surfaces. Audit downstream usage with Grep before renaming any of them.
- **Prefer explicit, boring code.** Avoid speculative abstractions, generic helper layers, factory indirection, base classes, and reusable utilities unless the current task materially needs them. Three similar lines is better than a premature abstraction.
- **Do not overengineer.** No half-finished implementations, no error handling for scenarios that cannot happen, no backwards-compat shims when the code can simply be changed, no feature flags for hypothetical future requirements.
- **Use parallel tool calls** when independent. Run Read/Grep/Bash calls that do not depend on each other in a single message.
- **Use TodoWrite to plan and track multi-step work.** Mark each task completed the moment it's done.
- **When a rule here is too generic for the current framework, apply the same boundary using the framework's native equivalent** rather than inventing a custom mechanism.
- **Use the project's own scripts and tooling** (`package.json` scripts, `Makefile`, task runners, CI config) for build/lint/test/verify. Discover them with Read/Glob before running ad hoc commands.
- **Prefer official framework and library documentation** over blogs, memory, or guesswork when behavior is in question. WebFetch/WebSearch to official docs is preferred over trusting memory for lifecycle, configuration, and integration details.

## 3. Explicit vs. Autonomous

- **Autofix silently** only trivial lint, formatting, or obvious typos inside files you are already editing.
- **Ask before** anything that affects business logic, API contracts, database schemas, folder structure, module wiring, guards, or public error messages.
- **Ask before** introducing a new top-level module, a new shared utility, a new library dependency, or a new architectural pattern.
- Clarifying questions always beat silent assumptions. When a requirement, type, or edge case is unclear, ask.

## 4. Priority Order When Rules Compete

When multiple instructions conflict, resolve in this order:

1. Preserve correctness and the user's explicit requirements for this turn.
2. Preserve existing runtime behavior unless change is explicitly requested.
3. Match the established pattern of the area being edited.
4. For new work, follow the target architecture defined in `.claude/rules/*.md`.
5. Prefer simpler and more maintainable code over clever or generic code.

## 5. Rule Files

Every file below is loaded with this one. Read the relevant file before acting on the concern it covers.

| File                                | Covers                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `rules/project-structure.md`        | Modular-monolith architecture, preferred directory layout, module design, shared code boundaries |
| `rules/framework-stack.md`          | NestJS standard, default library stack, Dockerization standard                                   |
| `rules/naming-conventions.md`       | File, class, type, method, enum, and message naming                                              |
| `rules/feature-workflow.md`         | End-to-end pipeline for building a new feature (module → schema → DTO → service → controller)    |
| `rules/controllers-and-services.md` | Controller thinness rules, service orchestration rules, transaction and side-effect ordering     |
| `rules/dtos-and-validation.md`      | DTO design, class-validator usage, API contract stability                                        |
| `rules/persistence.md`              | Mongoose schema design, fields, refs, embedded docs, indexing, query style                       |
| `rules/auth.md`                     | Clerk-issued JWT validation, guards, decorators, normalized user shape                           |
| `rules/integrations.md`             | Integration layer, idempotency, fire-and-forget side effects                                     |
| `rules/configuration-and-dates.md`  | Centralized config access, env var handling, timezone-aware date handling                        |
| `rules/error-handling.md`           | Exception types, global filters, public error response shape, logging and Sentry                 |
| `rules/coding-style.md`             | Comment style, readability, TypeScript rules, verification, forbidden patterns                   |
