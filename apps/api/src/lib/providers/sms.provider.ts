export interface SendSmsParams {
  to: string;
  message: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  send(params: SendSmsParams): Promise<SmsResult>;
}

export class MockSmsProvider implements SmsProvider {
  public sentMessages: Array<SendSmsParams & { timestamp: Date; messageId: string }> = [];

  async send(params: SendSmsParams): Promise<SmsResult> {
    const messageId = `sms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.sentMessages.push({
      ...params,
      timestamp: new Date(),
      messageId,
    });
    return { success: true, messageId };
  }

  clear(): void {
    this.sentMessages = [];
  }
}

export class ConsoleSmsProvider implements SmsProvider {
  async send(params: SendSmsParams): Promise<SmsResult> {
    const messageId = `sms-${Date.now()}`;
    console.log(`[SMS] To: ${params.to} | Message: ${params.message}`);
    return { success: true, messageId };
  }
}

let currentProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (currentProvider) return currentProvider;

  const providerType = process.env['SMS_PROVIDER'] ?? 'mock';
  if (providerType === 'console') {
    currentProvider = new ConsoleSmsProvider();
  } else {
    currentProvider = new MockSmsProvider();
  }

  return currentProvider;
}

export function setSmsProvider(provider: SmsProvider): void {
  currentProvider = provider;
}

