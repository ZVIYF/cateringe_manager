import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app';
import { prisma } from '../../lib/prisma';

process.env['JWT_ACCESS_SECRET'] = 'test-secret';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    ingredient: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    stockMove: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    supplier: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    purchaseOrder: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    purchaseOrderLine: {
      update: vi.fn(),
    },
    kitchenTask: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
    dish: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

function signToken(role: string, sub = 'user-1', name = 'Test User') {
  return jwt.sign(
    { sub, email: `${role.toLowerCase()}@test.com`, role, name },
    process.env['JWT_ACCESS_SECRET'] ?? 'test-secret',
    { expiresIn: '1h' }
  );
}

describe('Phase 8 — Inventory, Purchasing & Kitchen API', () => {
  const app = createApp();

  const mockIngredient = {
    id: 'cig-1',
    name: 'שוק עוף',
    category: 'בשר',
    unit: 'KG',
    currentStock: 12,
    minStock: 5,
    costPerUnit: 3500,
    supplierId: 'csu-1',
    supplierName: 'עוף טוב',
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-01T10:00:00.000Z'),
  };

  const mockSupplier = {
    id: 'csu-1',
    name: 'עוף טוב',
    contactName: 'משה',
    phone: '0501112233',
    email: 'supplier@test.com',
    categories: ['בשר'],
    leadTimeDays: 2,
    notes: null,
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-01T10:00:00.000Z'),
  };

  const mockKitchenTask = {
    id: 'ckt-1',
    date: '2026-10-09',
    status: 'TODO',
    dish: { id: 'cld-1', name: 'עוף בגריל', kashrut: 'MEAT' },
    qty: 80,
    unit: 'PORTION',
    earliestDepartureAt: new Date('2026-10-09T13:30:00.000Z'),
    assigneeId: 'cook-1',
    assignee: { id: 'cook-1', name: 'שף דני' },
    orders: [{ id: 'clo-1', number: 1045, customerName: 'כהן', qty: 80 }],
    createdAt: new Date('2026-10-08T06:00:00.000Z'),
    updatedAt: new Date('2026-10-08T06:00:00.000Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ingredients & Inventory RBAC', () => {
    it('allows KITCHEN_MANAGER to list ingredients', async () => {
      vi.mocked(prisma.ingredient.findMany).mockResolvedValue([mockIngredient] as unknown as Awaited<ReturnType<typeof prisma.ingredient.findMany>>);
      vi.mocked(prisma.ingredient.count).mockResolvedValue(1);

      const token = signToken('KITCHEN_MANAGER');
      const res = await request(app)
        .get('/api/v1/ingredients')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('שוק עוף');
    });

    it('forbids OFFICE from creating ingredients with 403', async () => {
      const token = signToken('OFFICE');
      const res = await request(app)
        .post('/api/v1/ingredients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'בשר בקר',
          unit: 'KG',
          costPerUnit: 5000,
        });

      expect(res.status).toBe(403);
    });

    it('allows ADMIN to create an ingredient', async () => {
      vi.mocked(prisma.ingredient.create).mockResolvedValue(mockIngredient as unknown as Awaited<ReturnType<typeof prisma.ingredient.create>>);

      const token = signToken('ADMIN');
      const res = await request(app)
        .post('/api/v1/ingredients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'שוק עוף',
          unit: 'KG',
          costPerUnit: 3500,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('שוק עוף');
    });
  });

  describe('Suppliers & Purchase Orders', () => {
    it('allows KITCHEN_MANAGER to create purchase orders', async () => {
      vi.mocked(prisma.supplier.findUnique).mockResolvedValue(mockSupplier as unknown as Awaited<ReturnType<typeof prisma.supplier.findUnique>>);
      vi.mocked(prisma.ingredient.findMany).mockResolvedValue([mockIngredient] as unknown as Awaited<ReturnType<typeof prisma.ingredient.findMany>>);

      const mockPO = {
        id: 'cpo-1',
        number: 501,
        supplierId: 'csu-1',
        supplierName: 'עוף טוב',
        status: 'DRAFT',
        lines: [
          {
            id: 'cpol-1',
            purchaseOrderId: 'cpo-1',
            ingredientId: 'cig-1',
            ingredientName: 'שוק עוף',
            unit: 'KG',
            qty: 20,
            receivedQty: 0,
            unitPrice: 3500,
            lineTotal: 70000,
          },
        ],
        total: 70000,
        expectedDeliveryDate: null,
        sentAt: null,
        receivedAt: null,
        createdAt: new Date('2026-10-01T10:00:00.000Z'),
        updatedAt: new Date('2026-10-01T10:00:00.000Z'),
      };

      vi.mocked(prisma.purchaseOrder.create).mockResolvedValue(mockPO as unknown as Awaited<ReturnType<typeof prisma.purchaseOrder.create>>);

      const token = signToken('KITCHEN_MANAGER');
      const res = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          supplierId: 'csu-1',
          lines: [{ ingredientId: 'cig-1', qty: 20 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.total).toBe(70000);
      expect(res.body.data.lines).toHaveLength(1);
    });
  });

  describe('Kitchen Tasks RBAC & Access (§5.6)', () => {
    it('allows KITCHEN_MANAGER to view all tasks', async () => {
      vi.mocked(prisma.kitchenTask.findMany).mockResolvedValue([
        mockKitchenTask,
        { ...mockKitchenTask, id: 'ckt-2', assigneeId: 'cook-2' },
      ] as unknown as Awaited<ReturnType<typeof prisma.kitchenTask.findMany>>);

      const token = signToken('KITCHEN_MANAGER');
      const res = await request(app)
        .get('/api/v1/kitchen/tasks?date=2026-10-09')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('CRITICAL RBAC CHECK: KITCHEN_STAFF sees only tasks assigned to them or unassigned', async () => {
      vi.mocked(prisma.kitchenTask.findMany).mockResolvedValue([
        { ...mockKitchenTask, id: 'ckt-1', assigneeId: 'cook-1' }, // My task
        { ...mockKitchenTask, id: 'ckt-2', assigneeId: 'cook-2' }, // Other cook task
        { ...mockKitchenTask, id: 'ckt-3', assigneeId: null },     // Unassigned
      ] as unknown as Awaited<ReturnType<typeof prisma.kitchenTask.findMany>>);

      const token = signToken('KITCHEN_STAFF', 'cook-1');
      const res = await request(app)
        .get('/api/v1/kitchen/tasks?date=2026-10-09')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.map((t: { id: string }) => t.id)).toEqual(['ckt-1', 'ckt-3']);
    });

    it('CRITICAL RBAC CHECK: KITCHEN_STAFF can update status but is forbidden from updating assigneeId', async () => {
      vi.mocked(prisma.kitchenTask.findUnique).mockResolvedValue(mockKitchenTask as unknown as Awaited<ReturnType<typeof prisma.kitchenTask.findUnique>>);

      const token = signToken('KITCHEN_STAFF', 'cook-1');

      // 1. Updating status succeeds
      vi.mocked(prisma.kitchenTask.update).mockResolvedValue({
        ...mockKitchenTask,
        status: 'IN_PROGRESS',
      } as unknown as Awaited<ReturnType<typeof prisma.kitchenTask.update>>);

      const resStatus = await request(app)
        .patch('/api/v1/kitchen/tasks/ckt-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'IN_PROGRESS' });

      expect(resStatus.status).toBe(200);
      expect(resStatus.body.data.status).toBe('IN_PROGRESS');

      // 2. Trying to reassign fails with 403 FORBIDDEN
      const resAssignee = await request(app)
        .patch('/api/v1/kitchen/tasks/ckt-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ assigneeId: 'cook-2' });

      expect(resAssignee.status).toBe(403);
      expect(resAssignee.body.error.code).toBe('FORBIDDEN');
    });

    it('forbids KITCHEN_STAFF from production-sheet with 403', async () => {
      const token = signToken('KITCHEN_STAFF');
      const res = await request(app)
        .get('/api/v1/kitchen/production-sheet?date=2026-10-09')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
