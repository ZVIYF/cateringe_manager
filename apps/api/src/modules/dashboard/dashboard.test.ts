import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../app';
import { prisma } from '../../lib/prisma';

process.env['JWT_ACCESS_SECRET'] = 'test-secret';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    quote: {
      findMany: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
    },
  },
}));

function signToken(role: string) {
  return jwt.sign(
    { sub: 'user-1', email: `${role.toLowerCase()}@test.com`, role, name: 'Test User' },
    process.env['JWT_ACCESS_SECRET'] ?? 'test-secret',
    { expiresIn: '1h' }
  );
}

describe('Calendar, Dashboard & Reports API (§5.2, §5.9)', () => {
  const app = createApp();

  const mockOrders = [
    {
      id: 'clo-1',
      number: 1001,
      status: 'CONFIRMED',
      customer: { id: 'clc-1', name: 'משפחת כהן' },
      event: {
        startsAt: '2026-10-09T15:00:00.000Z',
        guests: 100,
        kashrut: 'MEAT',
        serviceType: 'DELIVERY',
      },
      items: [
        { dishId: 'cld-1', dishName: 'עוף בגריל', qty: 50, lineTotal: 150000 },
      ],
      pricing: {
        validUntil: '2026-10-15',
      },
      totals: {
        total: 200000,
        paid: 50000,
        balance: 150000,
      },
      createdAt: new Date('2026-10-01T10:00:00.000Z'),
    },
    {
      id: 'clo-2',
      number: 1002,
      status: 'QUOTE_SENT',
      customer: { id: 'clc-2', name: 'חברת אלפא' },
      event: {
        startsAt: '2026-10-12T12:00:00.000Z',
        guests: 50,
        kashrut: 'DAIRY',
        serviceType: 'PICKUP',
      },
      items: [],
      pricing: {
        validUntil: '2026-10-02',
      },
      totals: {
        total: 80000,
        paid: 0,
        balance: 80000,
      },
      createdAt: new Date('2026-10-01T11:00:00.000Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.order.findMany).mockResolvedValue(
      mockOrders as unknown as Awaited<ReturnType<typeof prisma.order.findMany>>
    );
    vi.mocked(prisma.quote.findMany).mockResolvedValue([]);
    vi.mocked(prisma.payment.findMany).mockResolvedValue([]);
  });

  describe('GET /orders?view=calendar', () => {
    it('returns CalendarViewResponse mapped correctly for authorized users', async () => {
      const token = signToken('ADMIN');

      const res = await request(app)
        .get('/api/v1/orders?view=calendar&from=2026-10-01&to=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toMatchObject({
        id: 'clo-1',
        number: 1001,
        customerName: 'משפחת כהן',
        startsAt: '2026-10-09T15:00:00.000Z',
        guests: 100,
        kashrut: 'MEAT',
      });
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .get('/api/v1/orders?view=calendar&from=2026-10-01&to=2026-10-15');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('GET /dashboard RBAC & Data Filtering', () => {
    it('returns full dashboard data including revenueThisMonth and revenueChart for ADMIN', async () => {
      const token = signToken('ADMIN');

      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.kpis).toBeDefined();
      expect(res.body.data.kpis.pendingQuotes).toBe(1);
      // ADMIN should see revenue fields
      expect(res.body.data.kpis.revenueThisMonth).toBeDefined();
      expect(typeof res.body.data.kpis.revenueThisMonth).toBe('number');
      expect(res.body.data.revenueChart).toBeDefined();
      expect(Array.isArray(res.body.data.revenueChart)).toBe(true);
      expect(res.body.data.upcoming).toHaveLength(2);
      expect(res.body.data.upcoming[0].paymentState).toBe('DEPOSIT');
    });

    it('CRITICAL RBAC CHECK: omits revenueThisMonth and revenueChart for OFFICE', async () => {
      const token = signToken('OFFICE');

      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.kpis).toBeDefined();
      expect(res.body.data.kpis.eventsThisWeek).toBeDefined();
      expect(res.body.data.kpis.pendingQuotes).toBe(1);
      expect(res.body.data.kpis.openBalances).toBeDefined();

      // OFFICE MUST NOT see revenue fields
      expect(res.body.data.kpis.revenueThisMonth).toBeUndefined();
      expect(res.body.data.revenueChart).toBeUndefined();
    });

    it('forbids KITCHEN_MANAGER from accessing /dashboard with 403', async () => {
      const token = signToken('KITCHEN_MANAGER');

      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /reports RBAC & Access', () => {
    it('allows ADMIN to access reports', async () => {
      const token = signToken('ADMIN');

      const resRevenue = await request(app)
        .get('/api/v1/reports/revenue')
        .set('Authorization', `Bearer ${token}`);
      expect(resRevenue.status).toBe(200);
      expect(Array.isArray(resRevenue.body.data)).toBe(true);

      const resProfit = await request(app)
        .get('/api/v1/reports/profitability')
        .set('Authorization', `Bearer ${token}`);
      expect(resProfit.status).toBe(200);

      const resTopDishes = await request(app)
        .get('/api/v1/reports/top-dishes')
        .set('Authorization', `Bearer ${token}`);
      expect(resTopDishes.status).toBe(200);

      const resConversion = await request(app)
        .get('/api/v1/reports/conversion')
        .set('Authorization', `Bearer ${token}`);
      expect(resConversion.status).toBe(200);
      expect(resConversion.body.data).toHaveProperty('rate');
    });

    it('forbids OFFICE from accessing reports with 403', async () => {
      const token = signToken('OFFICE');

      const res = await request(app)
        .get('/api/v1/reports/revenue')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
