import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomers, useCreateCustomer } from '@/api/customers';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney, type CustomerType } from '@catering/shared';
import {
  Users,
  Search,
  Plus,
  ExternalLink,
  X,
  CreditCard,
  DollarSign
} from 'lucide-react';

export const CustomersListPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New customer form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CustomerType>('BUSINESS');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTaxId, setNewTaxId] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useCustomers({
    q: searchQuery || undefined,
    type: selectedType || undefined,
    page,
    pageSize: 15
  });

  const createCustomerMutation = useCreateCustomer();

  const customers = data?.data ?? [];
  const meta = data?.meta;
  const stats = data?.stats;

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim()) {
      setFormError('נא להזין שם לקוח');
      return;
    }
    if (!newPhone.trim()) {
      setFormError('נא להזין מספר טלפון');
      return;
    }
    if (newType === 'BUSINESS' && !newTaxId.trim()) {
      setFormError('ח"פ / עוסק מורשה הינו חובה עבור לקוח עסקי');
      return;
    }

    try {
      await createCustomerMutation.mutateAsync({
        name: newName.trim(),
        type: newType,
        phone: newPhone.trim(),
        email: newEmail.trim() ? newEmail.trim() : null,
        taxId: newTaxId.trim() ? newTaxId.trim() : null,
        billingAddress: newAddress.trim() ? newAddress.trim() : null,
        tags: newTags
          ? newTags
              .split(',')
              .map(t => t.trim())
              .filter(Boolean)
          : [],
        notes: newNotes.trim(),
        contacts: []
      });

      // Reset and close
      setIsCreateModalOpen(false);
      setNewName('');
      setNewType('BUSINESS');
      setNewPhone('');
      setNewEmail('');
      setNewTaxId('');
      setNewAddress('');
      setNewTags('');
      setNewNotes('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('שגיאה בשמירת הלקוח');
      }
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">ניהול לקוחות (CRM)</h1>
          <p className="text-sm text-slate-500">מאגר לקוחות, היסטוריית התקשרות וניהול יתרות</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          לקוח חדש
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">סה"כ לקוחות</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats?.totalCustomers ?? customers.length}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">סה"כ הכנסות מצטברות</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {formatMoney(stats?.totalRevenue ?? 0)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">יתרות פתוחות לגבייה</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {formatMoney(stats?.openBalance ?? 0)}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="חיפוש לפי שם, טלפון, אימייל או ח&quot;פ..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pr-9 text-right"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex gap-2">
              <Button
                variant={selectedType === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedType('');
                  setPage(1);
                }}
              >
                הכל
              </Button>
              <Button
                variant={selectedType === 'BUSINESS' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedType('BUSINESS');
                  setPage(1);
                }}
              >
                עסקי
              </Button>
              <Button
                variant={selectedType === 'PRIVATE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedType('PRIVATE');
                  setPage(1);
                }}
              >
                פרטי
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">טוען לקוחות...</div>
          ) : isError ? (
            <div className="py-12 text-center text-rose-600">
              <p>שגיאה בטעינת הנתונים</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                נסה שוב
              </Button>
            </div>
          ) : customers.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Users className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="font-medium">לא נמצאו לקוחות</p>
              <p className="text-xs text-slate-400 mt-1">נסה לשנות את תנאי הסינון</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                    <th className="py-3 px-4">שם הלקוח</th>
                    <th className="py-3 px-4">סוג</th>
                    <th className="py-3 px-4">טלפון</th>
                    <th className="py-3 px-4">אימייל / ח"פ</th>
                    <th className="py-3 px-4 text-center">הזמנות</th>
                    <th className="py-3 px-4">הכנסות</th>
                    <th className="py-3 px-4">יתרה</th>
                    <th className="py-3 px-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <Link
                          to={`/customers/${c.id}`}
                          className="hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          {c.name}
                        </Link>
                        {c.tags && c.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c.tags.map(t => (
                              <span
                                key={t}
                                className="inline-block text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.type === 'BUSINESS' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            עסקי
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                            פרטי
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 ltr-text" dir="ltr">
                        {c.phone}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {c.email && <div>{c.email}</div>}
                        {c.taxId && <div className="text-slate-400 mt-0.5">ח"פ: {c.taxId}</div>}
                        {!c.email && !c.taxId && <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                        {c.stats.ordersCount}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {formatMoney(c.stats.totalRevenue)}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.stats.openBalance > 0 ? (
                          <span className="font-semibold text-rose-600">
                            {formatMoney(c.stats.openBalance)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">שולם במלואו</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link to={`/customers/${c.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-primary">
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">צפה בכרטיס לקוח</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 text-sm">
              <span className="text-slate-500">
                עמוד {meta.page} מתוך {meta.totalPages} ({meta.total} לקוחות)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  הקודם
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  הבא
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Customer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">הוספת לקוח חדש</h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  שם הלקוח / חברה *
                </label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="למשל: אלתא מערכות בע&quot;מ או ישראל ישראלי"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">סוג לקוח</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as 'BUSINESS' | 'PRIVATE')}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="BUSINESS">עסקי</option>
                    <option value="PRIVATE">פרטי</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">מספר טלפון *</label>
                  <Input
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="050-1234567"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">אימייל</label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="name@company.co.il"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ח"פ / עוסק מורשה {newType === 'BUSINESS' && '*'}
                  </label>
                  <Input
                    value={newTaxId}
                    onChange={e => setNewTaxId(e.target.value)}
                    placeholder="512345678"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">כתובת לחיוב</label>
                <Input
                  value={newAddress}
                  onChange={e => setNewAddress(e.target.value)}
                  placeholder="רחוב, מספר, עיר"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  תגיות (מופרדות בפסיקים)
                </label>
                <Input
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="VIP, חברה, קבוע"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">הערות</label>
                <textarea
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="הערות חשובות לגבי הלקוח..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {createCustomerMutation.isPending ? 'שומר...' : 'צור לקוח'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
