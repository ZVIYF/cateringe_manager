export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(params: SendEmailParams): Promise<EmailResult>;
}

export class MockEmailProvider implements EmailProvider {
  public sentEmails: Array<SendEmailParams & { timestamp: Date; messageId: string }> = [];

  async send(params: SendEmailParams): Promise<EmailResult> {
    const messageId = `email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.sentEmails.push({
      ...params,
      timestamp: new Date(),
      messageId,
    });
    return { success: true, messageId };
  }

  clear(): void {
    this.sentEmails = [];
  }
}

export class ConsoleEmailProvider implements EmailProvider {
  async send(params: SendEmailParams): Promise<EmailResult> {
    const messageId = `email-${Date.now()}`;
    console.log(`[EMAIL] To: ${params.to} | Subject: ${params.subject} | Body: ${params.body}`);
    return { success: true, messageId };
  }
}

let currentProvider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (currentProvider) return currentProvider;

  const providerType = process.env['EMAIL_PROVIDER'] ?? 'mock';
  if (providerType === 'console') {
    currentProvider = new ConsoleEmailProvider();
  } else {
    currentProvider = new MockEmailProvider();
  }

  return currentProvider;
}

export function setEmailProvider(provider: EmailProvider): void {
  currentProvider = provider;
}

