# Backend Agent — apps/api

You own `apps/api` and `prisma/`. You change `packages/shared` and `docs/API_*` only through `/contract-change`. You never edit `apps/web`.

## Stack

- Node.js 20, Express, TypeScript (strict)
- Prisma + PostgreSQL 16, Redis + BullMQ for jobs
- Zod schemas from `@catering/shared` for every input and output
- `@asteasolutions/zod-to-openapi` → Swagger UI at `/api/docs`
- Vitest + Supertest

## Module layout

```
src/modules/<module>/
  <module>.routes.ts      # path, auth, role guard, validate(schema)
  <module>.controller.ts  # HTTP only: parse req, call service, send { data }
  <module>.service.ts     # business logic, transactions, no req/res
  <module>.repo.ts        # Prisma queries (optional for simple modules)
  <module>.test.ts        # contract + permission tests
src/lib/
  errors.ts               # AppError(code, status, message, details)
  auth.ts                 # requireAuth, requireRole(...roles)
  validate.ts             # zod middleware → 400 VALIDATION_ERROR with details.fields
  providers/              # payment, invoice, sms, storage — interface + mock + real
```

## Rules

- Validate every request body and query with the shared schema. Serialize every response through the shared output schema (strip unknown fields).
- Throw `AppError` with a code from `packages/shared/src/http.ts`. Never send a raw error. Messages in Hebrew.
- Every route declares its roles with `requireRole`. Default is deny.
- Money: integer agorot in DB (`Int`) and API. Totals only via `calcTotals()` from shared.
- Optimistic locking: editable entities have `version`. `PATCH`/`PUT` require it, mismatch → `409 VERSION_CONFLICT`, success → `version + 1`.
- Order status changes only through `orderStateMachine.transition()`. It also computes `allowedTransitions` per user role.
- `Idempotency-Key` is required on `POST /payments` and `POST /orders/:id/quote/send`. Store keys for 24h in Redis.
- Soft delete (`deletedAt`) for customers, orders, dishes. Default queries exclude deleted rows.
- Write an audit log entry for every change to orders, payments, and settings.
- External providers are behind interfaces. In dev and tests use the `mock` implementation.

## Tests required per endpoint

1. Happy path: response passes `Schema.parse()` from shared (contract test).
2. Validation error: 400 with `details.fields`.
3. Permission: one allowed role passes, one disallowed role gets 403.
4. Business rule errors that apply (e.g. `KASHRUT_CONFLICT`, `ORDER_LOCKED`).

## Contract changes

Use `/contract-change`. It updates `packages/shared`, `docs/API_CONTRACT.md` and `docs/API_CHANGELOG.md` together, and checks that `apps/web` still typechecks. Additive changes only, unless the human says a breaking change is agreed.
