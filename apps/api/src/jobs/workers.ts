import { Worker, type Job } from 'bullmq';
import { getRedisConnection } from './redis';
import {
  NOTIFICATIONS_QUEUE_NAME,
  REMINDERS_QUEUE_NAME,
  type NotificationJobData,
  type ReminderJobData,
} from './queues';
import { getSmsProvider } from '../lib/providers/sms.provider';
import { getEmailProvider } from '../lib/providers/email.provider';

export async function processNotificationJob(job: Job<NotificationJobData>): Promise<{ success: boolean; messageId?: string }> {
  const { type, recipient, content, subject } = job.data;

  if (type === 'SMS' || type === 'WHATSAPP') {
    const sms = getSmsProvider();
    const result = await sms.send({ to: recipient, message: content });
    return result;
  }

  if (type === 'EMAIL') {
    const email = getEmailProvider();
    const result = await email.send({
      to: recipient,
      subject: subject || 'הודעה ממערכת קייטרינג',
      body: content,
    });
    return result;
  }

  return { success: true };
}

export async function processReminderJob(job: Job<ReminderJobData>): Promise<{ processed: boolean; type: string }> {
  // Reminders processing logic
  return { processed: true, type: job.data.type };
}

let notificationsWorker: Worker<NotificationJobData> | null = null;
let remindersWorker: Worker<ReminderJobData> | null = null;

export function startWorkers(): {
  notificationsWorker: Worker<NotificationJobData>;
  remindersWorker: Worker<ReminderJobData>;
} {
  const connection = getRedisConnection();

  if (!notificationsWorker) {
    notificationsWorker = new Worker<NotificationJobData>(
      NOTIFICATIONS_QUEUE_NAME,
      processNotificationJob,
      {
        connection,
        concurrency: 5,
      }
    );
  }

  if (!remindersWorker) {
    remindersWorker = new Worker<ReminderJobData>(
      REMINDERS_QUEUE_NAME,
      processReminderJob,
      {
        connection,
        concurrency: 2,
      }
    );
  }

  return { notificationsWorker, remindersWorker };
}

export async function stopWorkers(): Promise<void> {
  if (notificationsWorker) {
    await notificationsWorker.close();
    notificationsWorker = null;
  }
  if (remindersWorker) {
    await remindersWorker.close();
    remindersWorker = null;
  }
}

