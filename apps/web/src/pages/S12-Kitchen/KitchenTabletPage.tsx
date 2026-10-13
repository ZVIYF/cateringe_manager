import React, { useState } from 'react';
import { useKitchenTasks, useUpdateKitchenTask, useProductionSheet } from '@/api/kitchen';
import { Button } from '@/components/ui/button';
import type { KitchenTask, KitchenTaskStatus, Kashrut } from '@catering/shared';
import {
  ChefHat,
  Clock,
  FileDown,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

const KASHRUT_LABELS: Record<Kashrut, { label: string; bg: string; text: string; border: string }> = {
  MEAT: { label: 'בשרי', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  DAIRY: { label: 'חלבי', bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
  PARVE: { label: 'פרווה', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' }
};

const STATUS_CONFIG: Record<KitchenTaskStatus, { label: string; next: KitchenTaskStatus | null; nextAction: string; bg: string; text: string }> = {
  TODO: {
    label: 'לביצוע',
    next: 'IN_PROGRESS',
    nextAction: 'התחל הכנה',
    bg: 'bg-slate-100 text-slate-700',
    text: 'text-slate-700'
  },
  IN_PROGRESS: {
    label: 'בהכנה',
    next: 'DONE',
    nextAction: 'סמן כמוכן',
    bg: 'bg-amber-100 text-amber-800',
    text: 'text-amber-800'
  },
  DONE: {
    label: 'מוכן',
    next: 'PACKED',
    nextAction: 'סמן כארוז',
    bg: 'bg-blue-100 text-blue-800',
    text: 'text-blue-800'
  },
  PACKED: {
    label: 'ארוז',
    next: null,
    nextAction: 'הושלם ונארז',
    bg: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-800'
  }
};

const getTodayStr = () => new Date().toISOString().slice(0, 10);
const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

export const KitchenTabletPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedKashrut, setSelectedKashrut] = useState<string>('ALL');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, refetch, isFetching } = useKitchenTasks(selectedDate);
  const updateTaskMutation = useUpdateKitchenTask();
  const { refetch: fetchProductionSheet, isFetching: isExportingPdf } = useProductionSheet(selectedDate);

  const tasks: KitchenTask[] = data?.data ?? [];

  // Filter tasks by kashrut
  const filteredTasks = tasks.filter(t => {
    if (selectedKashrut !== 'ALL' && t.dish.kashrut !== selectedKashrut) {
      return false;
    }
    return true;
  });

  // Sort tasks by earliest departure time ascending (urgent departures first)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aTime = a.earliestDepartureAt ? new Date(a.earliestDepartureAt).getTime() : Infinity;
    const bTime = b.earliestDepartureAt ? new Date(b.earliestDepartureAt).getTime() : Infinity;
    return aTime - bTime;
  });

  const countsByStatus = {
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    DONE: tasks.filter(t => t.status === 'DONE').length,
    PACKED: tasks.filter(t => t.status === 'PACKED').length
  };

  const toggleExpand = (id: string) => {
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNextStatus = async (task: KitchenTask) => {
    const nextStatus = STATUS_CONFIG[task.status].next;
    if (!nextStatus) return;

    try {
      await updateTaskMutation.mutateAsync({
        id: task.id,
        body: { status: nextStatus }
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בעדכון סטטוס המשימה');
    }
  };

  const handleSetExactStatus = async (taskId: string, status: KitchenTaskStatus) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        body: { status }
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בעדכון סטטוס המשימה');
    }
  };

  const handleExportProductionSheet = async () => {
    try {
      const res = await fetchProductionSheet();
      const pdfUrl = res.data?.data?.pdfUrl;
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
      } else {
        alert('דף הייצור מופק בהצלחה!');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בהפקת דף הייצור');
    }
  };

  const formatDepartureTime = (isoString?: string | null) => {
    if (!isoString) return 'ללא שעת יעד';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none" dir="rtl">
      {/* Tablet Optimized Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ChefHat className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              מטבח
            </h1>
            <p className="text-xs text-slate-500">
              מסך ייצור (טאבלט) — משימות הכנה מרוכזות, שעות יציאה מוקדמות וסימון אריזה בלחיצה
            </p>
          </div>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Dates */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayStr())}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
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
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
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
            className="text-sm font-semibold rounded-xl border border-slate-300 py-2 px-3 bg-white"
          />

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 px-3 flex items-center gap-1.5"
            title="רענן משימות"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-primary' : 'text-slate-600'}`} />
          </Button>

          <Button
            variant="outline"
            onClick={handleExportProductionSheet}
            disabled={isExportingPdf}
            className="h-10 px-3 flex items-center gap-1.5 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          >
            <FileDown className="h-4 w-4 text-indigo-600" />
            <span className="hidden sm:inline">דף ייצור</span> (PDF)
          </Button>
        </div>
      </div>

      {/* Kashrut Tabs & Status Counters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Kashrut Filter Buttons (Huge touch targets for kitchen fingers) */}
        <div className="md:col-span-6 flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedKashrut('ALL')}
            className={`flex-1 py-3 px-3 rounded-xl text-center text-sm font-black transition-all ${
              selectedKashrut === 'ALL'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            הכל ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedKashrut('MEAT')}
            className={`flex-1 py-3 px-3 rounded-xl text-center text-sm font-black transition-all ${
              selectedKashrut === 'MEAT'
                ? 'bg-rose-700 text-white shadow-md'
                : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
            }`}
          >
            בשרי ({tasks.filter(t => t.dish.kashrut === 'MEAT').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedKashrut('DAIRY')}
            className={`flex-1 py-3 px-3 rounded-xl text-center text-sm font-black transition-all ${
              selectedKashrut === 'DAIRY'
                ? 'bg-sky-700 text-white shadow-md'
                : 'bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100'
            }`}
          >
            חלבי ({tasks.filter(t => t.dish.kashrut === 'DAIRY').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedKashrut('PARVE')}
            className={`flex-1 py-3 px-3 rounded-xl text-center text-sm font-black transition-all ${
              selectedKashrut === 'PARVE'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            פרווה ({tasks.filter(t => t.dish.kashrut === 'PARVE').length})
          </button>
        </div>

        {/* Live Counters */}
        <div className="md:col-span-6 grid grid-cols-4 gap-2">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
            <span className="text-xs text-slate-500 font-medium block">לביצוע</span>
            <span className="text-lg font-black text-slate-800">{countsByStatus.TODO}</span>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center">
            <span className="text-xs text-amber-700 font-medium block">בהכנה</span>
            <span className="text-lg font-black text-amber-900">{countsByStatus.IN_PROGRESS}</span>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 text-center">
            <span className="text-xs text-blue-700 font-medium block">מוכן</span>
            <span className="text-lg font-black text-blue-900">{countsByStatus.DONE}</span>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-center">
            <span className="text-xs text-emerald-700 font-medium block">נארז</span>
            <span className="text-lg font-black text-emerald-900">{countsByStatus.PACKED}</span>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
          <ChefHat className="h-10 w-10 mx-auto text-slate-300 animate-bounce mb-3" />
          <p className="font-semibold text-base">טוען משימות מטבח לתאריך {selectedDate}...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl p-12 text-center text-red-500 border border-red-200">
          <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-red-400" />
          <p className="font-semibold">שגיאה בטעינת משימות המטבח</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            נסה שוב
          </Button>
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center text-slate-400 border border-dashed border-slate-300">
          <ChefHat className="h-14 w-14 mx-auto text-slate-200 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">אין משימות בישול לתאריך זה</h3>
          <p className="text-xs text-slate-400 mt-1">
            הכל נקי ומאורגן, או שלא הוזנו מנות שצריכות הכנה
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTasks.map(task => {
            const kashrutInfo = KASHRUT_LABELS[task.dish.kashrut] || {
              label: task.dish.kashrut,
              bg: 'bg-slate-100',
              text: 'text-slate-800',
              border: 'border-slate-200'
            };

            const statusInfo = STATUS_CONFIG[task.status];
            const isExpanded = expandedTaskIds.has(task.id);
            const isPacked = task.status === 'PACKED';

            return (
              <div
                key={task.id}
                className={`rounded-2xl border-2 transition-all shadow-sm flex flex-col justify-between overflow-hidden bg-white ${
                  isPacked
                    ? 'border-emerald-200 opacity-80'
                    : task.status === 'IN_PROGRESS'
                    ? 'border-amber-400 shadow-md ring-2 ring-amber-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-black border ${kashrutInfo.bg} ${kashrutInfo.text} ${kashrutInfo.border}`}
                        >
                          {kashrutInfo.label}
                        </span>
                        {task.earliestDepartureAt && (
                          <span className="flex items-center gap-1 text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                            <Clock className="h-3 w-3" />
                            יציאה {formatDepartureTime(task.earliestDepartureAt)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {task.dish.name}
                      </h3>
                    </div>

                    {/* Total Quantity Pill */}
                    <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-center flex-shrink-0">
                      <span className="text-base font-black leading-none block">{task.qty}</span>
                      <span className="text-[10px] text-slate-300 font-bold block mt-0.5">
                        {task.unit === 'PORTION' ? 'מנות' : task.unit}
                      </span>
                    </div>
                  </div>

                  {/* Orders Breakdown Collapsible */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleExpand(task.id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        פירוט הזמנות ({task.orders.length} אירועים)
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 bg-slate-50 p-2.5 rounded-xl text-xs">
                        {task.orders.map(o => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between border-b border-slate-200/60 pb-1 last:border-none last:pb-0"
                          >
                            <span className="font-semibold text-slate-800">
                              #{o.number} {o.customerName}
                            </span>
                            <span className="font-black text-primary">
                              {o.qty} יח׳
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tablet Interactive Stepper Footer */}
                <div className="bg-slate-50 p-3 border-t border-slate-100 space-y-2">
                  {/* Big Single One-Tap Advancement Button */}
                  {statusInfo.next ? (
                    <button
                      type="button"
                      onClick={() => handleNextStatus(task)}
                      disabled={updateTaskMutation.isPending}
                      className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-sm text-white ${
                        task.status === 'TODO'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{statusInfo.nextAction}</span>
                    </button>
                  ) : (
                    <div className="w-full py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>הושלם ונארז במלואו</span>
                    </div>
                  )}

                  {/* 4-State Direct Toggle Bar */}
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {(['TODO', 'IN_PROGRESS', 'DONE', 'PACKED'] as KitchenTaskStatus[]).map(st => {
                      const isActive = task.status === st;
                      const conf = STATUS_CONFIG[st];

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleSetExactStatus(task.id, st)}
                          className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                            isActive
                              ? `${conf.bg} ring-2 ring-offset-1 ring-slate-400 font-black`
                              : 'text-slate-400 hover:bg-slate-200/60'
                          }`}
                        >
                          {conf.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
