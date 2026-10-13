import React, { useState } from 'react';
import {
  useRevenueReport,
  useProfitabilityReport,
  useTopDishesReport,
  useConversionReport
} from '@/api/reports';
import { Card, CardContent } from '@/components/ui/card';
import { formatMoney } from '@catering/shared';
import {
  BarChart3,
  DollarSign,
  Percent,
  Calendar,
  UtensilsCrossed,
  ArrowUpRight
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [fromDate, setFromDate] = useState('2026-05-01');
  const [toDate, setToDate] = useState('2026-10-31');
  const [activeTab, setActiveTab] = useState<'REVENUE' | 'PROFITABILITY' | 'DISHES' | 'CONVERSION'>('REVENUE');

  const { data: revenueData, isLoading: loadingRevenue } = useRevenueReport({ from: fromDate, to: toDate });
  const { data: profitabilityData, isLoading: loadingProfitability } = useProfitabilityReport({ from: fromDate, to: toDate });
  const { data: topDishesData, isLoading: loadingDishes } = useTopDishesReport({ from: fromDate, to: toDate });
  const { data: conversionData, isLoading: loadingConversion } = useConversionReport({ from: fromDate, to: toDate });

  const revenueItems = revenueData?.data ?? [];
  const profitabilityItems = profitabilityData?.data ?? [];
  const topDishes = topDishesData?.data ?? [];
  const conversion = conversionData?.data;

  // Global KPIs summary
  const totalRevenue = revenueItems.reduce((acc, r) => acc + r.revenue, 0);
  const totalPrevYear = revenueItems.reduce((acc, r) => acc + (r.prevYearRevenue ?? 0), 0);
  const totalOrders = revenueItems.reduce((acc, r) => acc + r.ordersCount, 0);
  const growthRate = totalPrevYear > 0 ? ((totalRevenue - totalPrevYear) / totalPrevYear) * 100 : 0;

  const maxRevenue = Math.max(...revenueItems.map(r => Math.max(r.revenue, r.prevYearRevenue ?? 0)), 1);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              דוחות מנהלים וניתוח עסקי
            </h1>
            <p className="text-sm text-slate-500">
              הכנסות שנתיות, רווחיות אירועים, מנות מובילות ואחוזי המרת הצעות מחיר
            </p>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
          <Calendar className="h-4 w-4 text-slate-400 mr-1" />
          <span className="text-xs font-medium text-slate-500">טווח תאריכים:</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-slate-300 py-1 px-2 bg-white"
          />
          <span className="text-xs text-slate-400">עד</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-slate-300 py-1 px-2 bg-white"
          />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">סה״כ הכנסות בתקופה</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatMoney(totalRevenue)}</p>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold mt-1">
                <ArrowUpRight className="h-3 w-3" />
                <span>צמיחה של {growthRate.toFixed(1)}% מול אשתקד</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">סה״כ אירועים שבוצעו</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalOrders}</p>
              <p className="text-xs text-slate-400 mt-1">
                ממוצע {(totalRevenue / (totalOrders || 1) / 100).toFixed(0)} ₪ לאירוע
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">יחס המרת הצעות מחיר</p>
              <p className="text-2xl font-black text-purple-600 mt-1">
                {conversion ? `${conversion.rate.toFixed(1)}%` : '0%'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {conversion?.quotesApproved} אושרו מתוך {conversion?.quotesSent} שנשלחו
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">מנה מנצחת ברווחיות</p>
              <p className="text-base font-black text-amber-900 mt-1 truncate">
                {topDishes[0]?.name || 'סיגרים אסאדו'}
              </p>
              <p className="text-xs text-amber-700 font-bold mt-1">
                רווח גולמי: {topDishes[0] ? formatMoney(topDishes[0].profit) : '-'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('REVENUE')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'REVENUE'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          הכנסות והשוואה שנתית (YoY)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PROFITABILITY')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'PROFITABILITY'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          רווחיות אירועים
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('DISHES')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'DISHES'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          מנות מובילות
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CONVERSION')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'CONVERSION'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          משפך המרות
        </button>
      </div>

      {/* TAB 1: REVENUE (YoY Bar Chart & Table) */}
      {activeTab === 'REVENUE' && (
        <Card className="border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                השוואת הכנסות חודשית — השנה מול אשתקד
              </h3>
              <p className="text-xs text-slate-500">
                עמודה כחולה = השנה הנוכחית, עמודה אפורה = השנה הקודמת
              </p>
            </div>
          </div>

          {loadingRevenue ? (
            <div className="p-8 text-center text-slate-500">טוען נתוני הכנסות...</div>
          ) : (
            <div className="space-y-6">
              {/* Responsive Visual Bar Chart */}
              <div className="h-64 flex items-end justify-between gap-4 pt-4 border-b border-slate-200 pb-4">
                {revenueItems.map(item => {
                  const currentHeight = Math.round((item.revenue / maxRevenue) * 200);
                  const prevHeight = Math.round(((item.prevYearRevenue ?? 0) / maxRevenue) * 200);

                  return (
                    <div key={item.period} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center gap-1.5 h-48">
                        {/* Prev year bar */}
                        <div
                          style={{ height: `${prevHeight}px` }}
                          className="w-1/3 bg-slate-200 rounded-t-md relative group"
                          title={`אשתקד: ${formatMoney(item.prevYearRevenue ?? 0)}`}
                        />
                        {/* Current year bar */}
                        <div
                          style={{ height: `${currentHeight}px` }}
                          className="w-1/3 bg-primary rounded-t-md relative group hover:bg-primary/90"
                          title={`השנה: ${formatMoney(item.revenue)} (${item.ordersCount} אירועים)`}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 font-mono">
                        {item.period}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">חודש</th>
                      <th className="px-4 py-2.5">אירועים</th>
                      <th className="px-4 py-2.5">הכנסות השנה</th>
                      <th className="px-4 py-2.5">הכנסות אשתקד</th>
                      <th className="px-4 py-2.5">שינוי</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {revenueItems.map(item => {
                      const diff = item.prevYearRevenue
                        ? ((item.revenue - item.prevYearRevenue) / item.prevYearRevenue) * 100
                        : 0;

                      return (
                        <tr key={item.period} className="hover:bg-slate-50/70">
                          <td className="px-4 py-2.5 font-bold font-mono text-slate-900">
                            {item.period}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 font-medium">
                            {item.ordersCount}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-900">
                            {formatMoney(item.revenue)}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">
                            {item.prevYearRevenue ? formatMoney(item.prevYearRevenue) : '-'}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-xs">
                            <span
                              className={diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}
                            >
                              {diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: PROFITABILITY */}
      {activeTab === 'PROFITABILITY' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {loadingProfitability ? (
              <div className="p-8 text-center text-slate-500">טוען רווחיות אירועים...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">מספר הזמנה</th>
                      <th className="px-4 py-3">לקוח</th>
                      <th className="px-4 py-3">הכנסות</th>
                      <th className="px-4 py-3">עלות חומרי גלם</th>
                      <th className="px-4 py-3">רווח גולמי</th>
                      <th className="px-4 py-3">שיעור רווחיות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profitabilityItems.map(item => (
                      <tr key={item.orderId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          #{item.number}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {item.customerName}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {formatMoney(item.revenue)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatMoney(item.ingredientCost)}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600">
                          {formatMoney(item.grossProfit)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              item.marginPercent >= 65
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.marginPercent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: TOP DISHES */}
      {activeTab === 'DISHES' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {loadingDishes ? (
              <div className="p-8 text-center text-slate-500">טוען מנות מובילות...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 text-xs font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">שם המנה</th>
                      <th className="px-4 py-3">כמות שנמכרה</th>
                      <th className="px-4 py-3">מחזור מכירות</th>
                      <th className="px-4 py-3">רווח כולל ממנה</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topDishes.map((dish, i) => (
                      <tr key={dish.dishId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <span className="text-xs bg-slate-100 text-slate-600 h-6 w-6 rounded-full flex items-center justify-center font-mono">
                            {i + 1}
                          </span>
                          <span>{dish.name}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-bold">
                          {dish.qty} מנות
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatMoney(dish.revenue)}
                        </td>
                        <td className="px-4 py-3 font-black text-emerald-600">
                          {formatMoney(dish.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: CONVERSION FUNNEL */}
      {activeTab === 'CONVERSION' && (
        <Card className="border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            משפך המרת הצעות מחיר להזמנות פעילות
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            ניתוח יחס סגירת עסקאות של מחלקת המכירות
          </p>

          {loadingConversion || !conversion ? (
            <div className="p-8 text-center text-slate-500">טוען נתוני המרה...</div>
          ) : (
            <div className="max-w-md mx-auto space-y-4">
              {/* Step 1: Quotes sent */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-bold text-slate-800 text-sm">
                  <span>הצעות מחיר שנשלחו</span>
                  <span className="text-lg">{conversion.quotesSent}</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full mt-2">
                  <div className="bg-blue-600 h-2.5 rounded-full w-full" />
                </div>
              </div>

              {/* Step 2: Quotes approved */}
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between font-bold text-purple-900 text-sm">
                  <span>הצעות שאושרו והפכו להזמנה</span>
                  <span className="text-lg">{conversion.quotesApproved}</span>
                </div>
                <div className="w-full bg-purple-200 h-2.5 rounded-full mt-2">
                  <div
                    style={{ width: `${conversion.rate}%` }}
                    className="bg-purple-600 h-2.5 rounded-full"
                  />
                </div>
              </div>

              {/* Conversion rate highlight */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                <p className="text-xs font-bold text-emerald-800">יחס המרה כולל:</p>
                <p className="text-4xl font-black text-emerald-600">{conversion.rate.toFixed(1)}%</p>
                <p className="text-xs text-emerald-700">
                  מעל היעד העסקי המוגדר (60%)
                </p>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
