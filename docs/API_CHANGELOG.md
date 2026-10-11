# API Changelog

Newest first. Additive changes bump the minor version, breaking changes bump the major version.

## v1.4 — 2026-10-11
- Add Inventory, Purchasing & Kitchen schemas (`Ingredient`, `StockMove`, `InventoryForecast`, `Supplier`, `PurchaseOrder`, `KitchenTask`, etc.) per §5.5 and §5.6.

## v1.3 — 2026-10-11
- Add Calendar and Dashboard schemas (`CalendarOrderItem`, `CalendarViewQuery`, `DashboardData`, `DashboardResponse`, `RevenueReportItem`, etc.) per §5.2 and §5.9.

## v1.2 — 2026-10-11
- Add `Dish`, `DishCreate`, `DishUpdate`, `DishRecipeUpdate`, and `DishKitchenView` schemas for the Dishes module (§4.4, §5.4).

## v1.1 — 2026-10-08
- Add `Customer`, `CustomerPublic`, `CustomerCreate`, and `CustomerUpdate` schemas for the Customers module.

## v1.0 — 2026-10-08
- Initial contract: auth, customers, orders, public quotes, dishes, menus, inventory, purchasing, kitchen, deliveries, payments, dashboard, reports, settings.
