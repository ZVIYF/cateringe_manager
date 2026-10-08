---
description: Finish a feature - run checks, walk the Definition of Done, write the PR description.
---

1. Run `pnpm typecheck && pnpm lint && pnpm test`. If anything fails, fix it first, then rerun.
2. Run `git diff main...HEAD --stat` and check that every changed file is inside your scope (see root CLAUDE.md, rule 1). Report anything outside it.
3. Walk the Definition of Done in `docs/WORKFLOW.md` §9 (backend §9.1 or frontend §9.2). For each item answer yes/no with a short reason.
4. Search the diff for `TODO(api-request` and list them.
5. Write a PR description using `.github/pull_request_template.md`.
