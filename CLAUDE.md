# Catering Management System — Agent Instructions

Two developers, two Claude Code agents: one works in `apps/web` (frontend), one in `apps/api` (backend). You never talk to the other agent directly. You coordinate only through files in this repo.

## Source of truth (read before any API-related task)

1. `packages/shared/src` — Zod schemas, types, enums, `calcTotals()`. This IS the contract in code.
2. `docs/API_CONTRACT.md` — the contract in prose, with JSON examples. Section numbers are referenced in tasks (e.g. "§5.2").
3. `docs/SPEC.docx` — product spec. Screens are numbered S01–S16.
4. `docs/WORKFLOW.md` — team process.

If `packages/shared` and `API_CONTRACT.md` disagree, `packages/shared` wins. Report the mismatch.

## Hard rules

1. Stay in your scope. Frontend agent edits only `apps/web`. Backend agent edits `apps/api`, and `packages/shared` + `docs/API_*` only via `/contract-change`.
2. Never invent an endpoint, field, enum value or error code. If something is missing, stop and say so. Frontend: use `/api-request`.
3. Money is an integer in agorot (`479080` = ₪4,790.80). Never use floats for money.
4. Timestamps are ISO 8601 UTC (`...Z`). Date-only values are `YYYY-MM-DD`. Display in `Asia/Jerusalem`.
5. JSON is `camelCase`. IDs are cuid strings.
6. Responses: `{ data }`, lists `{ data, meta }`, errors `{ error: { code, message, details, requestId } }`.
7. Business logic lives on the server. The frontend never re-implements status transitions, permissions or totals. It renders `allowedTransitions`, `permissions` and `totals` from the API, or calls helpers from `packages/shared`.
8. User-facing text is Hebrew. Code, identifiers, commits and comments are English.
9. Finish every task with `pnpm typecheck && pnpm lint && pnpm test` green. Do not commit if red.
10. Do not add dependencies without saying why in your summary.

## Commits and branches

- Conventional Commits with scope: `feat(api/orders): ...`, `feat(web/orders): ...`, `contract(orders): ...`, `fix(shared): ...`.
- Branches: `contract/<module>`, `fe/<module>-<desc>`, `be/<module>-<desc>`, `fix/<desc>`.
- Never push to `main`.

## Commands

- `pnpm dev` — run web (5173) and api (4000)
- `pnpm typecheck`, `pnpm lint`, `pnpm test`
- `pnpm --filter api db:migrate`, `pnpm --filter api db:seed`
- Seed users: `admin|office|chef|cook|driver@dev.local`, password `Passw0rd!`

## When unsure

Ask. A short question is cheaper than a wrong module.
