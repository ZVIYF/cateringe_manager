import type { UserPublic } from '@catering/shared';

export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  vatNumber: string;
  kashrutCertificateUrl?: string | null;
}

export interface DefaultSettings {
  vatPercent: number;
  depositPercent: number;
  defaultLeadTimeDays: number;
  cancellationPolicy: string;
}

export interface SettingsData {
  business: BusinessSettings;
  defaults: DefaultSettings;
  blockedDates?: Array<{ date: string; reason: string }>;
}

export const mockSettings: SettingsData = {
  business: {
    name: 'קייטרינג השף והטעם בע"מ',
    address: 'דרך המלאכה 8, אזור התעשייה פולג, נתניה',
    phone: '09-8877665',
    email: 'info@chef-taste.co.il',
    vatNumber: '514890123',
    kashrutCertificateUrl: null
  },
  defaults: {
    vatPercent: 17,
    depositPercent: 30,
    defaultLeadTimeDays: 2,
    cancellationPolicy: 'ביטול עד 72 שעות מראש - החזר מלא של המקדמה בניכוי דמי טיפול.'
  },
  blockedDates: [
    { date: '2026-09-20', reason: 'ערב ראש השנה' },
    { date: '2026-09-29', reason: 'ערב יום כיפור' }
  ]
};

export interface MessageTemplateItem {
  id: string;
  key: string;
  title: string;
  template: string;
  description: string;
}

export const mockMessageTemplates: MessageTemplateItem[] = [
  {
    id: 'tmpl-1',
    key: 'QUOTE_SENT',
    title: 'שליחת הצעת מחיר ללקוח',
    template: 'שלום {{customerName}}, הצעת המחיר לאירוע בתאריך {{eventDate}} מוכנה לצפייה ואישור דיגיטלי בקישור: {{link}}',
    description: 'נשלח בסמס או וואטסאפ בעת הפקת הצעה חדשה'
  },
  {
    id: 'tmpl-2',
    key: 'ORDER_CONFIRMED',
    title: 'אישור הזמנה וקבלת מקדמה',
    template: 'שלום {{customerName}}, הזמנה #{{orderNumber}} אושרה בהצלחה! מחכים לשמח אתכם באירוע בתאריך {{eventDate}}.',
    description: 'נשלח לאחר תשלום מקדמה ואישור ההזמנה'
  },
  {
    id: 'tmpl-3',
    key: 'DELIVERY_STARTED',
    title: 'יציאת משלוח לדרך',
    template: 'שלום {{customerName}}, המשלוח להזמנה #{{orderNumber}} יצא כעת לדרך עם הנהג! צפי הגעה בקרוב.',
    description: 'נשלח אוטומטית ברגע שהנהג לוחץ על "התחל נסיעה"'
  },
  {
    id: 'tmpl-4',
    key: 'PAYMENT_REMINDER',
    title: 'תזכורת לתשלום יתרה פתוחה',
    template: 'שלום {{customerName}}, נותרה יתרה לתשלום על סך {{amount}} עבור הזמנה #{{orderNumber}}. לתשלום מאובטח: {{link}}',
    description: 'תזכורת יתרה פתוחה לאחר האירוע'
  }
];

export const mockStaffUsers: UserPublic[] = [
  {
    id: 'clu_admin',
    name: 'ידידיה שוורץ',
    email: 'admin@dev.local',
    role: 'ADMIN',
    active: true,
    phone: '050-1234567'
  },
  {
    id: 'clu_office',
    name: 'נועה ברק',
    email: 'office@dev.local',
    role: 'OFFICE',
    active: true,
    phone: '052-2345678'
  },
  {
    id: 'clu_chef',
    name: 'שף יוסי לוי',
    email: 'chef@dev.local',
    role: 'KITCHEN_MANAGER',
    active: true,
    phone: '054-3456789'
  },
  {
    id: 'clu_cook',
    name: 'דנה פרידמן',
    email: 'cook@dev.local',
    role: 'KITCHEN_STAFF',
    active: true,
    phone: '053-4567890'
  },
  {
    id: 'clu_driver',
    name: 'אבי כהן (נהג)',
    email: 'driver@dev.local',
    role: 'DRIVER',
    active: true,
    phone: '058-5678901'
  }
];

