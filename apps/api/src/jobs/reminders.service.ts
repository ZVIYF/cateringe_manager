import { prisma } from '../lib/prisma';
import { enqueueNotification, enqueueReminder } from './queues';

export interface ReminderCheckResults {
  quotesExpiring: number;
  missingDrivers: number;
  eveConfirmations: number;
  kitchenAlerts: number;
  overdueBalances: number;
}

/**
 * 1. Quote Expiration Reminders (§10: 48h before expiration)
 */
export async function checkExpiringQuotes(now: Date = new Date()): Promise<number> {
  const activeQuotesOrders = await prisma.order.findMany({
    where: {
      status: 'QUOTE_SENT',
    },
  });

  let count = 0;
  const nowMs = now.getTime();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  for (const order of activeQuotesOrders) {
    const pricing = order.pricing as { validUntil?: string };
    const cust = order.customer as { name?: string; phone?: string; email?: string };

    if (!pricing?.validUntil) continue;

    const validUntilDate = new Date(`${pricing.validUntil}T23:59:59.999Z`);
    const diffMs = validUntilDate.getTime() - nowMs;

    // Trigger reminder if expiring within the next 48 hours (and not already past by more than 24h)
    if (diffMs > 0 && diffMs <= fortyEightHoursMs) {
      const publicBase = process.env['PUBLIC_QUOTE_BASE_URL'] ?? 'http://localhost:5173/p';
      const quoteLink = order.publicQuoteToken ? `${publicBase}/${order.publicQuoteToken}` : publicBase;

      if (cust.phone) {
        await enqueueNotification({
          type: 'SMS',
          recipient: cust.phone,
          content: `שלום ${cust.name || 'לקוח'}, תזכורת: הצעת המחיר להזמנה #${order.number} תפוג בתאריך ${pricing.validUntil}. לצפייה ואישור: ${quoteLink}`,
          orderId: order.id,
          metadata: { reminderType: 'QUOTE_EXPIRING' },
        });
        count++;
      }
    }
  }

  return count;
}

/**
 * 2. Missing Driver Alert (§10: Event tomorrow with delivery but no driver assigned)
 */
export async function checkMissingDrivers(now: Date = new Date()): Promise<number> {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '';

  const unassignedDeliveries = await prisma.delivery.findMany({
    where: {
      date: tomorrow,
      OR: [
        { driverId: null },
        { status: 'UNASSIGNED' },
      ],
    },
  });

  let count = 0;
  for (const delivery of unassignedDeliveries) {
    await enqueueReminder({
      type: 'NO_DRIVER',
      orderId: delivery.orderId,
      date: tomorrow,
    });

    // Also enqueue notification to office channel
    await enqueueNotification({
      type: 'SMS',
      recipient: process.env['OFFICE_ALERT_PHONE'] ?? '0500000000',
      content: `אזהרה למשרד: למשלוח הזמנה #${delivery.orderNumber} המתוכנן למחר (${tomorrow}) טרם שובץ נהג.`,
      orderId: delivery.orderId,
      metadata: { deliveryId: delivery.id, reminderType: 'NO_DRIVER' },
    });
    count++;
  }

  return count;
}

/**
 * 3. Event Eve Confirmation (§10: 18:00 day before event to customer)
 */
export async function checkEventEveConfirmations(now: Date = new Date()): Promise<number> {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '';

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['CONFIRMED', 'IN_PRODUCTION', 'READY'] },
    },
  });

  let count = 0;
  for (const order of orders) {
    const ev = order.event as { startsAt?: string; address?: string; title?: string };
    const cust = order.customer as { name?: string; phone?: string };

    if (ev.startsAt && ev.startsAt.startsWith(tomorrow) && cust.phone) {
      const timeStr = ev.startsAt.includes('T') ? ev.startsAt.split('T')[1]?.slice(0, 5) : '12:00';
      await enqueueNotification({
        type: 'SMS',
        recipient: cust.phone,
        content: `שלום ${cust.name || 'לקוח'}, תזכורת לאירוע מחר (${tomorrow}) בשעה ${timeStr} בכתובת ${ev.address || 'לא צוינה'}. בתיאבון!`,
        orderId: order.id,
        metadata: { reminderType: 'EVENT_EVE_CONFIRMATION' },
      });
      count++;
    }
  }

  return count;
}

/**
 * 4. Kitchen Production Readiness Alert (§10: Morning check)
 */
export async function checkKitchenProductionReadiness(now: Date = new Date()): Promise<number> {
  const today = now.toISOString().split('T')[0] ?? '';

  const ordersToday = await prisma.order.findMany({
    where: {
      status: { in: ['CONFIRMED', 'IN_PRODUCTION', 'READY'] },
    },
  });

  const matching = ordersToday.filter(o => {
    const ev = o.event as { startsAt?: string };
    return ev.startsAt && ev.startsAt.startsWith(today);
  });

  if (matching.length > 0) {
    await enqueueReminder({
      type: 'KITCHEN_ALERT',
      date: today,
    });

    await enqueueNotification({
      type: 'SMS',
      recipient: process.env['KITCHEN_MANAGER_PHONE'] ?? '0500000000',
      content: `בוקר טוב למטבח: דף ייצור מוכן להיום (${today}). סך הכל ${matching.length} אירועים לביצוע.`,
      metadata: { reminderType: 'KITCHEN_ALERT', count: matching.length },
    });
    return matching.length;
  }

  return 0;
}

/**
 * 5. Overdue Balance Reminders (§10: Delivered orders with open balance)
 */
export async function checkOverdueBalances(now: Date = new Date()): Promise<number> {
  const deliveredOrders = await prisma.order.findMany({
    where: {
      status: 'DELIVERED',
    },
  });

  let count = 0;
  const nowMs = now.getTime();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  for (const order of deliveredOrders) {
    const totals = order.totals as { balance?: number };
    const cust = order.customer as { name?: string; phone?: string };

    if (totals?.balance && totals.balance > 0) {
      const orderDate = new Date(order.updatedAt).getTime();
      const diffMs = nowMs - orderDate;

      // If at least 3 days have passed since delivery
      if (diffMs >= threeDaysMs && cust.phone) {
        const balanceShekels = (totals.balance / 100).toFixed(2);
        await enqueueNotification({
          type: 'SMS',
          recipient: cust.phone,
          content: `שלום ${cust.name || 'לקוח'}, קיימת יתרה פתוחה לתשלום בסך ₪${balanceShekels} עבור הזמנה #${order.number}. אנא הסדר את התשלום בהקדם.`,
          orderId: order.id,
          metadata: { reminderType: 'OVERDUE_BALANCE', balance: totals.balance },
        });
        count++;
      }
    }
  }

  return count;
}

/**
 * Run all automated reminder checks
 */
export async function runAllReminderChecks(now: Date = new Date()): Promise<ReminderCheckResults> {
  const [quotesExpiring, missingDrivers, eveConfirmations, kitchenAlerts, overdueBalances] = await Promise.all([
    checkExpiringQuotes(now),
    checkMissingDrivers(now),
    checkEventEveConfirmations(now),
    checkKitchenProductionReadiness(now),
    checkOverdueBalances(now),
  ]);

  return {
    quotesExpiring,
    missingDrivers,
    eveConfirmations,
    kitchenAlerts,
    overdueBalances,
  };
}

