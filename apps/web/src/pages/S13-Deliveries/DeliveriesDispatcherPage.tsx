import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeliveries, useUpdateDelivery } from '@/api/deliveries';
import { useUsers } from '@/api/settings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Delivery, DeliveryStatus } from '@catering/shared';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Package,
  FileCheck2,
  ExternalLink,
  X,
  Navigation
} from 'lucide-react';

const STATUS_LABELS: Record<DeliveryStatus, { label: string; color: string; border: string }> = {
  UNASSIGNED: { label: 'ממתין לשיבוץ', color: 'bg-slate-100 text-slate-700', border: 'border-slate-200' },
  ASSIGNED: { label: 'משובץ לנהג', color: 'bg-blue-50 text-blue-800', border: 'border-blue-200' },
  EN_ROUTE: { label: 'בדרך ללקוח', color: 'bg-amber-50 text-amber-800', border: 'border-amber-200' },
  DELIVERED: { label: 'נמסר בהצלחה', color: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-200' }
};

const getTodayStr = () => new Date().toISOString().slice(0, 10);
const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export const DeliveriesDispatcherPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDeliveryForDetails, setSelectedDeliveryForDetails] = useState<Delivery | null>(null);

  const { data: deliveriesData, isLoading, isError, refetch } = useDeliveries({
    date: selectedDate,
    status: statusFilter === 'ALL' ? undefined : statusFilter
  });
  const { data: usersData } = useUsers();
  const updateDeliveryMutation = useUpdateDelivery();

  const deliveries = deliveriesData?.data ?? [];
  const drivers = (usersData?.data ?? []).filter(u => u.role === 'DRIVER');

  const counts = {
    total: deliveries.length,
    enRoute: deliveries.filter(d => d.status === 'EN_ROUTE').length,
    delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
    unassigned: deliveries.filter(d => d.status === 'UNASSIGNED').length
  };

  const handleAssignDriver = async (delivery: Delivery, driverId: string) => {
    try {
      await updateDeliveryMutation.mutateAsync({
        id: delivery.id,
        body: { driverId: driverId || null }
      });
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בשיבוץ נהג');
    }
  };

  const handleUpdateSequence = async (delivery: Delivery, newSeq: number) => {
    try {
      await updateDeliveryMutation.mutateAsync({
        id: delivery.id,
        body: { sequence: newSeq }
      });
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בעדכון סדר חלוקה');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              ניהול והפצת משלוחים
            </h1>
            <p className="text-sm text-slate-500">
              שיבוץ נהגים, קביעת סדר חלוקה, תעודות משלוח ומעקב סטאטוס בזמן אמת
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Switcher */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayStr())}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedDate === getTodayStr()
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              היום
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(getTomorrowStr())}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedDate === getTomorrowStr()
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              מחר
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-300 py-1.5 px-3 bg-white"
          />

          <Link to="/driver">
            <Button variant="outline" className="flex items-center gap-1.5 text-xs font-bold">
              <Navigation className="h-3.5 w-3.5 text-blue-600" />
              ממשק נהג מובייל (PWA)
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">סה״כ משלוחים ליום זה</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{counts.total}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">בדרך ללקוח</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{counts.enRoute}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">נמסרו בהצלחה</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{counts.delivered}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">ממתינים לשיבוץ נהג</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{counts.unassigned}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
        <span className="text-xs font-medium text-slate-500 ml-2">סינון סטטוס:</span>
        {['ALL', 'UNASSIGNED', 'ASSIGNED', 'EN_ROUTE', 'DELIVERED'].map(st => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              statusFilter === st
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st === 'ALL' ? 'הכל' : STATUS_LABELS[st as DeliveryStatus]?.label}
          </button>
        ))}
      </div>

      {/* Deliveries Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">טוען משלוחים...</div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-600">
            <p>שגיאה בטעינת משלוחים</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
              נסה שוב
            </Button>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Truck className="h-12 w-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">אין משלוחים לתאריך {selectedDate}</p>
            <p className="text-xs text-slate-400 mt-1">
              אירועים מסומנים כאיסוף עצמי או שטרם הופקו עבורם משלוחים
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600 text-xs font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">סדר</th>
                  <th className="px-4 py-3">מספר הזמנה ואירוע</th>
                  <th className="px-4 py-3">כתובת יעד</th>
                  <th className="px-4 py-3">ארגזים</th>
                  <th className="px-4 py-3">שיבוץ נהג</th>
                  <th className="px-4 py-3">יציאה מתוכננת</th>
                  <th className="px-4 py-3">סטטוס</th>
                  <th className="px-4 py-3 text-left">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map(del => {
                  const statusInfo = STATUS_LABELS[del.status] || {
                    label: del.status,
                    color: 'bg-slate-100',
                    border: 'border-slate-200'
                  };

                  return (
                    <tr key={del.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={del.sequence ?? ''}
                          onChange={e => handleUpdateSequence(del, Number(e.target.value) || 1)}
                          className="w-12 h-7 text-xs font-bold text-center border border-slate-300 rounded bg-white"
                          title="סדר חלוקה במסלול"
                        />
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span className="font-bold">
                            #{del.orderNumber} {del.customerName}
                          </span>
                          <a
                            href={`tel:${del.customerPhone}`}
                            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 mt-0.5"
                            dir="ltr"
                          >
                            <Phone className="h-3 w-3" />
                            {del.customerPhone}
                          </a>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-700 text-xs max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{del.address}</span>
                          <a
                            href={`https://waze.com/ul?q=${encodeURIComponent(del.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            title="פתח ב-Waze"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-800 font-bold text-xs">
                        <div className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 text-slate-400" />
                          <span>{del.boxesCount} ארגזים</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={del.driverId || ''}
                          onChange={e => handleAssignDriver(del, e.target.value)}
                          className="text-xs font-medium rounded-lg border border-slate-300 py-1.5 px-2 bg-white"
                        >
                          <option value="">(לא משובץ)</option>
                          {drivers.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3 text-slate-600 text-xs font-mono">
                        {del.plannedDepartureAt
                          ? new Date(del.plannedDepartureAt).toLocaleTimeString('he-IL', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.color} ${statusInfo.border}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-left">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDeliveryForDetails(del)}
                          className="h-8 text-xs flex items-center gap-1"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                          פרטים
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delivery Hand-off Inspection Modal */}
      {selectedDeliveryForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setSelectedDeliveryForDetails(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900">
              פרטי משלוח להזמנה #{selectedDeliveryForDetails.orderNumber}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              לקוח: {selectedDeliveryForDetails.customerName} • כתובת: {selectedDeliveryForDetails.address}
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-600 mb-1">הוראות ודגשים למשלוח:</p>
                <p className="text-xs text-slate-800">{selectedDeliveryForDetails.notes || 'אין הערות מיוחדות'}</p>
              </div>

              {selectedDeliveryForDetails.status === 'DELIVERED' ? (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>המשלוח נמסר בהצלחה!</span>
                  </div>
                  <p className="text-xs text-slate-700">
                    <strong>שם המקבל:</strong> {selectedDeliveryForDetails.receiverName || 'לא צוין'}
                  </p>
                  {selectedDeliveryForDetails.completedAt && (
                    <p className="text-xs text-slate-600">
                      <strong>מועד מסירה:</strong> {new Date(selectedDeliveryForDetails.completedAt).toLocaleString('he-IL')}
                    </p>
                  )}
                  {selectedDeliveryForDetails.signatureUrl && (
                    <div>
                      <p className="text-xs font-bold text-slate-600 mb-1">חתימת לקוח:</p>
                      <div className="border border-slate-300 rounded bg-white p-2 text-center text-xs text-slate-500 italic">
                        [חתימה דיגיטלית נשמרה ומאושרת]
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800">
                  המשלוח טרם נמסר ללקוח (סטטוס נוכחי: {STATUS_LABELS[selectedDeliveryForDetails.status]?.label}).
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDeliveryForDetails(null)}
              >
                סגור
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
