import { remindersQueue } from './queues';
import { runAllReminderChecks } from './reminders.service';

export async function scheduleRecurringJobs(): Promise<void> {
  // 1. Hourly check for quote expirations and missing drivers
  await remindersQueue.add(
    'hourly-reminders-scan',
    { type: 'QUOTE_EXPIRING' },
    {
      repeat: {
        pattern: '0 * * * *', // every hour
      },
    }
  );

  // 2. Daily morning kitchen production readiness check at 06:00
  await remindersQueue.add(
    'daily-kitchen-readiness',
    { type: 'KITCHEN_ALERT' },
    {
      repeat: {
        pattern: '0 6 * * *', // 06:00 every day
      },
    }
  );

  // 3. Daily evening customer confirmation check at 18:00
  await remindersQueue.add(
    'daily-event-eve-confirmation',
    { type: 'EVENT_EVE_CONFIRMATION' },
    {
      repeat: {
        pattern: '0 18 * * *', // 18:00 every day
      },
    }
  );
}

export async function triggerImmediateChecks() {
  return await runAllReminderChecks();
}

