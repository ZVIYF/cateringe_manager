import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  usePurchaseOrders,
  useSuppliers,
  useCreatePurchaseOrder,
  useCreatePOsFromShortages,
  useSendPurchaseOrder,
  useReceivePurchaseOrder
} from '@/api/purchasing';
import { useIngredients } from '@/api/inventory';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney, toAgorot, type PurchaseOrder, type PurchaseOrderStatus } from '@catering/shared';
import {
  ShoppingCart,
  Package,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  Eye
} from 'lucide-react';

const STATUS_LABELS: Record<PurchaseOrderStatus, { label: string; color: string }> = {
  DRAFT: { label: 'טיוטה', color: 'bg-slate-100 text-slate-700' },
  SENT: { label: 'נשלחה לספק', color: 'bg-blue-100 text-blue-800' },
  PARTIAL: { label: 'התקבלה חלקית', color: 'bg-amber-100 text-amber-800' },
  RECEIVED: { label: 'התקבלה במלואה', color: 'bg-emerald-100 text-emerald-800' }
};

export const PurchaseOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSupplierId = searchParams.get('supplierId') || undefined;
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [selectedPOForView, setSelectedPOForView] = useState<PurchaseOrder | null>(null);
  const [selectedPOForReceive, setSelectedPOForReceive] = useState<PurchaseOrder | null>(null);
  const [receiveInputs, setReceiveInputs] = useState<Record<string, { qty: string; price: string }>>({});

  // Shortages generation feedback
  const [shortagesFeedback, setShortagesFeedback] = useState<string | null>(null);

  // New PO form state
  const [newPOSupplierId, setNewPOSupplierId] = useState('');
  const [newPODeliveryDate, setNewPODeliveryDate] = useState('');
  const [newPOLines, setNewPOLines] = useState<Array<{ ingredientId: string; qty: string; unitPrice: string }>>([
    { ingredientId: '', qty: '', unitPrice: '' }
  ]);
  const [newPOError, setNewPOError] = useState<string | null>(null);

  // Queries & Mutations
  const { data: suppliersData } = useSuppliers();
  const { data: ingredientsData } = useIngredients();
  const { data: poData, isLoading, isError, refetch } = usePurchaseOrders({
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    supplierId: selectedSupplierId
  });

  const createPOMutation = useCreatePurchaseOrder();
  const createFromShortagesMutation = useCreatePOsFromShortages();
  const sendPOMutation = useSendPurchaseOrder(selectedPOForView?.id ?? '');
  const receivePOMutation = useReceivePurchaseOrder(selectedPOForReceive?.id ?? '');

  const suppliers = suppliersData?.data ?? [];
  const ingredients = ingredientsData?.data ?? [];
  const purchaseOrders = poData?.data ?? [];

  const handleGenerateFromShortages = async () => {
    setShortagesFeedback(null);
    try {
      const res = await createFromShortagesMutation.mutateAsync({ days: 7 });
      setShortagesFeedback(`הופקו בהצלחה ${res.data.length} הזמנות רכש מרוכזות על בסיס תחזית חוסרים ל-7 ימים!`);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בהפקת הזמנות רכש מחוסרים');
    }
  };

  const handleAddLine = () => {
    setNewPOLines([...newPOLines, { ingredientId: '', qty: '', unitPrice: '' }]);
  };

  const handleRemoveLine = (index: number) => {
    setNewPOLines(newPOLines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: string) => {
    const updated = [...newPOLines];
    updated[index] = { ...updated[index], [field]: value };
    setNewPOLines(updated);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPOError(null);

    if (!newPOSupplierId) {
      setNewPOError('נא לבחור ספק');
      return;
    }

    const validLines = newPOLines.filter(l => l.ingredientId && Number(l.qty) > 0);
    if (validLines.length === 0) {
      setNewPOError('נא להוסיף לפחות פריט אחד עם כמות חיובית');
      return;
    }

    try {
      await createPOMutation.mutateAsync({
        supplierId: newPOSupplierId,
        expectedDeliveryDate: newPODeliveryDate || undefined,
        lines: validLines.map(l => ({
          ingredientId: l.ingredientId,
          qty: Number(l.qty),
          unitPrice: l.unitPrice ? toAgorot(Number(l.unitPrice)) : undefined
        }))
      });
      setIsNewPOModalOpen(false);
      setNewPOSupplierId('');
      setNewPODeliveryDate('');
      setNewPOLines([{ ingredientId: '', qty: '', unitPrice: '' }]);
    } catch (err: unknown) {
      setNewPOError(err instanceof Error ? err.message : 'שגיאה ביצירת הזמנת רכש');
    }
  };

  const handleSendPO = async (_poId: string, channel: 'EMAIL' | 'WHATSAPP' | 'PDF') => {
    try {
      await sendPOMutation.mutateAsync({ channel });
      alert(`הזמנת הרכש נשלחה בהצלחה באמצעות ${channel === 'EMAIL' ? 'דוא"ל' : channel === 'WHATSAPP' ? 'וואטסאפ' : 'קובץ PDF'}`);
      setSelectedPOForView(null);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בשליחת הזמנת רכש');
    }
  };

  const openReceiveModal = (po: PurchaseOrder) => {
    setSelectedPOForReceive(po);
    const initialInputs: Record<string, { qty: string; price: string }> = {};
    po.lines.forEach(l => {
      // Default to remaining quantity
      const remaining = Math.max(0, l.qty - l.receivedQty);
      initialInputs[l.id] = {
        qty: remaining > 0 ? String(remaining) : '0',
        price: l.unitPrice ? String(l.unitPrice / 100) : ''
      };
    });
    setReceiveInputs(initialInputs);
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOForReceive) return;

    const linesPayload = Object.entries(receiveInputs)
      .map(([lineId, data]) => ({
        lineId,
        receivedQty: Number(data.qty) || 0,
        price: data.price ? toAgorot(Number(data.price)) : undefined
      }))
      .filter(l => l.receivedQty > 0);

    if (linesPayload.length === 0) {
      alert('נא לציין כמויות שהתקבלו (מעל 0) לפחות עבור שורה אחת');
      return;
    }

    try {
      await receivePOMutation.mutateAsync({ lines: linesPayload });
      alert('הסחורה נקלטה בהצלחה ועודכנה במלאי השוטף!');
      setSelectedPOForReceive(null);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בקליטת הסחורה');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ניהול הזמנות רכש וקליטת מלאי
          </h1>
          <p className="text-sm text-slate-500">
            הפקת הזמנות מספקים, שליחה, מעקב סטטוס וקליטת סחורה ישירות למלאי
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateFromShortages}
            disabled={createFromShortagesMutation.isPending}
            className="flex items-center gap-1.5 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          >
            <Sparkles className="h-4 w-4 text-indigo-600" />
            הפקת רכש מחוסרים (7 ימים)
          </Button>
          <Button
            onClick={() => setIsNewPOModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            הזמנת רכש חדשה
          </Button>
        </div>
      </div>

      {/* Secondary Sub-Nav Tabs */}
      <div className="flex border-b border-slate-200">
        <Link
          to="/suppliers"
          className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          מדריך ספקים
        </Link>
        <button
          type="button"
          className="px-4 py-2 text-sm font-semibold border-b-2 border-primary text-primary"
        >
          הזמנות רכש ({purchaseOrders.length})
        </button>
      </div>

      {/* Feedback Banner */}
      {shortagesFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>{shortagesFeedback}</span>
          </div>
          <button
            onClick={() => setShortagesFeedback(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">סה״כ הזמנות רכש</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{purchaseOrders.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">הזמנות פתוחות לאספקה</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {purchaseOrders.filter(po => po.status === 'SENT' || po.status === 'PARTIAL').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">הזמנות שהושלמו ונקלטו</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {purchaseOrders.filter(po => po.status === 'RECEIVED').length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 ml-2">סינון סטטוס:</span>
          {['ALL', 'DRAFT', 'SENT', 'PARTIAL', 'RECEIVED'].map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'הכל' : STATUS_LABELS[status as PurchaseOrderStatus]?.label}
            </button>
          ))}
        </div>

        {/* Filter by supplier */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">ספק:</label>
          <select
            value={selectedSupplierId || ''}
            onChange={e => {
              if (e.target.value) {
                setSearchParams({ supplierId: e.target.value });
              } else {
                setSearchParams({});
              }
            }}
            className="text-xs rounded-lg border border-slate-300 py-1.5 px-3 bg-white"
          >
            <option value="">כל הספקים</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">טוען הזמנות רכש...</div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-red-500 font-medium">שגיאה בטעינת הזמנות רכש</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-3">
              נסה שוב
            </Button>
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShoppingCart className="h-12 w-12 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-700">לא נמצאו הזמנות רכש</p>
            <p className="text-xs text-slate-400 mt-1">
              ניתן ליצור הזמנת רכש ידנית או להפיק אוטומטית מתוך תחזית החוסרים
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600 text-xs font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">מספר הזמנה</th>
                  <th className="px-4 py-3">ספק</th>
                  <th className="px-4 py-3">סטטוס</th>
                  <th className="px-4 py-3">פריטים</th>
                  <th className="px-4 py-3">עלות כוללת</th>
                  <th className="px-4 py-3">אספקה מיועדת</th>
                  <th className="px-4 py-3 text-left">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map(po => {
                  const statusInfo = STATUS_LABELS[po.status] || {
                    label: po.status,
                    color: 'bg-slate-100'
                  };

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        #{po.number}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {po.supplierName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {po.lines.length} פריטים
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatMoney(po.total)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {po.expectedDeliveryDate || '-'}
                      </td>
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPOForView(po)}
                            className="h-8 text-xs flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            פרטים
                          </Button>

                          {/* Receive goods if SENT or PARTIAL */}
                          {(po.status === 'SENT' || po.status === 'PARTIAL') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReceiveModal(po)}
                              className="h-8 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"
                            >
                              <Package className="h-3.5 w-3.5 text-emerald-600" />
                              קליטת סחורה
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PO View & Send Modal */}
      {selectedPOForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPOForView(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  הזמנת רכש #{selectedPOForView.number}
                </h2>
                <p className="text-xs text-slate-500">
                  ספק: {selectedPOForView.supplierName} • תאריך: {selectedPOForView.createdAt.slice(0, 10)}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  STATUS_LABELS[selectedPOForView.status]?.color
                }`}
              >
                {STATUS_LABELS[selectedPOForView.status]?.label}
              </span>
            </div>

            {/* Line items table */}
            <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600 text-xs">
                  <tr>
                    <th className="px-4 py-2.5">חומר גלם</th>
                    <th className="px-4 py-2.5">כמות שהוזמנה</th>
                    <th className="px-4 py-2.5">כמות שהתקבלה</th>
                    <th className="px-4 py-2.5">מחיר יחידה</th>
                    <th className="px-4 py-2.5">סה״כ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPOForView.lines.map(line => (
                    <tr key={line.id}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        {line.ingredientName}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {line.qty} {line.unit}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        <span
                          className={
                            line.receivedQty >= line.qty
                              ? 'text-emerald-600 font-bold'
                              : 'text-amber-600 font-medium'
                          }
                        >
                          {line.receivedQty} {line.unit}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {formatMoney(line.unitPrice)}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        {formatMoney(line.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-2.5 text-left text-slate-700">
                      סה״כ עלות ההזמנה:
                    </td>
                    <td className="px-4 py-2.5 text-primary text-base">
                      {formatMoney(selectedPOForView.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Actions for this PO */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendPO(selectedPOForView.id, 'EMAIL')}
                  disabled={sendPOMutation.isPending}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  שליחה בדוא״ל
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendPO(selectedPOForView.id, 'WHATSAPP')}
                  disabled={sendPOMutation.isPending}
                  className="flex items-center gap-1.5 text-xs text-emerald-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  שליחה בוואטסאפ
                </Button>
              </div>

              {(selectedPOForView.status === 'SENT' || selectedPOForView.status === 'PARTIAL') && (
                <Button
                  size="sm"
                  onClick={() => {
                    const po = selectedPOForView;
                    setSelectedPOForView(null);
                    openReceiveModal(po);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs"
                >
                  <Package className="h-3.5 w-3.5" />
                  מעבר לקליטת סחורה
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receive Goods Modal */}
      {selectedPOForReceive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPOForReceive(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900">
              קליטת סחורה להזמנה #{selectedPOForReceive.number}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ספק: {selectedPOForReceive.supplierName} • הזן את הכמויות שהגיעו בפועל כדי לעדכן את המלאי
            </p>

            <form onSubmit={handleReceiveStock} className="mt-4 space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 text-xs">
                    <tr>
                      <th className="px-4 py-2.5">חומר גלם</th>
                      <th className="px-4 py-2.5">הוזמן</th>
                      <th className="px-4 py-2.5">כבר נקלט</th>
                      <th className="px-4 py-2.5">כמות נקלטת עכשיו *</th>
                      <th className="px-4 py-2.5">מחיר יחידה בפועל (₪)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPOForReceive.lines.map(line => {
                      const lineState = receiveInputs[line.id] || { qty: '', price: '' };

                      return (
                        <tr key={line.id}>
                          <td className="px-4 py-2.5 font-medium text-slate-800">
                            {line.ingredientName}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {line.qty} {line.unit}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {line.receivedQty} {line.unit}
                          </td>
                          <td className="px-4 py-2.5">
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              value={lineState.qty}
                              onChange={e =>
                                setReceiveInputs({
                                  ...receiveInputs,
                                  [line.id]: { ...lineState, qty: e.target.value }
                                })
                              }
                              className="h-8 w-24 text-center font-bold"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              value={lineState.price}
                              onChange={e =>
                                setReceiveInputs({
                                  ...receiveInputs,
                                  [line.id]: { ...lineState, price: e.target.value }
                                })
                              }
                              placeholder={line.unitPrice ? String(line.unitPrice / 100) : ''}
                              className="h-8 w-24 text-center"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedPOForReceive(null)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={receivePOMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                >
                  <Package className="h-4 w-4" />
                  אשר קליטה ועדכן מלאי
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Manual PO Modal */}
      {isNewPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsNewPOModalOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900">
              הזמנת רכש ידנית חדשה
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              בחירת ספק והזנת פריטים וכמויות מבוקשות
            </p>

            <form onSubmit={handleCreatePO} className="mt-4 space-y-4">
              {newPOError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                  {newPOError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ספק *
                  </label>
                  <select
                    value={newPOSupplierId}
                    onChange={e => setNewPOSupplierId(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 px-3 bg-white"
                    required
                  >
                    <option value="">בחר ספק...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.leadTimeDays ?? 1} ימי אספקה)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    תאריך אספקה מיועד
                  </label>
                  <Input
                    type="date"
                    value={newPODeliveryDate}
                    onChange={e => setNewPODeliveryDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Lines list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-700">
                    פריטים להזמנה *
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLine}
                    className="h-7 text-xs flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    הוסף שורה
                  </Button>
                </div>

                <div className="space-y-2">
                  {newPOLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200"
                    >
                      <select
                        value={line.ingredientId}
                        onChange={e => handleLineChange(idx, 'ingredientId', e.target.value)}
                        className="flex-1 text-xs rounded border border-slate-300 py-1.5 px-2 bg-white"
                        required
                      >
                        <option value="">בחר חומר גלם...</option>
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>

                      <Input
                        type="number"
                        step="any"
                        min="0.01"
                        placeholder="כמות"
                        value={line.qty}
                        onChange={e => handleLineChange(idx, 'qty', e.target.value)}
                        className="w-24 h-8 text-xs text-center"
                        required
                      />

                      <Input
                        type="number"
                        step="any"
                        placeholder="מחיר ליח׳ (₪)"
                        value={line.unitPrice}
                        onChange={e => handleLineChange(idx, 'unitPrice', e.target.value)}
                        className="w-28 h-8 text-xs text-center"
                      />

                      {newPOLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewPOModalOpen(false)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={createPOMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  צור הזמנת רכש
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
