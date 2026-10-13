import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrder, usePreviewQuote, useSendQuote } from '@/api/orders';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatMoney, labels } from '@catering/shared';
import { Download, Send, ArrowRight } from 'lucide-react';

export const StaffQuotePreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useOrder(id);
  const previewMutation = usePreviewQuote(id ?? '');
  const sendMutation = useSendQuote(id ?? '');

  const [notification, setNotification] = useState<string>('');

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-slate-500" dir="rtl">טוען תצוגה מקדימה של ההצעה...</div>;
  }

  if (isError || !data?.data) {
    return (
      <div className="p-12 text-center" dir="rtl">
        <p className="text-rose-600 font-semibold">לא ניתן לטעון את הצעת המחיר</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/orders">חזרה להזמנות</Link>
        </Button>
      </div>
    );
  }

  const order = data.data;

  const handleDownloadPdf = async () => {
    try {
      const res = await previewMutation.mutateAsync();
      window.open(res.data.pdfUrl, '_blank');
    } catch {
      window.print();
    }
  };

  const handleSend = async () => {
    try {
      const res = await sendMutation.mutateAsync({ channels: ['WHATSAPP', 'SMS'] });
      setNotification(`ההצעה נשלחה בהצלחה! קישור פורטל: ${res.data.publicUrl}`);
      setTimeout(() => setNotification(''), 10000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בשליחת ההצעה');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-8 gap-1">
            <Link to={`/orders/${order.id}`}>
              <ArrowRight className="h-4 w-4" />
              <span>חזרה להזמנה #{order.number}</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            תצוגה מקדימה — הצעת מחיר
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={previewMutation.isPending}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>הורד PDF / הדפס</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={sendMutation.isPending}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="h-4 w-4" />
            <span>שלח ללקוח ב-WhatsApp / SMS</span>
          </Button>
        </div>
      </div>

      {notification && (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200">
          {notification}
        </div>
      )}

      {/* Styled Quote Document */}
      <Card className="mx-auto max-w-4xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-indigo-950">קייטרינג שף גורמה</h2>
            <p className="text-xs text-slate-500">קייטרינג לאירועים, שבתות ושמחות</p>
            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
              <div>טלפון: 03-5551234</div>
              <div>דוא"ל: info@chefgourmet.co.il</div>
              <div>כתובת: דרך השלום 10, תל אביב</div>
            </div>
          </div>
          <div className="text-left text-xs text-slate-500 space-y-1" dir="ltr">
            <div className="font-bold text-slate-900 text-sm">הצעת מחיר #{order.number}</div>
            <div>תאריך: {new Date().toLocaleDateString('he-IL')}</div>
            <div>תוקף עד: {order.pricing.validUntil}</div>
            {order.latestQuoteVersion && <div>גרסה: v{order.latestQuoteVersion}</div>}
          </div>
        </div>

        {/* Client & Event Info Box */}
        <div className="my-6 grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">לכבוד:</span>
            <div className="text-base font-bold text-slate-900">{order.customer.name}</div>
            <div className="text-slate-600">טלפון: {order.customer.phone}</div>
          </div>

          <div className="space-y-1 text-slate-700 text-xs">
            <span className="font-semibold text-slate-500 block">פרטי האירוע:</span>
            <div className="font-medium text-slate-900">{order.event.title || 'אירוע קייטרינג'}</div>
            <div>מועד: {new Date(order.event.startsAt).toLocaleDateString('he-IL')} בשעה {new Date(order.event.startsAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>מיקום: {order.event.address}</div>
            <div>מספר סועדים: {order.event.guests}</div>
            <div>כשרות: {labels.Kashrut[order.event.kashrut as keyof typeof labels.Kashrut] ?? order.event.kashrut}</div>
          </div>
        </div>

        {/* Dishes Table */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold text-slate-800">מפרט מנות ותפריט:</h3>
          <table className="w-full text-right text-xs">
            <thead className="border-b border-slate-300 bg-slate-100 font-semibold text-slate-700">
              <tr>
                <th className="p-2">פריט</th>
                <th className="p-2">קטגוריה</th>
                <th className="p-2 text-center">כמות</th>
                <th className="p-2 text-left">מחיר ליח'</th>
                <th className="p-2 text-left">סה"כ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((it, i) => (
                <tr key={i}>
                  <td className="p-2 font-medium text-slate-900">{it.dishName}</td>
                  <td className="p-2 text-slate-500">
                    {labels.DishCategory[it.category as keyof typeof labels.DishCategory] ?? it.category}
                  </td>
                  <td className="p-2 text-center">{it.qty}</td>
                  <td className="p-2 text-left">{formatMoney(it.unitPrice)}</td>
                  <td className="p-2 font-semibold text-left">{formatMoney(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Services Table */}
        {order.services.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-bold text-slate-800">שירותים נלווים:</h3>
            <table className="w-full text-right text-xs">
              <thead className="border-b border-slate-300 bg-slate-100 font-semibold text-slate-700">
                <tr>
                  <th className="p-2">שירות</th>
                  <th className="p-2 text-center">כמות</th>
                  <th className="p-2 text-left">מחיר ליח'</th>
                  <th className="p-2 text-left">סה"כ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.services.map((srv, i) => (
                  <tr key={i}>
                    <td className="p-2 font-medium text-slate-900">{srv.name}</td>
                    <td className="p-2 text-center">{srv.qty}</td>
                    <td className="p-2 text-left">{formatMoney(srv.unitPrice)}</td>
                    <td className="p-2 font-semibold text-left">{formatMoney(srv.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals & Summary */}
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <div className="w-64 space-y-2 text-xs">
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
            <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-bold text-slate-900">
              <span>סה"כ כולל מע"מ:</span>
              <span className="text-indigo-600">{formatMoney(order.totals.total)}</span>
            </div>
            <div className="flex justify-between text-slate-700 font-semibold pt-1">
              <span>מקדמה נדרשת ({order.pricing.depositPercent}%):</span>
              <span>{formatMoney(order.totals.deposit)}</span>
            </div>
          </div>
        </div>

        {/* Terms footer */}
        <div className="mt-8 border-t border-slate-200 pt-4 text-[11px] text-slate-500">
          <p className="font-semibold text-slate-700 mb-1">תנאי ההזמנה:</p>
          <p>
            ההצעה בתוקף עד {order.pricing.validUntil}. אישור ההצעה מותנה בתשלום מקדמה בסך{' '}
            {formatMoney(order.totals.deposit)} וחתימה דיגיטלית. יתרת התשלום תשולם בהתאם לתנאי התשלום שנבחרו ({labels.PaymentMethod[order.pricing.paymentTerms as keyof typeof labels.PaymentMethod] ?? order.pricing.paymentTerms}).
          </p>
        </div>
      </Card>
    </div>
  );
};
