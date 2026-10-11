import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { MockSmsProvider, setSmsProvider } from '../lib/providers/sms.provider';
import { MockEmailProvider, setEmailProvider } from '../lib/providers/email.provider';
import { processNotificationJob, processReminderJob } from './workers';
import {
  checkExpiringQuotes,
  checkMissingDrivers,
  checkEventEveConfirmations,
  checkKitchenProductionReadiness,
  checkOverdueBalances,
  runAllReminderChecks,
} from './reminders.service';
import type { Job } from 'bullmq';
import type { NotificationJobData, ReminderJobData } from './queues';

process.env['JWT_ACCESS_SECRET'] = 'test-secret';

vi.mock('../lib/prisma', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
    },
    delivery: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

vi.mock('./queues', () => ({
  enqueueNotification: vi.fn().mockResolvedValue('mock-job-id'),
  enqueueReminder: vi.fn().mockResolvedValue('mock-reminder-id'),
  notificationsQueue: {
    getJobCounts: vi.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 5, failed: 0, delayed: 0 }),
    add: vi.fn().mockResolvedValue({ id: 'job-1' }),
  },
  remindersQueue: {
    getJobCounts: vi.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 10, failed: 0, delayed: 0 }),
    add: vi.fn().mockResolvedValue({ id: 'remind-1' }),
  },
}));

type OrdersList = Awaited<ReturnType<typeof prisma.order.findMany>>;
type DeliveriesList = Awaited<ReturnType<typeof prisma.delivery.findMany>>;

function signToken(role: string, sub = 'user-1', name = 'Test User') {
  return jwt.sign(
    { sub, email: `${role.toLowerCase()}@test.com`, role, name },
    process.env['JWT_ACCESS_SECRET'] ?? 'test-secret',
    { expiresIn: '1h' }
  );
}

describe('Phase 10 — Automated Jobs, Reminders & BullMQ', () => {
  const app = createApp();
  let mockSms: MockSmsProvider;
  let mockEmail: MockEmailProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSms = new MockSmsProvider();
    mockEmail = new MockEmailProvider();
    setSmsProvider(mockSms);
    setEmailProvider(mockEmail);
  });

  describe('Providers (SMS & Email)', () => {
    it('MockSmsProvider successfully delivers SMS and records history', async () => {
      const res = await mockSms.send({ to: '0501234567', message: 'בדיקה' });
      expect(res.success).toBe(true);
      expect(res.messageId).toBeDefined();
      expect(mockSms.sentMessages).toHaveLength(1);
      expect(mockSms.sentMessages[0]?.message).toBe('בדיקה');
    });

    it('MockEmailProvider successfully delivers Email and records history', async () => {
      const res = await mockEmail.send({ to: 'customer@test.com', subject: 'שלום', body: 'תוכן' });
      expect(res.success).toBe(true);
      expect(res.messageId).toBeDefined();
      expect(mockEmail.sentEmails).toHaveLength(1);
      expect(mockEmail.sentEmails[0]?.subject).toBe('שלום');
    });
  });

  describe('BullMQ Workers Job Processing', () => {
    it('processes SMS notification job via SMS provider', async () => {
      const job = {
        data: {
          type: 'SMS',
          recipient: '0529998877',
          content: 'הודעת תזכורת',
        },
      } as unknown as Job<NotificationJobData>;

      const res = await processNotificationJob(job);
      expect(res.success).toBe(true);
      expect(mockSms.sentMessages).toHaveLength(1);
      expect(mockSms.sentMessages[0]?.to).toBe('0529998877');
    });

    it('processes EMAIL notification job via Email provider', async () => {
      const job = {
        data: {
          type: 'EMAIL',
          recipient: 'test@example.com',
          subject: 'תזכורת תשלום',
          content: 'פרטי החשבון לתשלום',
        },
      } as unknown as Job<NotificationJobData>;

      const res = await processNotificationJob(job);
      expect(res.success).toBe(true);
      expect(mockEmail.sentEmails).toHaveLength(1);
      expect(mockEmail.sentEmails[0]?.subject).toBe('תזכורת תשלום');
    });

    it('processes Reminder job successfully', async () => {
      const job = {
        data: {
          type: 'QUOTE_EXPIRING',
          orderId: 'clo-1',
        },
      } as unknown as Job<ReminderJobData>;

      const res = await processReminderJob(job);
      expect(res.processed).toBe(true);
      expect(res.type).toBe('QUOTE_EXPIRING');
    });
  });

  describe('Reminders Service Scanning Logic', () => {
    const fixedNow = new Date('2026-10-10T12:00:00.000Z');

    it('checkExpiringQuotes detects quotes expiring within 48h', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        {
          id: 'clo-expiring',
          number: 101,
          status: 'QUOTE_SENT',
          pricing: { validUntil: '2026-10-11' }, // ~36h from fixedNow
          customer: { name: 'דני', phone: '0501111111' },
          publicQuoteToken: 'tok-123',
        },
        {
          id: 'clo-far',
          number: 102,
          status: 'QUOTE_SENT',
          pricing: { validUntil: '2026-10-25' }, // 15 days out
          customer: { name: 'יוסי', phone: '0502222222' },
          publicQuoteToken: 'tok-456',
        },
      ] as unknown as OrdersList);

      const count = await checkExpiringQuotes(fixedNow);
      expect(count).toBe(1);
    });

    it('checkMissingDrivers detects deliveries tomorrow without assigned driver', async () => {
      vi.mocked(prisma.delivery.findMany).mockResolvedValue([
        {
          id: 'cdl-unassigned',
          orderId: 'clo-3',
          orderNumber: 103,
          date: '2026-10-11',
          driverId: null,
          status: 'UNASSIGNED',
        },
      ] as unknown as DeliveriesList);

      const count = await checkMissingDrivers(fixedNow);
      expect(count).toBe(1);
    });

    it('checkEventEveConfirmations finds orders tomorrow and sends confirmation SMS', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        {
          id: 'clo-tomorrow',
          number: 104,
          status: 'CONFIRMED',
          event: { startsAt: '2026-10-11T19:00:00.000Z', address: 'רוטשילד 10' },
          customer: { name: 'מיכל', phone: '0503333333' },
        },
      ] as unknown as OrdersList);

      const count = await checkEventEveConfirmations(fixedNow);
      expect(count).toBe(1);
    });

    it('checkKitchenProductionReadiness detects events today for kitchen', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        {
          id: 'clo-today',
          number: 105,
          status: 'IN_PRODUCTION',
          event: { startsAt: '2026-10-10T14:00:00.000Z' },
          customer: { name: 'איציק' },
        },
      ] as unknown as OrdersList);

      const count = await checkKitchenProductionReadiness(fixedNow);
      expect(count).toBe(1);
    });

    it('checkOverdueBalances triggers reminders for orders delivered with open balance for >= 3 days', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        {
          id: 'clo-delivered-overdue',
          number: 106,
          status: 'DELIVERED',
          totals: { balance: 50000 }, // ₪500
          customer: { name: 'רוני', phone: '0504444444' },
          updatedAt: new Date('2026-10-05T10:00:00.000Z'), // 5 days ago
        },
        {
          id: 'clo-delivered-paid',
          number: 107,
          status: 'DELIVERED',
          totals: { balance: 0 },
          customer: { name: 'גיל', phone: '0505555555' },
          updatedAt: new Date('2026-10-05T10:00:00.000Z'),
        },
      ] as unknown as OrdersList);

      const count = await checkOverdueBalances(fixedNow);
      expect(count).toBe(1);
    });

    it('runAllReminderChecks runs all checks concurrently', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.delivery.findMany).mockResolvedValue([]);

      const results = await runAllReminderChecks(fixedNow);
      expect(results).toEqual({
        quotesExpiring: 0,
        missingDrivers: 0,
        eveConfirmations: 0,
        kitchenAlerts: 0,
        overdueBalances: 0,
      });
    });
  });

  describe('Jobs API Endpoints & RBAC Guards', () => {
    it('allows ADMIN to trigger reminders manually', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.delivery.findMany).mockResolvedValue([]);

      const token = signToken('ADMIN', 'admin-1');
      const res = await request(app)
        .post('/api/v1/jobs/reminders/trigger')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetDate: '2026-10-10T12:00:00.000Z' });

      expect(res.status).toBe(200);
      expect(res.body.data.results).toBeDefined();
    });

    it('rejects non-admin role from triggering reminders (403 Forbidden)', async () => {
      const token = signToken('OFFICE', 'office-1');
      const res = await request(app)
        .post('/api/v1/jobs/reminders/trigger')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('allows ADMIN to query jobs status', async () => {
      const token = signToken('ADMIN', 'admin-1');
      const res = await request(app)
        .get('/api/v1/jobs/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.queues).toBeDefined();
      expect(res.body.data.providers).toBeDefined();
    });

    it('rejects DRIVER role from querying jobs status (403 Forbidden)', async () => {
      const token = signToken('DRIVER', 'driver-1');
      const res = await request(app)
        .get('/api/v1/jobs/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
