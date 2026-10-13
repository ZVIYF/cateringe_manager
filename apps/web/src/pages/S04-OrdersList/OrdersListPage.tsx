import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders, useCustomersList } from '@/api/orders';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney, labels, type OrderStatus } from '@catering/shared';
import { Plus, Search, Calendar, User, Eye, RotateCcw } from 'lucide-react';

const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: 'הכל', value: '' },
  { label: 'בייצור', value: 'IN_PRODUCTION' },
  { label: 'מאושרות', value: 'CONFIRMED' },
  { label: 'הצעות מחיר', value: 'QUOTE_SENT' },
  { label: 'טיוטות', value: 'DRAFT' },
  { label: 'סגורות', value: 'CLOSED' }
];

function getStatusBadge(status: OrderStatus) {
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

export const OrdersListPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const { data: customersData } = useCustomersList();

  const { data, isLoading, isError, refetch } = useOrders({
    status: selectedStatus || undefined,
    q: searchQuery || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    customerId: customerId || undefined,
    page,
    pageSize: 15
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  const resetFilters = () => {
    setSelectedStatus('');
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setCustomerId('');
    setPage(1);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top action header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">הזמנות ומכירות</h1>
          <p className="text-sm text-slate-600">ניהול כלל ההזמנות, הצעות המחיר ומעקב סטטוסים</p>
        </div>
        <Button asChild className="gap-2 self-start bg-indigo-600 hover:bg-indigo-700">
          <Link to="/orders/new">
            <Plus className="h-4 w-4" />
            <span>הזמנה חדשה</span>
          </Link>
        </Button>
      </div>

      {/* Status quick tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {STATUS_TABS.map(tab => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="חיפוש לפי לקוח / מס'..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pr-9"
              />
            </div>

            {/* Customer filter */}
            <div className="relative">
              <User className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={customerId}
                onChange={e => {
                  setCustomerId(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">כל הלקוחות</option>
                {customersData?.data.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* From date */}
            <div className="relative">
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                placeholder="מתאריך"
                value={fromDate}
                onChange={e => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="pr-9"
              />
            </div>

            {/* To date */}
            <div className="relative flex gap-2">
              <Input
                type="date"
                placeholder="עד תאריך"
                value={toDate}
                onChange={e => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
              />
              {(selectedStatus || searchQuery || fromDate || toDate || customerId) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  title="נקה סינונים"
                  className="px-2"
                >
                  <RotateCcw className="h-4 w-4 text-slate-500" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800">
              תוצאות ({meta ? meta.total : orders.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-500">טוען הזמנות...</div>
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-sm text-rose-600">שגיאה בטעינת רשימת ההזמנות</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
                נסה שוב
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-base font-medium text-slate-700">לא נמצאו הזמנות</p>
              <p className="mt-1 text-sm text-slate-500">נסה לשנות את פרמטרי הסינון או צור הזמנה חדשה</p>
              <Button asChild size="sm" className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                <Link to="/orders/new">יצירת הזמנה חדשה</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">מס' הזמנה</th>
                    <th className="px-4 py-3">לקוח</th>
                    <th className="px-4 py-3">מועד האירוע</th>
                    <th className="px-4 py-3">סועדים</th>
                    <th className="px-4 py-3">סה"כ</th>
                    <th className="px-4 py-3">שולם</th>
                    <th className="px-4 py-3">יתרה לתשלום</th>
                    <th className="px-4 py-3">סטטוס</th>
                    <th className="px-4 py-3 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(order => {
                    const startsAt = new Date(order.eventStartsAt);
                    const formattedDate = !isNaN(startsAt.getTime())
                      ? startsAt.toLocaleDateString('he-IL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : order.eventStartsAt;

                    return (
                      <tr key={order.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-indigo-600">
                          <Link to={`/orders/${order.id}`}>#{order.number}</Link>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{order.customerName}</td>
                        <td className="px-4 py-3 text-slate-600">{formattedDate}</td>
                        <td className="px-4 py-3 text-slate-700">{order.guests}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatMoney(order.total)}
                        </td>
                        <td className="px-4 py-3 text-emerald-700">{formatMoney(order.paid)}</td>
                        <td className="px-4 py-3 font-medium">
                          {order.balance > 0 ? (
                            <span className="text-rose-600">{formatMoney(order.balance)}</span>
                          ) : (
                            <span className="text-slate-500">שולם במלואו</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                        <td className="px-4 py-3 text-center">
                          <Button asChild variant="outline" size="sm" className="h-8 gap-1 px-2.5">
                            <Link to={`/orders/${order.id}`}>
                              <Eye className="h-3.5 w-3.5 text-slate-500" />
                              <span>פרטים</span>
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
              <div>
                עמוד {meta.page} מתוך {meta.totalPages}
              </div>
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
    </div>
  );
};
