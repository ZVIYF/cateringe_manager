import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app';
import { prisma } from '../../lib/prisma';

process.env['JWT_ACCESS_SECRET'] = 'test-secret';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    delivery: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

type DeliveryModel = NonNullable<Awaited<ReturnType<typeof prisma.delivery.findUnique>>>;
type DeliveriesList = Awaited<ReturnType<typeof prisma.delivery.findMany>>;
type UserModel = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;

function signToken(role: string, sub = 'user-1', name = 'Test User') {
  return jwt.sign(
    { sub, email: `${role.toLowerCase()}@test.com`, role, name },
    process.env['JWT_ACCESS_SECRET'] ?? 'test-secret',
    { expiresIn: '1h' }
  );
}

describe('Phase 9 — Deliveries & Driver Logistics API', () => {
  const app = createApp();

  const mockDelivery1 = {
    id: 'cdl-1',
    orderId: 'clo-101',
    orderNumber: 101,
    customerName: 'ישראל ישראלי',
    customerPhone: '0521234567',
    address: 'הרצל 1, תל אביב',
    lat: 32.0853,
    lng: 34.7818,
    driverId: 'drv-1',
    driverName: 'נהג דוד',
    sequence: 1,
    plannedDepartureAt: new Date('2026-10-15T11:00:00.000Z'),
    status: 'ASSIGNED' as const,
    date: '2026-10-15',
    startedAt: null,
    completedAt: null,
    boxesCount: 3,
    notes: 'להתקשר לפני ההגעה',
    receiverName: null,
    signatureUrl: null,
    photoUrl: null,
    deliveryNotes: null,
    checkedBoxes: [],
    completionLat: null,
    completionLng: null,
    clientCompletedAt: null,
    createdAt: new Date('2026-10-14T10:00:00.000Z'),
    updatedAt: new Date('2026-10-14T10:00:00.000Z'),
  };

  const mockDelivery2 = {
    ...mockDelivery1,
    id: 'cdl-2',
    orderId: 'clo-102',
    orderNumber: 102,
    customerName: 'שרה כהן',
    driverId: 'drv-2',
    driverName: 'נהג יוסי',
    sequence: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dispatcher Dispatching & RBAC', () => {
    it('allows ADMIN and OFFICE staff to list deliveries for date', async () => {
      vi.mocked(prisma.delivery.count).mockResolvedValue(2);
      vi.mocked(prisma.delivery.findMany).mockResolvedValue([mockDelivery1, mockDelivery2] as unknown as DeliveriesList);

      const token = signToken('OFFICE', 'office-1');
      const res = await request(app)
        .get('/api/v1/deliveries?date=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].id).toBe('cdl-1');
      expect(res.body.data[0].customerName).toBe('ישראל ישראלי');
      expect(res.body.data[1].id).toBe('cdl-2');
    });

    it('rejects DRIVER role from accessing full deliveries list (403 Forbidden)', async () => {
      const token = signToken('DRIVER', 'drv-1');
      const res = await request(app)
        .get('/api/v1/deliveries?date=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('allows OFFICE staff to update delivery driver and sequence', async () => {
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(mockDelivery1 as unknown as DeliveryModel);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'drv-1', name: 'נהג דוד' } as unknown as UserModel);
      vi.mocked(prisma.delivery.update).mockResolvedValue({
        ...mockDelivery1,
        sequence: 2,
        notes: 'עדכון סדר',
      } as unknown as DeliveryModel);

      const token = signToken('OFFICE', 'office-1');
      const res = await request(app)
        .patch('/api/v1/deliveries/cdl-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sequence: 2,
          notes: 'עדכון סדר',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.sequence).toBe(2);
      expect(res.body.data.notes).toBe('עדכון סדר');
    });

    it('rejects DRIVER from updating delivery dispatch info (403 Forbidden)', async () => {
      const token = signToken('DRIVER', 'drv-1');
      const res = await request(app)
        .patch('/api/v1/deliveries/cdl-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sequence: 2,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Driver Mobile Workflow & RBAC', () => {
    it('allows DRIVER to fetch their own deliveries for today', async () => {
      vi.mocked(prisma.delivery.findMany).mockResolvedValue([mockDelivery1] as unknown as DeliveriesList);

      const token = signToken('DRIVER', 'drv-1');
      const res = await request(app)
        .get('/api/v1/driver/deliveries/today?date=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe('cdl-1');
      expect(vi.mocked(prisma.delivery.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            driverId: 'drv-1',
            date: '2026-10-15',
          }),
        })
      );
    });

    it('rejects non-driver role from driver today route (403 Forbidden)', async () => {
      const token = signToken('OFFICE', 'office-1');
      const res = await request(app)
        .get('/api/v1/driver/deliveries/today')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('allows assigned driver to start a delivery', async () => {
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(mockDelivery1 as unknown as DeliveryModel);
      vi.mocked(prisma.delivery.update).mockResolvedValue({
        ...mockDelivery1,
        status: 'EN_ROUTE',
        startedAt: new Date('2026-10-15T11:15:00.000Z'),
      } as unknown as DeliveryModel);
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });

      const token = signToken('DRIVER', 'drv-1');
      const res = await request(app)
        .post('/api/v1/deliveries/cdl-1/start')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deliveryId).toBe('cdl-1');
      expect(res.body.data.status).toBe('EN_ROUTE');
      expect(res.body.data.smsSent).toBe(true);
      expect(vi.mocked(prisma.order.updateMany)).toHaveBeenCalledWith({
        where: { id: 'clo-101' },
        data: { status: 'OUT_FOR_DELIVERY' },
      });
    });

    it('prevents a driver from starting another driver\'s delivery (403 Forbidden)', async () => {
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(mockDelivery1 as unknown as DeliveryModel); // assigned to drv-1

      const token = signToken('DRIVER', 'drv-2'); // Drv-2 attempts to start Drv-1's delivery
      const res = await request(app)
        .post('/api/v1/deliveries/cdl-1/start')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows assigned driver to complete a delivery with signature and GPS', async () => {
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue({
        ...mockDelivery1,
        status: 'EN_ROUTE',
      } as unknown as DeliveryModel);
      vi.mocked(prisma.delivery.update).mockResolvedValue({
        ...mockDelivery1,
        status: 'DELIVERED',
        receiverName: 'יוסי המקבל',
        completedAt: new Date('2026-10-15T12:00:00.000Z'),
      } as unknown as DeliveryModel);
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });

      const token = signToken('DRIVER', 'drv-1');
      const res = await request(app)
        .post('/api/v1/deliveries/cdl-1/complete')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiverName: 'יוסי המקבל',
          signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          photo: 'https://example.com/delivery.jpg',
          lat: 32.0853,
          lng: 34.7818,
          checkedBoxes: ['BOX-1', 'BOX-2', 'BOX-3'],
          clientCompletedAt: '2026-10-15T12:00:00.000Z',
          notes: 'נמסר לשומר',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.deliveryId).toBe('cdl-1');
      expect(res.body.data.status).toBe('DELIVERED');
      expect(res.body.data.receiverName).toBe('יוסי המקבל');
      expect(vi.mocked(prisma.order.updateMany)).toHaveBeenCalledWith({
        where: { id: 'clo-101' },
        data: { status: 'DELIVERED' },
      });
    });

    it('is idempotent when completing an already completed delivery', async () => {
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue({
        ...mockDelivery1,
        status: 'DELIVERED',
        receiverName: 'יוסי המקבל',
        completedAt: new Date('2026-10-15T12:00:00.000Z'),
      } as unknown as DeliveryModel);

      const token = signToken('DRIVER', 'drv-1');
      const res = await request(app)
        .post('/api/v1/deliveries/cdl-1/complete')
        .set('Authorization', `Bearer ${token}`)
        .send({
          receiverName: 'יוסי המקבל',
          signature: 'data:image/png;base64,abc',
          lat: 32.0853,
          lng: 34.7818,
          checkedBoxes: [],
          clientCompletedAt: '2026-10-15T12:00:00.000Z',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DELIVERED');
      // Should not call update again
      expect(vi.mocked(prisma.delivery.update)).not.toHaveBeenCalled();
    });

    it('prevents driver from accessing another driver delivery by ID (403 Forbidden)', async () => {
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(mockDelivery1 as unknown as DeliveryModel); // assigned to drv-1

      const token = signToken('DRIVER', 'drv-2'); // Drv-2 attempts to view Drv-1's delivery
      const res = await request(app)
        .get('/api/v1/deliveries/cdl-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});

