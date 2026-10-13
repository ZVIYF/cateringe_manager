import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCustomer, useCustomerOrders, useUpdateCustomer } from '@/api/customers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney, labels, type OrderStatus, type CustomerType } from '@catering/shared';
import {
  ArrowRight,
  Phone,
  Mail,
  CreditCard,
  ShoppingBag,
  Edit2,
  X
} from 'lucide-react';

function getOrderStatusBadge(status: OrderStatus) {
  const label = labels.OrderStatus[status] ?? status;
  switch (status) {
    case 'IN_PRODUCTION':
      return <Badge className="bg-amber-500 text-white border-transparent">{label}</Badge>;
    case 'CONFIRMED':
      return <Badge className="bg-indigo-600 text-white border-transparent">{label}</Badge>;
    case 'READY':
    case 'DELIVERED':
      return <Badge variant="success">{label}</Badge>;
    case 'QUOTE_SENT':
      return <Badge variant="warning">{label}</Badge>;
    case 'DRAFT':
    case 'CLOSED':
      return <Badge variant="secondary">{label}</Badge>;
    case 'CANCELLED':
    case 'LOST':
      return <Badge variant="destructive">{label}</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
}

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: customerData, isLoading, isError } = useCustomer(id);
  const { data: ordersData, isLoading: isLoadingOrders } = useCustomerOrders(id);
  const updateMutation = useUpdateCustomer(id ?? '');

  const customer = customerData?.data;
  const orders = ordersData?.data ?? [];

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<CustomerType>('BUSINESS');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTaxId, setEditTaxId] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const openEditModal = () => {
    if (!customer) return;
    setEditName(customer.name);
    setEditType(customer.type);
    setEditPhone(customer.phone);
    setEditEmail(customer.email ?? '');
    setEditTaxId(customer.taxId ?? '');
    setEditAddress(customer.billingAddress ?? '');
    setEditTags(customer.tags?.join(', ') ?? '');
    setEditNotes(customer.notes ?? '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setEditError(null);

    if (!editName.trim()) {
      setEditError('שם הלקוח הוא שדה חובה');
      return;
    }
    if (editType === 'BUSINESS' && !editTaxId.trim()) {
      setEditError('ח"פ / עוסק מורשה הינו חובה עבור לקוח עסקי');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        version: customer.version,
        name: editName.trim(),
        type: editType,
        phone: editPhone.trim(),
        email: editEmail.trim() ? editEmail.trim() : null,
        taxId: editTaxId.trim() ? editTaxId.trim() : null,
        billingAddress: editAddress.trim() ? editAddress.trim() : null,
        tags: editTags
          ? editTags
              .split(',')
              .map(t => t.trim())
              .filter(Boolean)
          : [],
        notes: editNotes.trim()
      });
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError('שגיאה בעדכון פרטי הלקוח');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-500" dir="rtl">
        טוען כרטיס לקוח...
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="py-20 text-center text-rose-600 space-y-4" dir="rtl">
        <p className="text-lg font-semibold">הלקוח לא נמצא או שארעה שגיאה בטעינת הפרטים</p>
        <Link to="/customers">
          <Button variant="outline">חזרה לרשימת לקוחות</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Back link & Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/customers"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה לכל הלקוחות
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{customer.name}</h1>
            <Badge
              variant="outline"
              className={
                customer.type === 'BUSINESS'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }
            >
              {customer.type === 'BUSINESS' ? 'לקוח עסקי' : 'לקוח פרטי'}
            </Badge>
          </div>
        </div>

        <Button
          onClick={openEditModal}
          variant="outline"
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Edit2 className="h-4 w-4" />
          ערוך פרטי לקוח
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">הזמנות שבוצעו</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {customer.stats.ordersCount}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">מחזור עסקאות מצטבר</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {formatMoney(customer.stats.totalRevenue)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">יתרה פתוחה לתשלום</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {formatMoney(customer.stats.openBalance)}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info & Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-800">פרטי התקשרות וחיוב</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3.5 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500">טלפון ראשי:</span>
              <a
                href={`tel:${customer.phone}`}
                className="font-medium text-slate-900 hover:text-primary ltr-text"
                dir="ltr"
              >
                {customer.phone}
              </a>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500">אימייל:</span>
              {customer.email ? (
                <a
                  href={`mailto:${customer.email}`}
                  className="font-medium text-slate-900 hover:text-primary ltr-text"
                  dir="ltr"
                >
                  {customer.email}
                </a>
              ) : (
                <span className="text-slate-400">לא הוגדר</span>
              )}
            </div>

            {customer.taxId && (
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">ח"פ / עוסק מורשה:</span>
                <span className="font-medium text-slate-900" dir="ltr">
                  {customer.taxId}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span className="text-slate-500">כתובת לחיוב:</span>
              <span className="font-medium text-slate-900">
                {customer.billingAddress || 'לא צוינה כתובת'}
              </span>
            </div>

            {customer.tags && customer.tags.length > 0 && (
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">תגיות:</span>
                <div className="flex flex-wrap gap-1">
                  {customer.tags.map(t => (
                    <span
                      key={t}
                      className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {customer.notes && (
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">הערות:</span>
                <p className="p-3 bg-slate-50 rounded-lg text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                  {customer.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-800">אנשי קשר נוספים</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {customer.contacts && customer.contacts.length > 0 ? (
              <div className="space-y-3">
                {customer.contacts.map(c => (
                  <div
                    key={c.id}
                    className="p-3 border border-slate-100 rounded-lg bg-slate-50/50 flex flex-col gap-1 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{c.name}</span>
                      <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {c.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                      <span className="flex items-center gap-1 ltr-text" dir="ltr">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {c.phone}
                      </span>
                      {c.email && (
                        <span className="flex items-center gap-1 ltr-text" dir="ltr">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {c.email}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">
                אין אנשי קשר נוספים המוגדרים ללקוח זה
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Purchase History / Orders */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-800">
            היסטוריית הזמנות ({orders.length})
          </CardTitle>
          <Link to="/orders/new">
            <Button size="sm" variant="outline" className="text-xs">
              הזמנה חדשה עבור לקוח זה
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingOrders ? (
            <div className="py-8 text-center text-slate-500 text-sm">טוען הזמנות...</div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              טרם בוצעו הזמנות עבור לקוח זה
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                    <th className="py-3 px-4">מספר</th>
                    <th className="py-3 px-4">אירוע</th>
                    <th className="py-3 px-4">תאריך ושעה</th>
                    <th className="py-3 px-4">סטטוס</th>
                    <th className="py-3 px-4 text-center">אורחים</th>
                    <th className="py-3 px-4">סה"כ לתשלום</th>
                    <th className="py-3 px-4">יתרה</th>
                    <th className="py-3 px-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        #{o.number}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        אירוע #{o.number}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {new Date(o.eventStartsAt).toLocaleDateString('he-IL')}
                      </td>
                      <td className="py-3 px-4">
                        {getOrderStatusBadge(o.status)}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700">
                        {o.guests}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {formatMoney(o.total)}
                      </td>
                      <td className="py-3 px-4">
                        {o.balance > 0 ? (
                          <span className="font-semibold text-rose-600">
                            {formatMoney(o.balance)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">שולם במלואו</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link to={`/orders/${o.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-primary">
                            פתח הזמנה
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">עריכת פרטי לקוח</h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  שם הלקוח / חברה *
                </label>
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">סוג לקוח</label>
                  <select
                    value={editType}
                    onChange={e => setEditType(e.target.value as 'BUSINESS' | 'PRIVATE')}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="BUSINESS">עסקי</option>
                    <option value="PRIVATE">פרטי</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">מספר טלפון *</label>
                  <Input
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
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
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ח"פ / עוסק מורשה {editType === 'BUSINESS' && '*'}
                  </label>
                  <Input
                    value={editTaxId}
                    onChange={e => setEditTaxId(e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">כתובת לחיוב</label>
                <Input
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  תגיות (מופרדות בפסיקים)
                </label>
                <Input
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">הערות</label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {updateMutation.isPending ? 'שומר...' : 'שמור שינויים'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
