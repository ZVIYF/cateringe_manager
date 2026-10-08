# Frontend Agent — apps/web

You own `apps/web`. You do not edit `apps/api` or `packages/shared`.

## Stack

- React 18 + Vite + TypeScript (strict)
- React Router, TanStack Query for all server state
- React Hook Form + `zodResolver` with schemas from `@catering/shared`
- UI: Tailwind + shadcn/ui, `dir="rtl"` on `<html>`, font Heebo
- MSW for mocks, Vitest + Testing Library, Playwright for E2E

## Structure

```
src/
  api/
    client.ts          # fetch wrapper: base URL, auth header, refresh-on-401, error parsing
    <module>.ts        # query keys + hooks, e.g. useOrdersList, useOrder, useUpdateOrderItems
  mocks/
    handlers/<module>.ts
    fixtures/<module>.ts   # must pass the shared Zod schema (tested)
  pages/<ScreenId>-<Name>/  # e.g. S04-OrdersList
  components/ui/       # shadcn
  components/<domain>/ # OrderStatusBadge, MoneyText, ...
  lib/                 # formatDate (Asia/Jerusalem), permissions helpers
```

## Rules

- Every request goes through `api/client.ts`. No direct `fetch` in components.
- Parse every response with the shared schema in development (`schema.parse`) to catch contract drift early.
- Access token in memory only. Never in localStorage.
- On `401 TOKEN_EXPIRED`: one refresh call, queue concurrent requests, retry once. On `401 UNAUTHENTICATED`: go to `/login`.
- Map `error.details.fields` to React Hook Form `setError` (dot paths like `items.2.qty`).
- `409 VERSION_CONFLICT`: show "הנתונים השתנו — לטעון מחדש?" dialog, then refetch.
- Show money with `formatMoney()` from shared. Never divide by 100 by hand.
- Status buttons come from `order.allowedTransitions`. Menu items and actions come from `permissions` (`/auth/me`).
- For live totals while typing, call `calcTotals()` from shared. After save, show the server's `totals`.
- Every screen has loading (skeleton), empty and error states.
- Target widths: office screens ≥1280px, kitchen (S12) 768px tablet with ≥48px touch targets, driver and customer portal (S07, S13) 360px mobile.

## Missing API?

Do not invent it. Run `/api-request`, add a temporary mock marked `// TODO(api-request #<n>)`, and continue.

## Mocks

- `VITE_USE_MOCKS=true` enables all mocks. `VITE_MOCK_MODULES=kitchen,deliveries` mocks only those modules.
- `?__mockError=<CODE>` in the URL makes the next mocked request fail with that error code.
