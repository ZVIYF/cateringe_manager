import { Queue } from 'bullmq';
import { getRedisConnection } from './redis';

export interface NotificationJobData {
  type: 'SMS' | 'EMAIL' | 'WHATSAPP';
  recipient: string;
  subject?: string;
  content: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
}

export interface ReminderJobData {
  type: 'QUOTE_EXPIRING' | 'NO_DRIVER' | 'EVENT_EVE_CONFIRMATION' | 'KITCHEN_ALERT' | 'OVERDUE_BALANCE';
  orderId?: string;
  date?: string;
  targetTime?: string;
}

export const NOTIFICATIONS_QUEUE_NAME = 'notifications';
export const REMINDERS_QUEUE_NAME = 'reminders';

export const notificationsQueue = new Queue<NotificationJobData>(NOTIFICATIONS_QUEUE_NAME, {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const remindersQueue = new Queue<ReminderJobData>(REMINDERS_QUEUE_NAME, {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export async function enqueueNotification(data: NotificationJobData): Promise<string> {
  const job = await notificationsQueue.add(`notify-${data.type.toLowerCase()}-${Date.now()}`, data);
  return job.id ?? 'unknown';
}

export async function enqueueReminder(data: ReminderJobData): Promise<string> {
  const job = await remindersQueue.add(`remind-${data.type.toLowerCase()}-${Date.now()}`, data);
  return job.id ?? 'unknown';
}

