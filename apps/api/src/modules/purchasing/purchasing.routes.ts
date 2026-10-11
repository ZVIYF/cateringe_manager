import { Router, type IRouter } from 'express';
import { InventoryKitchenSchemas } from '@catering/shared';
import { requireAuth, requireRole } from '../../lib/auth';
import { validate } from '../../lib/validate';
import * as controller from './purchasing.controller';

/**
 * Suppliers routes (§5.5)
 * Mounted at /api/v1/suppliers in app.ts
 */
export const suppliersRouter: IRouter = Router();

suppliersRouter.use(requireAuth);
suppliersRouter.use(requireRole('ADMIN', 'KITCHEN_MANAGER'));

suppliersRouter.get('/', controller.getSuppliers);
suppliersRouter.post(
  '/',
  validate('body', InventoryKitchenSchemas.SupplierCreate),
  controller.createSupplier
);
suppliersRouter.get('/:id', controller.getSupplierById);
suppliersRouter.patch(
  '/:id',
  validate('body', InventoryKitchenSchemas.SupplierUpdate),
  controller.updateSupplier
);

/**
 * Purchase Orders routes (§5.5)
 * Mounted at /api/v1/purchase-orders in app.ts
 */
export const purchaseOrdersRouter: IRouter = Router();

purchaseOrdersRouter.use(requireAuth);
purchaseOrdersRouter.use(requireRole('ADMIN', 'KITCHEN_MANAGER'));

purchaseOrdersRouter.get('/', controller.getPurchaseOrders);
purchaseOrdersRouter.post(
  '/',
  validate('body', InventoryKitchenSchemas.CreatePurchaseOrderBody),
  controller.createPurchaseOrder
);
purchaseOrdersRouter.post(
  '/from-shortages',
  validate('body', InventoryKitchenSchemas.CreatePOsFromShortagesBody),
  controller.createPOsFromShortages
);
purchaseOrdersRouter.get('/:id', controller.getPurchaseOrderById);
purchaseOrdersRouter.post(
  '/:id/send',
  validate('body', InventoryKitchenSchemas.SendPurchaseOrderBody),
  controller.sendPurchaseOrder
);
purchaseOrdersRouter.post(
  '/:id/receive',
  validate('body', InventoryKitchenSchemas.ReceivePurchaseOrderBody),
  controller.receivePurchaseOrder
);
