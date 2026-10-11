import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { DashboardSchemas, type OrderStatus } from '@catering/shared';

function getWeekRange(date = new Date()) {
  const start = new Date(date);
  // Sunday is start of week in Israel (0)
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getLast6MonthsRevenue(orders: Array<{ event: unknown; totals: unknown; status: OrderStatus }>) {
  const months: Array<{ month: string; revenue: number }> = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    let monthRevenue = 0;
    for (const o of orders) {
      if (['CANCELLED', 'LOST', 'DRAFT'].includes(o.status)) continue;
      const event = o.event as { startsAt?: string } | null;
      if (!event?.startsAt) continue;
      if (event.startsAt.startsWith(monthKey)) {
        const totals = o.totals as { total?: number } | null;
        monthRevenue += totals?.total ?? 0;
      }
    }
    months.push({ month: monthKey, revenue: monthRevenue });
  }
  return months;
}

/**
 * GET /dashboard (§5.9)
 * Returns aggregated KPIs, upcoming events, alerts, and revenue trends.
 * RBAC: If requester has OFFICE role, revenueThisMonth and revenueChart are omitted.
 */
export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [orders, quotesWithChanges, recentPayments] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quote.findMany({
        where: { changeRequest: { not: null } },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: { status: 'SUCCEEDED' },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const { start: weekStart, end: weekEnd } = getWeekRange();
    const { start: monthStart, end: monthEnd } = getMonthRange();
    const nowMs = Date.now();
    const in48Hours = new Date(nowMs + 48 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '';
    const in24Hours = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();

    let eventsThisWeek = 0;
    let pendingQuotes = 0;
    let revenueThisMonth = 0;
    let openBalances = 0;

    for (const o of orders) {
      const event = o.event as { startsAt?: string } | null;
      const totals = o.totals as { total?: number; balance?: number } | null;
      const eventDate = event?.startsAt ? new Date(event.startsAt) : null;

      // Pending quotes
      if (o.status === 'QUOTE_SENT') {
        pendingQuotes++;
      }

      // Active events
      const isActive = !['CANCELLED', 'LOST', 'DRAFT'].includes(o.status);

      if (isActive && eventDate) {
        if (eventDate >= weekStart && eventDate < weekEnd) {
          eventsThisWeek++;
        }
        if (eventDate >= monthStart && eventDate <= monthEnd) {
          revenueThisMonth += totals?.total ?? 0;
        }
      }

      // Open balances
      if (isActive && totals?.balance && totals.balance > 0) {
        openBalances += totals.balance;
      }
    }

    // Upcoming events
    const upcoming = orders
      .map(o => {
        const event = o.event as { startsAt?: string; guests?: number } | null;
        const customer = o.customer as { name?: string } | null;
        const totals = o.totals as { total?: number; paid?: number } | null;
        const total = totals?.total ?? 0;
        const paid = totals?.paid ?? 0;
        let paymentState = 'UNPAID';
        if (paid >= total && total > 0) {
          paymentState = 'PAID';
        } else if (paid > 0) {
          paymentState = 'DEPOSIT';
        }

        return {
          orderId: o.id,
          number: o.number,
          startsAt: event?.startsAt ?? o.createdAt.toISOString(),
          customerName: customer?.name ?? '',
          guests: event?.guests ?? 1,
          status: o.status,
          paymentState,
        };
      })
      .filter(o => o.status !== 'CANCELLED' && o.status !== 'LOST' && o.status !== 'CLOSED')
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .slice(0, 10);

    // Alerts
    const alerts: Array<DashboardSchemas.DashboardAlert> = [];

    // Expiring quotes
    for (const o of orders) {
      if (o.status === 'QUOTE_SENT') {
        const pricing = o.pricing as { validUntil?: string } | null;
        if (pricing?.validUntil && pricing.validUntil <= in48Hours) {
          alerts.push({
            type: 'QUOTE_EXPIRING',
            message: `הצעת מחיר להזמנה #${o.number} עומדת לפוג בתאריך ${pricing.validUntil}`,
            link: `/orders/${o.id}`,
          });
        }
      }
    }

    // Customer change requests
    for (const q of quotesWithChanges) {
      alerts.push({
        type: 'CHANGE_REQUESTED',
        message: `התקבלה בקשת שינוי להצעת מחיר`,
        link: `/orders/${q.orderId}`,
      });
    }

    // Payment alerts
    for (const p of recentPayments) {
      alerts.push({
        type: 'PAYMENT_RECEIVED',
        message: `התקבל תשלום ע"ס ₪${(p.amount / 100).toLocaleString('he-IL')} להזמנה`,
        link: `/payments?orderId=${p.orderId}`,
      });
    }

    // Deliveries without driver in next 24h
    for (const o of orders) {
      if (['CONFIRMED', 'IN_PRODUCTION', 'READY'].includes(o.status)) {
        const event = o.event as { startsAt?: string; serviceType?: string } | null;
        if (event?.serviceType?.startsWith('DELIVERY') && event.startsAt && event.startsAt <= in24Hours) {
          alerts.push({
            type: 'NO_DRIVER',
            message: `הזמנה #${o.number} למשלוח ב-24 השעות הקרובות ללא נהג משובץ`,
            link: `/orders/${o.id}`,
          });
        }
      }
    }

    // Revenue chart (last 6 months)
    const revenueChart = getLast6MonthsRevenue(orders);

    // CRITICAL RBAC CHECK:
    // If requesting user is OFFICE (and not ADMIN), omit revenueThisMonth and revenueChart per §5.9.
    const isOffice = req.user?.role === 'OFFICE';

    const kpis: DashboardSchemas.DashboardKpis = {
      eventsThisWeek,
      pendingQuotes,
      revenueThisMonth: isOffice ? undefined : revenueThisMonth,
      openBalances,
    };

    const dashboardData: DashboardSchemas.DashboardData = {
      kpis,
      upcoming,
      alerts: alerts.slice(0, 10),
      revenueChart: isOffice ? undefined : revenueChart,
    };

    const response = DashboardSchemas.DashboardResponse.parse({
      data: dashboardData,
    });

    res.json(response);
  } catch (err) {
    next(err);
  }
}
