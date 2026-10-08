---
description: Request a missing API field or endpoint from the backend. Frontend agent only.
argument-hint: <what the screen needs>
---

The frontend needs something that is not in the contract: $ARGUMENTS

1. Search `packages/shared/src` and `docs/API_CONTRACT.md` to be sure it really does not exist (maybe under another name).
2. Draft a GitHub issue body in this format and show it to the human:

   Title: api-request: <short>
   Screen: S<nn> <name>
   Need: <what data or action, in one sentence>
   Proposed shape: <JSON snippet of the request/response, following contract conventions: camelCase, agorot, ISO UTC>
   Why: <what breaks or what the user cannot do without it>
   Blocking: yes/no

3. If `gh` is available and the human approves, create it with label `api-request`.
4. Add a temporary MSW handler or fixture field returning the proposed shape, marked `// TODO(api-request #<issue>)`. Do not touch `packages/shared`.
5. Continue the screen against the mock.
