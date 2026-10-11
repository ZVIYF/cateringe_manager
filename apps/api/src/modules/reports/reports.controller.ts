import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { DashboardSchemas } from '@catering/shared';

/**
 * GET /reports/revenue?from=&to=&groupBy=month (§5.9)
 * Accessible by ADMIN.
 */
export async function getRevenueReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to } = req.query as { from?: string; to?: string };

    const orders = await prisma.order.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'LOST', 'DRAFT'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const monthlyMap = new Map<string, { revenue: number; count: number }>();

    for (const o of orders) {
      const event = o.event as { startsAt?: string } | null;
      const dateStr = event?.startsAt ? event.startsAt.slice(0, 10) : o.createdAt.toISOString().slice(0, 10);

      if (from && dateStr < from) continue;
      if (to && dateStr > to) continue;

      const period = dateStr.slice(0, 7); // YYYY-MM
      const totals = o.totals as { total?: number } | null;
      const current = monthlyMap.get(period) ?? { revenue: 0, count: 0 };
      current.revenue += totals?.total ?? 0;
      current.count += 1;
      monthlyMap.set(period, current);
    }

    const items: Array<DashboardSchemas.RevenueReportItem> = Array.from(monthlyMap.entries())
      .map(([period, data]) => ({
        period,
        revenue: data.revenue,
        ordersCount: data.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    res.json({ data: items });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /reports/profitability?from=&to= (§5.9)
 * Accessible by ADMIN.
 */
export async function getProfitabilityReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to } = req.query as { from?: string; to?: string };

    const orders = await prisma.order.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'LOST', 'DRAFT'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items: Array<DashboardSchemas.ProfitabilityReportItem> = [];

    for (const o of orders) {
      const event = o.event as { startsAt?: string } | null;
      const dateStr = event?.startsAt ? event.startsAt.slice(0, 10) : o.createdAt.toISOString().slice(0, 10);

      if (from && dateStr < from) continue;
      if (to && dateStr > to) continue;

      const customer = o.customer as { name?: string } | null;
      const totals = o.totals as { total?: number } | null;
      const revenue = totals?.total ?? 0;

      // Estimate ingredient cost (~35% of total in standard catering model)
      const ingredientCost = Math.round(revenue * 0.35);
      const grossProfit = revenue - ingredientCost;
      const marginPercent = revenue > 0 ? Math.round(((grossProfit / revenue) * 100) * 10) / 10 : 0;

      items.push({
        orderId: o.id,
        number: o.number,
        customerName: customer?.name ?? '',
        revenue,
        ingredientCost,
        grossProfit,
        marginPercent,
      });
    }

    res.json({ data: items });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /reports/top-dishes?from=&to= (§5.9)
 * Accessible by ADMIN.
 */
export async function getTopDishesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to } = req.query as { from?: string; to?: string };

    const orders = await prisma.order.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'LOST'] },
      },
    });

    const dishAgg = new Map<string, { name: string; qty: number; revenue: number }>();

    for (const o of orders) {
      const event = o.event as { startsAt?: string } | null;
      const dateStr = event?.startsAt ? event.startsAt.slice(0, 10) : o.createdAt.toISOString().slice(0, 10);

      if (from && dateStr < from) continue;
      if (to && dateStr > to) continue;

      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items as Array<{ dishId?: string; dishName?: string; qty?: number; lineTotal?: number }>) {
        if (!it.dishId) continue;
        const current = dishAgg.get(it.dishId) ?? {
          name: it.dishName ?? 'מנה',
          qty: 0,
          revenue: 0,
        };
        current.qty += it.qty ?? 0;
        current.revenue += it.lineTotal ?? 0;
        dishAgg.set(it.dishId, current);
      }
    }

    const items: Array<DashboardSchemas.TopDishReportItem> = Array.from(dishAgg.entries())
      .map(([dishId, data]) => ({
        dishId,
        name: data.name,
        qty: data.qty,
        revenue: data.revenue,
        profit: Math.round(data.revenue * 0.65), // ~65% gross margin
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    res.json({ data: items });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /reports/conversion?from=&to= (§5.9)
 * Accessible by ADMIN.
 */
export async function getConversionReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to } = req.query as { from?: string; to?: string };

    const orders = await prisma.order.findMany({
      select: {
        id: true,
        status: true,
        event: true,
        createdAt: true,
      },
    });

    let quotesSent = 0;
    let quotesApproved = 0;

    for (const o of orders) {
      const event = o.event as { startsAt?: string } | null;
      const dateStr = event?.startsAt ? event.startsAt.slice(0, 10) : o.createdAt.toISOString().slice(0, 10);

      if (from && dateStr < from) continue;
      if (to && dateStr > to) continue;

      if (o.status !== 'DRAFT') {
        quotesSent++;
      }
      if (!['DRAFT', 'QUOTE_SENT', 'LOST', 'CANCELLED'].includes(o.status)) {
        quotesApproved++;
      }
    }

    const rate = quotesSent > 0 ? Math.round((quotesApproved / quotesSent) * 100) / 100 : 0;

    const data: DashboardSchemas.ConversionReport = {
      quotesSent,
      quotesApproved,
      rate,
    };

    res.json({ data });
  } catch (err) {
    next(err);
  }
}
