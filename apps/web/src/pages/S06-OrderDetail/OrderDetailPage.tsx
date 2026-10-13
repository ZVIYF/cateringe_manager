import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  useOrder,
  useTransitionOrder,
  useDuplicateOrder,
  useSendQuote
} from '@/api/orders';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  formatMoney,
  labels,
  type OrderStatus
} from '@catering/shared';
import {
  Calendar,
  Users,
  MapPin,
  Phone,
  Edit3,
  FileText,
  Send,
  Copy,
  ArrowRight,
  Clock,
  ShieldCheck,
  DollarSign
} from 'lucide-react';

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

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useOrder(id);
  const transitionMutation = useTransitionOrder(id ?? '');
  const duplicateMutation = useDuplicateOrder(id ?? '');
  const sendQuoteMutation = useSendQuote(id ?? '');

  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState('');
  const [sendSuccessMsg, setSendSuccessMsg] = useState('');

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-slate-500" dir="rtl">טוען פרטי הזמנה...</div>;
  }

  if (isError || !data?.data) {
    return (
      <div className="p-12 text-center" dir="rtl">
        <p className="text-base font-semibold text-rose-600">ההזמנה לא נמצאה או שאירעה שגיאה</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
          נסה שוב
        </Button>
      </div>
    );
  }

  const order = data.data;

  // Handle status transition
  const handleTransition = async (toStatus: OrderStatus) => {
    try {
      await transitionMutation.mutateAsync({ to: toStatus });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בשינוי סטטוס');
    }
  };

  // Handle duplication
  const handleDuplicate = async () => {
    if (!duplicateDate) return;
    try {
      const res = await duplicateMutation.mutateAsync({
        startsAt: new Date(duplicateDate).toISOString()
      });
      setIsDuplicateOpen(false);
      navigate(`/orders/${res.data.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בשכפול ההזמנה');
    }
  };

  // Handle quote send
  const handleSendQuote = async () => {
    try {
      const res = await sendQuoteMutation.mutateAsync({
        channels: ['WHATSAPP', 'SMS']
      });
      setSendSuccessMsg(`ההצעה נשלחה בהצלחה! קישור פורטל: ${res.data.publicUrl}`);
      setTimeout(() => setSendSuccessMsg(''), 8000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בשליחת הצעת המחיר');
    }
  };

  const startsAt = new Date(order.event.startsAt);
  const formattedStartsAt = !isNaN(startsAt.getTime())
    ? startsAt.toLocaleDateString('he-IL', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : order.event.startsAt;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top back navigation & quick meta */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-8 gap-1">
            <Link to="/orders">
              <ArrowRight className="h-4 w-4" />
              <span>חזרה להזמנות</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              הזמנה #{order.number}
            </h1>
            {getStatusBadge(order.status)}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to={`/orders/${order.id}/edit`}>
              <Edit3 className="h-4 w-4 text-slate-600" />
              <span>ערוך הזמנה</span>
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to={`/orders/${order.id}/quote`}>
              <FileText className="h-4 w-4 text-slate-600" />
              <span>צפה בהצעה</span>
            </Link>
          </Button>

          <Button
            size="sm"
            onClick={handleSendQuote}
            disabled={sendQuoteMutation.isPending}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="h-4 w-4" />
            <span>שלח ללקוח</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDuplicateOpen(true)}
            className="gap-1.5"
          >
            <Copy className="h-4 w-4 text-slate-600" />
            <span>שכפל</span>
          </Button>
        </div>
      </div>

      {sendSuccessMsg && (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200">
          {sendSuccessMsg}
        </div>
      )}

      {/* Duplicate Dialog Modal */}
      {isDuplicateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-2">שכפול הזמנה #{order.number}</h2>
            <p className="text-sm text-slate-600 mb-4">
              בחר תאריך ושעה חדשים עבור האירוע המשוכפל:
            </p>
            <Input
              type="datetime-local"
              value={duplicateDate}
              onChange={e => setDuplicateDate(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDuplicateOpen(false)}>
                ביטול
              </Button>
              <Button
                size="sm"
                disabled={!duplicateDate || duplicateMutation.isPending}
                onClick={handleDuplicate}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                שכפל עכשיו
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Allowed Status Transitions Bar */}
      {order.allowedTransitions.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">פעולות סטטוס זמינות:</span>
              <span className="text-xs text-slate-400">העבר הזמנה לשלב הבא במחזור החיים</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {order.allowedTransitions.map((targetStatus: OrderStatus) => (
                <Button
                  key={targetStatus}
                  variant="outline"
                  size="sm"
                  disabled={transitionMutation.isPending}
                  onClick={() => handleTransition(targetStatus)}
                  className={`text-xs font-medium ${
                    targetStatus === 'CANCELLED' || targetStatus === 'LOST'
                      ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                      : 'text-indigo-700 hover:bg-indigo-50 border-indigo-200'
                  }`}
                >
                  העבר ל-"{labels.OrderStatus[targetStatus as keyof typeof labels.OrderStatus] ?? targetStatus}"
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards: Event Info + Customer + Financials */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Card 1: Event Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span>פרטי האירוע</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {order.event.title && (
              <div className="font-semibold text-slate-900">{order.event.title}</div>
            )}
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>{formattedStartsAt}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{order.event.address}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="h-4 w-4 text-slate-400" />
              <span>{order.event.guests} מוזמנים</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <Badge variant={order.event.kashrut === 'MEAT' ? 'meat' : order.event.kashrut === 'DAIRY' ? 'dairy' : 'parve'}>
                {labels.Kashrut[order.event.kashrut as keyof typeof labels.Kashrut] ?? order.event.kashrut}
              </Badge>
              <Badge variant="outline">
                {labels.ServiceType[order.event.serviceType as keyof typeof labels.ServiceType] ?? order.event.serviceType}
              </Badge>
            </div>
            {order.event.notes && (
              <p className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600">
                {order.event.notes}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Customer Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>פרטי הלקוח</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <div className="font-semibold text-slate-900">{order.customer.name}</div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="h-4 w-4 text-slate-400" />
              <a href={`tel:${order.customer.phone}`} className="text-indigo-600 hover:underline">
                {order.customer.phone}
              </a>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-1">
              <div>נוצר ע"י: {order.createdBy.name}</div>
              <div>
                תאריך יצירה:{' '}
                {new Date(order.createdAt).toLocaleDateString('he-IL', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </div>
              {order.latestQuoteVersion && (
                <div>גרסת הצעה אחרונה: v{order.latestQuoteVersion}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Financial Summary */}
        <Card className="border-indigo-100 bg-indigo-50/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <DollarSign className="h-4 w-4 text-indigo-600" />
              <span>סיכום כספי</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>סיכום ביניים:</span>
              <span>{formatMoney(order.totals.subtotal)}</span>
            </div>
            {order.totals.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>הנחה:</span>
                <span>-{formatMoney(order.totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>מע"מ ({order.pricing.vatPercent}%):</span>
              <span>{formatMoney(order.totals.vat)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <span>סה"כ הזמנה:</span>
              <span className="text-indigo-600">{formatMoney(order.totals.total)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>שולם בפועל:</span>
              <span className="text-emerald-700 font-semibold">{formatMoney(order.totals.paid)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200/60 pt-2 text-sm font-bold">
              <span>יתרה לתשלום:</span>
              <span className={order.totals.balance > 0 ? 'text-rose-600' : 'text-slate-500'}>
                {order.totals.balance > 0 ? formatMoney(order.totals.balance) : 'שולם במלואו'}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 pt-1">
              <span>מקדמה נדרשת:</span>
              <span>{formatMoney(order.totals.deposit)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">
            תפריט ומנות ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {order.items.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              לא הוגדרו מנות בהזמנה זו.{' '}
              <Link to={`/orders/${order.id}/edit`} className="text-indigo-600 hover:underline">
                לחץ לעריכה
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">שם המנה</th>
                    <th className="px-4 py-3">קטגוריה</th>
                    <th className="px-4 py-3">יחידת מידה</th>
                    <th className="px-4 py-3">כמות</th>
                    <th className="px-4 py-3">מחיר ליח'</th>
                    <th className="px-4 py-3">סה"כ שורה</th>
                    <th className="px-4 py-3">הערות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.dishName}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {labels.DishCategory[item.category as keyof typeof labels.DishCategory] ?? item.category}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {labels.SaleUnit[item.unit as keyof typeof labels.SaleUnit] ?? item.unit}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.qty}</td>
                      <td className="px-4 py-3 text-slate-700">{formatMoney(item.unitPrice)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(item.lineTotal)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{item.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services Breakdown Table */}
      {order.services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              שירותים וציוד נלווה ({order.services.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">שם השירות</th>
                    <th className="px-4 py-3">כמות</th>
                    <th className="px-4 py-3">מחיר ליח'</th>
                    <th className="px-4 py-3">סה"כ שורה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.services.map(srv => (
                    <tr key={srv.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{srv.name}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{srv.qty}</td>
                      <td className="px-4 py-3 text-slate-700">{formatMoney(srv.unitPrice)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(srv.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
