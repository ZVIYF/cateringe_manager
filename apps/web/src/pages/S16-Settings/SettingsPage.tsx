import React, { useState } from 'react';
import {
  useSettings,
  useUpdateSettings,
  useMessageTemplates,
  useUpdateMessageTemplates,
  useUsers,
  useCreateUser,
  useUpdateUser,
  useResetPassword
} from '@/api/settings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Role, UserPublic } from '@catering/shared';
import type { MessageTemplateItem } from '@/mocks/fixtures/settings';
import {
  Settings,
  Building,
  Users,
  MessageSquare,
  KeyRound,
  X,
  Plus,
  Save,
  Power
} from 'lucide-react';

const ROLE_LABELS: Record<Role, { label: string; color: string }> = {
  ADMIN: { label: 'מנהל מערכת', color: 'bg-purple-100 text-purple-800' },
  OFFICE: { label: 'משרד ומכירות', color: 'bg-blue-100 text-blue-800' },
  KITCHEN_MANAGER: { label: 'מנהל מטבח / שף', color: 'bg-amber-100 text-amber-800' },
  KITCHEN_STAFF: { label: 'צוות מטבח', color: 'bg-slate-100 text-slate-800' },
  DRIVER: { label: 'נהג / שליח', color: 'bg-emerald-100 text-emerald-800' }
};

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BUSINESS' | 'USERS' | 'TEMPLATES'>('BUSINESS');

  // Queries & Mutations
  const { data: settingsData, isLoading: loadingSettings } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const { data: templatesData } = useMessageTemplates();
  const updateTemplatesMutation = useUpdateMessageTemplates();

  const { data: usersData, isLoading: loadingUsers, refetch: refetchUsers } = useUsers();
  const createUserMutation = useCreateUser();
  const resetPasswordMutation = useResetPassword();
  const updateUserMutation = useUpdateUser();

  // Business form state
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessVat, setBusinessVat] = useState('');
  const [vatPercent, setVatPercent] = useState('17');
  const [depositPercent, setDepositPercent] = useState('30');
  const [leadTimeDays, setLeadTimeDays] = useState('2');
  const [cancellationPolicy, setCancellationPolicy] = useState('');

  // Sync settings when loaded
  React.useEffect(() => {
    if (settingsData?.data) {
      const { business, defaults } = settingsData.data;
      setBusinessName(business.name);
      setBusinessAddress(business.address);
      setBusinessPhone(business.phone);
      setBusinessEmail(business.email);
      setBusinessVat(business.vatNumber);
      setVatPercent(String(defaults.vatPercent));
      setDepositPercent(String(defaults.depositPercent));
      setLeadTimeDays(String(defaults.defaultLeadTimeDays));
      setCancellationPolicy(defaults.cancellationPolicy);
    }
  }, [settingsData]);

  // Message templates state
  const [templates, setTemplates] = useState<MessageTemplateItem[]>([]);
  React.useEffect(() => {
    if (templatesData?.data) {
      setTemplates(templatesData.data);
    }
  }, [templatesData]);

  // Create User Modal state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('OFFICE');

  const users = usersData?.data ?? [];

  const handleSaveBusinessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsMutation.mutateAsync({
        business: {
          name: businessName.trim(),
          address: businessAddress.trim(),
          phone: businessPhone.trim(),
          email: businessEmail.trim(),
          vatNumber: businessVat.trim()
        },
        defaults: {
          vatPercent: Number(vatPercent) || 17,
          depositPercent: Number(depositPercent) || 30,
          defaultLeadTimeDays: Number(leadTimeDays) || 2,
          cancellationPolicy: cancellationPolicy.trim()
        }
      });
      alert('הגדרות העסק נשמרו בהצלחה!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בשמירת הגדרות');
    }
  };

  const handleSaveTemplates = async () => {
    try {
      await updateTemplatesMutation.mutateAsync(templates);
      alert('תבניות ההודעות עודכנו בהצלחה!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בשמירת תבניות');
    }
  };

  const handleToggleUserActive = async (user: UserPublic) => {
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        body: { active: !user.active }
      });
      refetchUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בעדכון סטטוס משתמש');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserMutation.mutateAsync({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        phone: newUserPhone.trim() || undefined,
        role: newUserRole
      });
      alert('משתמש חדש נוצר בהצלחה!');
      setIsNewUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPhone('');
      refetchUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה ביצירת משתמש');
    }
  };

  const handleResetPassword = async (user: UserPublic) => {
    try {
      const res = await resetPasswordMutation.mutateAsync(user.id);
      alert(res.data.message);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בשליחת איפוס סיסמה');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              הגדרות מערכת וניהול
            </h1>
            <p className="text-sm text-slate-500">
              פרטי חברה, מדיניות תשלומים, משתמשי צוות ותבניות הודעות
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('BUSINESS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'BUSINESS'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>פרטי עסק וברירות מחדל</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'USERS'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>משתמשי צוות והרשאות ({users.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('TEMPLATES')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'TEMPLATES'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>תבניות הודעות וסמס</span>
        </button>
      </div>

      {/* TAB 1: BUSINESS & DEFAULTS */}
      {activeTab === 'BUSINESS' && (
        <Card className="border-slate-200 shadow-sm max-w-3xl">
          <CardContent className="p-6">
            {loadingSettings ? (
              <div className="p-8 text-center text-slate-500">טוען הגדרות עסק...</div>
            ) : (
              <form onSubmit={handleSaveBusinessSettings} className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">פרטי החברה לחשבוניות והצעות</h3>
                  <p className="text-xs text-slate-500">פרטים אלו יופיעו בהדפסות, מסמכים והודעות ללקוחות</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">שם העסק / חברה *</label>
                    <Input
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">מספר ח.פ. / ע.מ. *</label>
                    <Input
                      value={businessVat}
                      onChange={e => setBusinessVat(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">כתובת מלאה *</label>
                  <Input
                    value={businessAddress}
                    onChange={e => setBusinessAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">טלפון משרד *</label>
                    <Input
                      value={businessPhone}
                      onChange={e => setBusinessPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">דוא״ל למסמכים *</label>
                    <Input
                      type="email"
                      value={businessEmail}
                      onChange={e => setBusinessEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="border-b border-slate-100 pt-3 pb-3">
                  <h3 className="text-base font-bold text-slate-900">ברירות מחדל מסחריות</h3>
                  <p className="text-xs text-slate-500">הגדרות בסיס לחישוב עלויות, מקדמות ומדיניות</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">אחוז מע״מ (%)</label>
                    <Input
                      type="number"
                      value={vatPercent}
                      onChange={e => setVatPercent(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">אחוז מקדמה נדרש (%)</label>
                    <Input
                      type="number"
                      value={depositPercent}
                      onChange={e => setDepositPercent(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">זמן התראה מינימלי (ימים)</label>
                    <Input
                      type="number"
                      value={leadTimeDays}
                      onChange={e => setLeadTimeDays(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">מדיניות ביטולים מובנית</label>
                  <Input
                    value={cancellationPolicy}
                    onChange={e => setCancellationPolicy(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-white font-bold flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>שמור הגדרות עסק</span>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: STAFF USERS */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              ניהול משתמשי מערכת, הרשאות תפקיד, והפעלה/השבתה של חשבונות
            </p>
            <Button
              onClick={() => setIsNewUserModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>משתמש חדש</span>
            </Button>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {loadingUsers ? (
                <div className="p-8 text-center text-slate-500">טוען משתמשים...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 text-slate-600 text-xs font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">שם מלא</th>
                        <th className="px-4 py-3">אימייל</th>
                        <th className="px-4 py-3">טלפון</th>
                        <th className="px-4 py-3">תפקיד במערכת</th>
                        <th className="px-4 py-3">סטטוס פעיל</th>
                        <th className="px-4 py-3 text-left">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => {
                        const roleInfo = ROLE_LABELS[u.role] || { label: u.role, color: 'bg-slate-100' };

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-bold text-slate-900">{u.name}</td>
                            <td className="px-4 py-3 text-slate-600 text-xs font-mono">{u.email}</td>
                            <td className="px-4 py-3 text-slate-600 text-xs font-mono" dir="ltr">
                              {u.phone || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${roleInfo.color}`}
                              >
                                {roleInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => handleToggleUserActive(u)}
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${
                                  u.active
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                }`}
                              >
                                <Power className="h-3 w-3" />
                                <span>{u.active ? 'פעיל' : 'מושבת'}</span>
                              </button>
                            </td>
                            <td className="px-4 py-3 text-left">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetPassword(u)}
                                className="h-8 text-xs text-slate-600 flex items-center gap-1"
                                title="שלח קישור לאיפוס סיסמה"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                <span>איפוס סיסמה</span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: MESSAGE TEMPLATES */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">תבניות הודעות אוטומטיות (SMS / WhatsApp)</p>
              <p className="text-xs text-slate-500">
                ניתן להשתמש במשתנים דינמיים: <code>{'{{customerName}}'}</code>, <code>{'{{orderNumber}}'}</code>, <code>{'{{eventDate}}'}</code>, <code>{'{{link}}'}</code>, <code>{'{{amount}}'}</code>
              </p>
            </div>
            <Button
              onClick={handleSaveTemplates}
              disabled={updateTemplatesMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>שמור תבניות</span>
            </Button>
          </div>

          <div className="space-y-4">
            {templates.map((tmpl, idx) => (
              <Card key={tmpl.id} className="border-slate-200 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{tmpl.title}</h4>
                      <p className="text-xs text-slate-500">{tmpl.description}</p>
                    </div>
                    <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {tmpl.key}
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={tmpl.template}
                    onChange={e => {
                      const updated = [...templates];
                      updated[idx] = { ...tmpl, template: e.target.value };
                      setTemplates(updated);
                    }}
                    className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <button
              onClick={() => setIsNewUserModalOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900">הוספת משתמש מערכת חדש</h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">שם מלא *</label>
                <Input
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="ישראל ישראלי"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">אימייל (שם משתמש לכניסה) *</label>
                <Input
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="user@dev.local"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">טלפון נייד</label>
                <Input
                  value={newUserPhone}
                  onChange={e => setNewUserPhone(e.target.value)}
                  placeholder="050-1234567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">תפקיד והרשאות *</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as Role)}
                  className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white"
                  required
                >
                  <option value="ADMIN">מנהל מערכת (ADMIN)</option>
                  <option value="OFFICE">משרד ומכירות (OFFICE)</option>
                  <option value="KITCHEN_MANAGER">מנהל מטבח (KITCHEN_MANAGER)</option>
                  <option value="KITCHEN_STAFF">צוות מטבח (KITCHEN_STAFF)</option>
                  <option value="DRIVER">נהג / שליח (DRIVER)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewUserModalOpen(false)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white font-bold"
                >
                  צור משתמש
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
