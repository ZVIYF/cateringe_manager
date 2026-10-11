import type { Request, Response, NextFunction } from 'express';
import { runAllReminderChecks } from '../../jobs/reminders.service';
import { notificationsQueue, remindersQueue } from '../../jobs/queues';

/**
 * POST /jobs/reminders/trigger
 * Manually trigger all reminder scans (ADMIN only).
 */
export async function triggerReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { targetDate } = req.body as { targetDate?: string };
    const date = targetDate ? new Date(targetDate) : new Date();

    const results = await runAllReminderChecks(date);

    res.json({
      data: {
        triggeredAt: new Date().toISOString(),
        results,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /jobs/status
 * Get queue metrics and job health status (ADMIN only).
 */
export async function getJobsStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [notifCounts, reminderCounts] = await Promise.all([
      notificationsQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed').catch(() => ({})),
      remindersQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed').catch(() => ({})),
    ]);

    res.json({
      data: {
        queues: {
          notifications: notifCounts,
          reminders: reminderCounts,
        },
        providers: {
          sms: process.env['SMS_PROVIDER'] ?? 'mock',
          email: process.env['EMAIL_PROVIDER'] ?? 'mock',
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

