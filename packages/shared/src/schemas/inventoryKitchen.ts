import { z } from 'zod';
import { Kashrut, KitchenTaskStatus, PurchaseOrderStatus, SaleUnit, StockMoveType } from '../enums';
import { Id, IsoDate, IsoDateTime, ListQuery, Money, dataOf, pageOf } from '../http';

// ── 1. Ingredients Schemas (§5.5) ───────────────────────────────────────────

export const Ingredient = z.object({
  id: Id,
  name: z.string().trim().min(1),
  category: z.string().trim().optional(),
  unit: z.string().trim().min(1),
  currentStock: z.number().min(0),
  minStock: z.number().min(0),
  costPerUnit: Money,
  supplierId: Id.nullable().optional(),
  supplierName: z.string().optional(),
  createdAt: IsoDateTime.optional(),
  updatedAt: IsoDateTime.optional(),
});
export type Ingredient = z.infer<typeof Ingredient>;

export const IngredientCreate = z.object({
  name: z.string().trim().min(2),
  category: z.string().trim().min(1).optional(),
  unit: z.string().trim().min(1),
  currentStock: z.number().min(0).default(0),
  minStock: z.number().min(0).default(0),
  costPerUnit: Money,
  supplierId: Id.optional(),
});
export type IngredientCreate = z.infer<typeof IngredientCreate>;

export const IngredientUpdate = IngredientCreate.partial();
export type IngredientUpdate = z.infer<typeof IngredientUpdate>;

export const IngredientListQuery = ListQuery.extend({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  belowMin: z.coerce.boolean().optional(),
});
export type IngredientListQuery = z.infer<typeof IngredientListQuery>;

export const IngredientResponse = dataOf(Ingredient);
export type IngredientResponse = z.infer<typeof IngredientResponse>;

export const IngredientListResponse = pageOf(Ingredient);
export type IngredientListResponse = z.infer<typeof IngredientListResponse>;

// ── 2. Stock Moves Schemas (§5.5) ────────────────────────────────────────────

export const StockMove = z.object({
  id: Id,
  ingredientId: Id,
  ingredientName: z.string().optional(),
  type: StockMoveType,
  qty: z.number(),
  reason: z.string().min(1),
  createdAt: IsoDateTime,
  createdById: Id.optional(),
  createdByName: z.string().optional(),
});
export type StockMove = z.infer<typeof StockMove>;

export const CreateStockMoveBody = z.object({
  ingredientId: Id,
  type: StockMoveType,
  qty: z.number().positive(),
  reason: z.string().trim().min(2),
});
export type CreateStockMoveBody = z.infer<typeof CreateStockMoveBody>;

export const StockMovesListQuery = ListQuery.extend({
  ingredientId: Id.optional(),
  type: StockMoveType.optional(),
  from: IsoDate.optional(),
  to: IsoDate.optional(),
});
export type StockMovesListQuery = z.infer<typeof StockMovesListQuery>;

export const StockMoveResponse = dataOf(StockMove);
export type StockMoveResponse = z.infer<typeof StockMoveResponse>;

export const StockMoveListResponse = pageOf(StockMove);
export type StockMoveListResponse = z.infer<typeof StockMoveListResponse>;

// ── 3. Inventory Forecast Schemas (§5.5) ────────────────────────────────────

export const InventoryForecastSupplier = z.object({
  id: Id,
  name: z.string(),
});
export type InventoryForecastSupplier = z.infer<typeof InventoryForecastSupplier>;

export const InventoryForecastItem = z.object({
  ingredientId: Id,
  name: z.string(),
  unit: z.string(),
  stock: z.number(),
  minStock: z.number(),
  required: z.number(),
  incoming: z.number(),
  shortage: z.number(),
  supplier: InventoryForecastSupplier.nullable().optional(),
});
export type InventoryForecastItem = z.infer<typeof InventoryForecastItem>;

export const InventoryForecastMeta = z.object({
  from: IsoDate,
  to: IsoDate,
});
export type InventoryForecastMeta = z.infer<typeof InventoryForecastMeta>;

export const InventoryForecastResponse = z.object({
  data: z.array(InventoryForecastItem),
  meta: InventoryForecastMeta,
});
export type InventoryForecastResponse = z.infer<typeof InventoryForecastResponse>;

export const InventoryForecastQuery = z.object({
  days: z.coerce.number().int().min(1).max(30).default(7),
});
export type InventoryForecastQuery = z.infer<typeof InventoryForecastQuery>;

// ── 4. Suppliers Schemas (§5.5) ──────────────────────────────────────────────

export const Supplier = z.object({
  id: Id,
  name: z.string().trim().min(1),
  contactName: z.string().trim().nullable().optional(),
  phone: z.string().trim().min(1),
  email: z.string().email().nullable().optional(),
  categories: z.array(z.string()).default([]),
  leadTimeDays: z.number().int().min(0).default(1),
  notes: z.string().nullable().optional(),
  createdAt: IsoDateTime.optional(),
});
export type Supplier = z.infer<typeof Supplier>;

export const SupplierCreate = z.object({
  name: z.string().trim().min(2),
  contactName: z.string().trim().optional(),
  phone: z.string().trim().min(9),
  email: z.string().email().optional(),
  categories: z.array(z.string()).default([]),
  leadTimeDays: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});
export type SupplierCreate = z.infer<typeof SupplierCreate>;

export const SupplierUpdate = SupplierCreate.partial();
export type SupplierUpdate = z.infer<typeof SupplierUpdate>;

export const SupplierListQuery = ListQuery.extend({
  q: z.string().trim().optional(),
});
export type SupplierListQuery = z.infer<typeof SupplierListQuery>;

export const SupplierResponse = dataOf(Supplier);
export type SupplierResponse = z.infer<typeof SupplierResponse>;

export const SupplierListResponse = pageOf(Supplier);
export type SupplierListResponse = z.infer<typeof SupplierListResponse>;

// ── 5. Purchase Orders Schemas (§5.5) ────────────────────────────────────────

export const PurchaseOrderLine = z.object({
  id: Id,
  ingredientId: Id,
  ingredientName: z.string(),
  unit: z.string(),
  qty: z.number().positive(),
  receivedQty: z.number().min(0).default(0),
  unitPrice: Money,
  lineTotal: Money,
});
export type PurchaseOrderLine = z.infer<typeof PurchaseOrderLine>;

export const PurchaseOrderLineInput = z.object({
  ingredientId: Id,
  qty: z.number().positive(),
  unitPrice: Money.optional(),
});
export type PurchaseOrderLineInput = z.infer<typeof PurchaseOrderLineInput>;

export const PurchaseOrder = z.object({
  id: Id,
  number: z.number().int(),
  supplierId: Id,
  supplierName: z.string(),
  status: PurchaseOrderStatus,
  lines: z.array(PurchaseOrderLine),
  total: Money,
  expectedDeliveryDate: IsoDate.nullable().optional(),
  sentAt: IsoDateTime.nullable().optional(),
  receivedAt: IsoDateTime.nullable().optional(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
});
export type PurchaseOrder = z.infer<typeof PurchaseOrder>;

export const CreatePurchaseOrderBody = z.object({
  supplierId: Id,
  lines: z.array(PurchaseOrderLineInput).min(1),
  expectedDeliveryDate: IsoDate.optional(),
});
export type CreatePurchaseOrderBody = z.infer<typeof CreatePurchaseOrderBody>;

export const CreatePOsFromShortagesBody = z.object({
  days: z.number().int().min(1).max(30).default(7),
});
export type CreatePOsFromShortagesBody = z.infer<typeof CreatePOsFromShortagesBody>;

export const ReceivePurchaseOrderLine = z.object({
  lineId: Id,
  receivedQty: z.number().min(0),
  price: Money.optional(),
});
export type ReceivePurchaseOrderLine = z.infer<typeof ReceivePurchaseOrderLine>;

export const ReceivePurchaseOrderBody = z.object({
  lines: z.array(ReceivePurchaseOrderLine).min(1),
});
export type ReceivePurchaseOrderBody = z.infer<typeof ReceivePurchaseOrderBody>;

export const SendPurchaseOrderBody = z.object({
  channel: z.enum(['WHATSAPP', 'EMAIL', 'PDF']).default('EMAIL'),
});
export type SendPurchaseOrderBody = z.infer<typeof SendPurchaseOrderBody>;

export const PurchaseOrderListQuery = ListQuery.extend({
  status: PurchaseOrderStatus.optional(),
  supplierId: Id.optional(),
});
export type PurchaseOrderListQuery = z.infer<typeof PurchaseOrderListQuery>;

export const PurchaseOrderResponse = dataOf(PurchaseOrder);
export type PurchaseOrderResponse = z.infer<typeof PurchaseOrderResponse>;

export const PurchaseOrderListResponse = pageOf(PurchaseOrder);
export type PurchaseOrderListResponse = z.infer<typeof PurchaseOrderListResponse>;

// ── 6. Kitchen Tasks & Production Sheet Schemas (§5.6) ───────────────────────

export const KitchenTaskAssignee = z.object({
  id: Id,
  name: z.string(),
});
export type KitchenTaskAssignee = z.infer<typeof KitchenTaskAssignee>;

export const KitchenTaskDish = z.object({
  id: Id,
  name: z.string(),
  kashrut: Kashrut,
});
export type KitchenTaskDish = z.infer<typeof KitchenTaskDish>;

export const KitchenTaskOrder = z.object({
  id: Id,
  number: z.number().int(),
  customerName: z.string(),
  qty: z.number(),
});
export type KitchenTaskOrder = z.infer<typeof KitchenTaskOrder>;

export const KitchenTask = z.object({
  id: Id,
  date: IsoDate,
  status: KitchenTaskStatus,
  dish: KitchenTaskDish,
  qty: z.number().positive(),
  unit: SaleUnit,
  earliestDepartureAt: IsoDateTime.nullable().optional(),
  assignee: KitchenTaskAssignee.nullable().optional(),
  orders: z.array(KitchenTaskOrder),
  updatedAt: IsoDateTime,
});
export type KitchenTask = z.infer<typeof KitchenTask>;

export const KitchenTaskUpdate = z.object({
  status: KitchenTaskStatus.optional(),
  assigneeId: Id.nullable().optional(),
});
export type KitchenTaskUpdate = z.infer<typeof KitchenTaskUpdate>;

export const KitchenTasksQuery = z.object({
  date: IsoDate,
});
export type KitchenTasksQuery = z.infer<typeof KitchenTasksQuery>;

export const KitchenUpdatesQuery = z.object({
  date: IsoDate,
  since: IsoDateTime,
});
export type KitchenUpdatesQuery = z.infer<typeof KitchenUpdatesQuery>;

export const KitchenTasksResponse = z.object({
  data: z.array(KitchenTask),
});
export type KitchenTasksResponse = z.infer<typeof KitchenTasksResponse>;

export const ProductionSheetQuery = z.object({
  date: IsoDate,
});
export type ProductionSheetQuery = z.infer<typeof ProductionSheetQuery>;

export const ProductionSheetResponse = dataOf(
  z.object({
    pdfUrl: z.string(),
  })
);
export type ProductionSheetResponse = z.infer<typeof ProductionSheetResponse>;
