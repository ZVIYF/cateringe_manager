---
description: Change the API contract (shared schemas + docs) safely. Backend agent only.
argument-hint: <what to change, e.g. "add driverPhone to OrderListItem">
---

You are changing the API contract: $ARGUMENTS

1. Confirm you are on a `contract/<module>` branch. If not, stop and ask.
2. Read the relevant section of `docs/API_CONTRACT.md` and the schema files in `packages/shared/src`.
3. Classify the change: ADDITIVE (new optional field, new endpoint, new optional param) or BREAKING (rename, removal, type change, optional→required). If BREAKING, stop and ask the human to confirm it was agreed with the frontend developer.
4. Update, in this order:
   - `packages/shared/src/...` schemas (and `enums.ts` labels if an enum changed)
   - `docs/API_CONTRACT.md` — the table row and any JSON example that shows this object
   - `docs/API_CHANGELOG.md` — new entry at the top: date, version bump (minor for additive), one line per change
5. Run `pnpm --filter @catering/shared typecheck`, `pnpm --filter api typecheck`, `pnpm --filter web typecheck`.
6. If `apps/web` fails to typecheck, do NOT edit `apps/web`. List the failing files in your summary for the frontend developer.
7. Commit as `contract(<module>): <summary>` and print a PR description that starts with "API contract change" and lists every changed field.
