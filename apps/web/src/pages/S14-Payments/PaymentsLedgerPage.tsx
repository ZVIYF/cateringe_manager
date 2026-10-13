import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  usePayments,
  useOpenBalances,
  useCreatePayment,
  useCreatePaymentLink,
  useRefundPayment
} from '@/api/payments';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  formatMoney,
  toAgorot,
  labels,
  type PaymentMethod,
  type PaymentStatus
} from '@catering/shared';
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  Search,
  Plus,
  Link as LinkIcon,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  X,
  Copy,
  Check
} from 'lucide-react';

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'ממתין',
  SUCCEEDED: 'הושלם',
  FAILED: 'נכשל',
  REFUNDED: 'זוכה'
};

const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: 'הכל', value: '' },
  { label: 'הושלמו', value: 'SUCCEEDED' },
  { label: 'ממתינים', value: 'PENDING' },
  { label: 'נכשלו', value: 'FAILED' },
  { label: 'זוכו', value: 'REFUNDED' }
];

const METHOD_OPTIONS: Array<{ label: string; value: PaymentMethod }> = [
  { label: 'כרטיס אשראי', value: 'CREDIT_CARD' },
  { label: 'העברה בנקאית', value: 'TRANSFER' },
  { label: "צ'ק", value: 'CHECK' },
  { label: 'מזומן', value: 'CASH' }
];

function getPaymentStatusBadge(status: PaymentStatus) {
  const label = PAYMENT_STATUS_LABELS[status] ?? status;
  switch (status) {
    case 'SUCCEEDED':
      return <Badge variant="success">{label}</Badge>;
    case 'PENDING':
      return <Badge variant="warning">{label}</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">{label}</Badge>;
    case 'REFUNDED':
      return <Badge variant="secondary">{label}</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
}

export const PaymentsLedgerPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Manual payment modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payOrderId, setPayOrderId] = useState('');
  const [payAmountShekels, setPayAmountShekels] = useState<number | string>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [payRef, setPayRef] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  // Payment link modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkOrderId, setLinkOrderId] = useState('');
  const [linkAmountShekels, setLinkAmountShekels] = useState<number | string>('');
  const [generatedLink, setGeneratedLink] = useState<{ url: string; expiresAt: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Refund modal state
  const [refundTargetId, setRefundTargetId] = useState<string | null>(null);
  const [refundAmountShekels, setRefundAmountShekels] = useState<number | string>('');
  const [refundReason, setRefundReason] = useState('');
  const [refundError, setRefundError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = usePayments({
    status: selectedStatus || undefined,
    method: selectedMethod || undefined,
    q: searchQuery || undefined,
    page,
    pageSize: 15
  });

  const { data: openBalancesData } = useOpenBalances();
  const createPaymentMutation = useCreatePayment();
  const createPaymentLinkMutation = useCreatePaymentLink();

  const payments = data?.data ?? [];
  const meta = data?.meta;
  const stats = data?.stats;
  const openBalances = openBalancesData?.data ?? [];

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);

    const amount = Number(payAmountShekels);
    if (!payOrderId.trim()) {
      setPayError('נא להזין מזהה הזמנה');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setPayError('נא להזין סכום תקין לתשלום');
      return;
    }

    try {
      await createPaymentMutation.mutateAsync({
        orderId: payOrderId.trim(),
        amount: toAgorot(amount),
        method: payMethod,
        reference: payRef.trim() || undefined
      });
      setIsPayModalOpen(false);
      setPayOrderId('');
      setPayAmountShekels('');
      setPayRef('');
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'שגיאה ברישום התשלום');
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    setCopied(false);

    const amount = Number(linkAmountShekels);
    if (!linkOrderId.trim()) {
      setLinkError('נא להזין מזהה הזמנה');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setLinkError('נא להזין סכום תקין');
      return;
    }

    try {
      const res = await createPaymentLinkMutation.mutateAsync({
        orderId: linkOrderId.trim(),
        amount: toAgorot(amount)
      });
      setGeneratedLink({
        url: res.data.paymentUrl,
        expiresAt: res.data.expiresAt
      });
    } catch (err: unknown) {
      setLinkError(err instanceof Error ? err.message : 'שגיאה ביצירת קישור התשלום');
    }
  };

  const openLinkModalForBalance = (orderId: string, balanceAgorot: number) => {
    setLinkOrderId(orderId);
    setLinkAmountShekels(balanceAgorot / 100);
    setGeneratedLink(null);
    setLinkError(null);
    setCopied(false);
    setIsLinkModalOpen(true);
  };

  const refundMutation = useRefundPayment(refundTargetId ?? '');

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetId) return;
    setRefundError(null);

    const amount = Number(refundAmountShekels);
    if (isNaN(amount) || amount <= 0) {
      setRefundError('נא להזין סכום זיכוי תקין');
      return;
    }
    if (!refundReason.trim()) {
      setRefundError('נא לציין סיבת זיכוי');
      return;
    }

    try {
      await refundMutation.mutateAsync({
        amount: toAgorot(amount),
        reason: refundReason.trim()
      });
      setRefundTargetId(null);
      setRefundAmountShekels('');
      setRefundReason('');
    } catch (err: unknown) {
      setRefundError(err instanceof Error ? err.message : 'שגיאה בביצוע הזיכוי');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            תשלומים, קבלות ויתרות לגבייה
          </h1>
          <p className="text-sm text-slate-500">
            יומן תשלומים, מעקב יתרות פתוחות, הפקת קישורי תשלום באשראי ורישום תקבולים ידני
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setLinkOrderId('');
              setLinkAmountShekels('');
              setGeneratedLink(null);
              setLinkError(null);
              setIsLinkModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <LinkIcon className="h-4 w-4" />
            קישור לתשלום
          </Button>
          <Button
            onClick={() => setIsPayModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            רישום תשלום
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">סה"כ נגבה (הושלם)</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {formatMoney(stats?.totalCollected ?? 0)}
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
                {formatMoney(stats?.openBalancesTotal ?? 0)}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">הזמנות בפיגור תשלום</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">
                {stats?.overdueCount ?? openBalances.filter(b => b.daysOverdue > 0).length}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Balances Card */}
      {openBalances.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-amber-200/50 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              הזמנות עם יתרת חוב פתוחה ({openBalances.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-amber-100/50 text-amber-900 font-medium">
                    <th className="py-2.5 px-4">מספר הזמנה</th>
                    <th className="py-2.5 px-4">לקוח</th>
                    <th className="py-2.5 px-4">טלפון</th>
                    <th className="py-2.5 px-4">סה"כ הזמנה</th>
                    <th className="py-2.5 px-4">שולם</th>
                    <th className="py-2.5 px-4">יתרה לגבייה</th>
                    <th className="py-2.5 px-4">ימי פיגור</th>
                    <th className="py-2.5 px-4 text-center">פעולה מהירה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200/30">
                  {openBalances.map(b => (
                    <tr key={b.orderId} className="hover:bg-amber-100/30 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        <Link to={`/orders/${b.orderId}`} className="hover:underline">
                          #{b.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{b.customerName}</td>
                      <td className="py-2.5 px-4 text-slate-600 ltr-text" dir="ltr">
                        {b.customerPhone}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{formatMoney(b.total)}</td>
                      <td className="py-2.5 px-4 text-slate-700">{formatMoney(b.paid)}</td>
                      <td className="py-2.5 px-4 font-bold text-rose-600">
                        {formatMoney(b.balance)}
                      </td>
                      <td className="py-2.5 px-4">
                        {b.daysOverdue > 0 ? (
                          <span className="text-rose-600 font-semibold">
                            {b.daysOverdue} ימים
                          </span>
                        ) : (
                          <span className="text-slate-500">במסגרת המועד</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openLinkModalForBalance(b.orderId, b.balance)}
                          className="h-7 text-[11px] bg-white border-amber-300 text-amber-900 hover:bg-amber-50"
                        >
                          <LinkIcon className="h-3 w-3 ml-1" />
                          שלח קישור לתשלום
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="חיפוש לפי לקוח, מספר הזמנה או מספר אסמכתא..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pr-9 text-right"
              />
            </div>

            {/* Method filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">אמצעי תשלום:</span>
              <select
                value={selectedMethod}
                onChange={e => {
                  setSelectedMethod(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">כל האמצעים</option>
                {METHOD_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-400 self-center ml-2">סטטוס:</span>
            {STATUS_TABS.map(tab => (
              <Button
                key={tab.value}
                variant={selectedStatus === tab.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedStatus(tab.value);
                  setPage(1);
                }}
                className="text-xs h-8"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payments Ledger Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">טוען יומן תשלומים...</div>
          ) : isError ? (
            <div className="py-12 text-center text-rose-600">
              <p>שגיאה בטעינת יומן התשלומים</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                נסה שוב
              </Button>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CreditCard className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="font-medium">לא נמצאו תשלומים התואמים לחיפוש</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                    <th className="py-3 px-4">תאריך</th>
                    <th className="py-3 px-4">הזמנה</th>
                    <th className="py-3 px-4">לקוח</th>
                    <th className="py-3 px-4">אמצעי תשלום</th>
                    <th className="py-3 px-4">אסמכתא / קבלה</th>
                    <th className="py-3 px-4">סכום</th>
                    <th className="py-3 px-4">סטטוס</th>
                    <th className="py-3 px-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {new Date(p.createdAt).toLocaleDateString('he-IL')}{' '}
                        {new Date(p.createdAt).toLocaleTimeString('he-IL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {p.orderId ? (
                          <Link to={`/orders/${p.orderId}`} className="hover:text-primary">
                            #{p.orderNumber}
                          </Link>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {p.customerName || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {labels.PaymentMethod[p.method] ?? p.method}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {p.reference && <span>{p.reference}</span>}
                        {p.receiptUrl && (
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline ml-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            קבלה
                          </a>
                        )}
                        {!p.reference && !p.receiptUrl && <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatMoney(p.amount)}
                      </td>
                      <td className="py-3.5 px-4">{getPaymentStatusBadge(p.status)}</td>
                      <td className="py-3.5 px-4 text-center">
                        {p.status === 'SUCCEEDED' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRefundTargetId(p.id);
                              setRefundAmountShekels(p.amount / 100);
                              setRefundReason('');
                              setRefundError(null);
                            }}
                            className="text-xs text-rose-600 hover:bg-rose-50 h-7 px-2"
                          >
                            <RotateCcw className="h-3 w-3 ml-1" />
                            זיכוי
                          </Button>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
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
                עמוד {meta.page} מתוך {meta.totalPages} ({meta.total} תשלומים)
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

      {/* Manual Payment Registration Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">רישום תשלום ידני</h2>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="p-5 space-y-4">
              {payError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                  {payError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">מזהה הזמנה *</label>
                <Input
                  value={payOrderId}
                  onChange={e => setPayOrderId(e.target.value)}
                  placeholder="order-1 או מספר הזמנה"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  סכום ששולם (₪ כולל מע"מ) *
                </label>
                <Input
                  type="number"
                  min={1}
                  step={0.5}
                  value={payAmountShekels}
                  onChange={e => setPayAmountShekels(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">אמצעי תשלום</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {METHOD_OPTIONS.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  אסמכתא / מספר צ'ק / אישור העברה
                </label>
                <Input
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  placeholder="למשל: העברה מס' 98234 או שק 1002"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPayModalOpen(false)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={createPaymentMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {createPaymentMutation.isPending ? 'רושם תשלום...' : 'אשר ורשום תשלום'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Payment Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">יצירת קישור לתשלום באשראי</h2>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {linkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                  {linkError}
                </div>
              )}

              {!generatedLink ? (
                <form onSubmit={handleGenerateLink} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">מזהה הזמנה *</label>
                    <Input
                      value={linkOrderId}
                      onChange={e => setLinkOrderId(e.target.value)}
                      placeholder="למשל: order-1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">סכום לתשלום (₪) *</label>
                    <Input
                      type="number"
                      min={1}
                      step={0.5}
                      value={linkAmountShekels}
                      onChange={e => setLinkAmountShekels(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsLinkModalOpen(false)}
                    >
                      ביטול
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPaymentLinkMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      {createPaymentLinkMutation.isPending ? 'מייצר קישור...' : 'הפק קישור'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      קישור התשלום נוצר בהצלחה!
                    </div>
                    <p className="text-xs text-emerald-700">
                      תוקף הקישור:{' '}
                      {new Date(generatedLink.expiresAt).toLocaleDateString('he-IL')}{' '}
                      {new Date(generatedLink.expiresAt).toLocaleTimeString('he-IL', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">כתובת הקישור לתשלום:</label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={generatedLink.url}
                        dir="ltr"
                        className="bg-slate-50 text-xs font-mono"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink.url);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="shrink-0"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <Button onClick={() => setIsLinkModalOpen(false)}>סגור</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">ביצוע זיכוי תשלום</h2>
              <button
                type="button"
                onClick={() => setRefundTargetId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRefund} className="p-5 space-y-4">
              {refundError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                  {refundError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  סכום לזיכוי (₪) *
                </label>
                <Input
                  type="number"
                  min={1}
                  step={0.5}
                  value={refundAmountShekels}
                  onChange={e => setRefundAmountShekels(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">סיבת הזיכוי *</label>
                <textarea
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="למשל: ביטול מנה, הסכמה מסחרית עם הלקוח"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRefundTargetId(null)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={refundMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {refundMutation.isPending ? 'מזכה...' : 'בצע זיכוי'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

