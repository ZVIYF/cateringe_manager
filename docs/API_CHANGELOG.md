# API Changelog

Newest first. Additive changes bump the minor version, breaking changes bump the major version.

## v1.1 — 2026-10-08
- Add `ACCOUNT_LOCKED` error code (HTTP 429) for multiple failed login attempts.
- Export `User`, `Me`, and `AuthResult` aliases in auth schemas (closes #4).

## v1.0 — 2026-10-08
- Initial contract: auth, customers, orders, public quotes, dishes, menus, inventory, purchasing, kitchen, deliveries, payments, dashboard, reports, settings.
