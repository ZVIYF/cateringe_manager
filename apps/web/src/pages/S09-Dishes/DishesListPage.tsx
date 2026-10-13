import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDishes } from '@/api/dishes';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney, labels, type Kashrut } from '@catering/shared';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Edit,
  AlertTriangle,
  Layers
} from 'lucide-react';

const KASHRUT_TABS: Array<{ label: string; value: string }> = [
  { label: 'הכל', value: '' },
  { label: 'בשרי 🥩', value: 'MEAT' },
  { label: 'חלבי 🧀', value: 'DAIRY' },
  { label: 'פרווה 🥗', value: 'PARVE' }
];

const CATEGORY_TABS: Array<{ label: string; value: string }> = [
  { label: 'כל הקטגוריות', value: '' },
  { label: 'מנות ראשונות', value: 'STARTER' },
  { label: 'מנות עיקריות', value: 'MAIN' },
  { label: 'תוספות', value: 'SIDE' },
  { label: 'קינוחים', value: 'DESSERT' },
  { label: 'שתייה', value: 'BEVERAGE' },
  { label: 'אחר', value: 'OTHER' }
];

function getKashrutBadge(kashrut: Kashrut) {
  const label = labels.Kashrut[kashrut] ?? kashrut;
  switch (kashrut) {
    case 'MEAT':
      return <Badge className="bg-rose-600 text-white border-transparent">{label}</Badge>;
    case 'DAIRY':
      return <Badge className="bg-sky-600 text-white border-transparent">{label}</Badge>;
    case 'PARVE':
      return <Badge className="bg-emerald-600 text-white border-transparent">{label}</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
}

function getMarginBadge(marginPercent: number | undefined) {
  if (marginPercent === undefined || marginPercent === null) {
    return <span className="text-slate-400 text-xs">-</span>;
  }
  if (marginPercent >= 65) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
        רווחיות גבוהה ({marginPercent.toFixed(1)}%)
      </Badge>
    );
  }
  if (marginPercent >= 50) {
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
        רווחיות סבירה ({marginPercent.toFixed(1)}%)
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-50 text-rose-700 border border-rose-200">
      רווחיות נמוכה ({marginPercent.toFixed(1)}%)
    </Badge>
  );
}

export const DishesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedKashrut, setSelectedKashrut] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedActive, setSelectedActive] = useState<string>('true');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data, isLoading, isError, refetch } = useDishes({
    kashrut: selectedKashrut || undefined,
    category: selectedCategory || undefined,
    active: selectedActive === '' ? undefined : selectedActive === 'true',
    q: searchQuery || undefined
  });

  const dishes = data?.data ?? [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">תפריטים וקטלוג מנות</h1>
          <p className="text-sm text-slate-500">
            ניהול מנות, עצי מוצר (מתכונים), תמחור מנות ורווחיות מבוססת חומרי גלם
          </p>
        </div>
        <Button
          onClick={() => navigate('/dishes/new')}
          className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          מנה חדשה
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Search bar & Active selector */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="חיפוש מנה או אלרגן..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-9 text-right"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">סטטוס:</span>
              <select
                value={selectedActive}
                onChange={e => setSelectedActive(e.target.value)}
                className="h-9 px-3 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">הכל</option>
                <option value="true">פעילות בלבד</option>
                <option value="false">לא פעילות</option>
              </select>
            </div>
          </div>

          {/* Kashrut Tabs */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-400 self-center ml-2">כשרות:</span>
            {KASHRUT_TABS.map(tab => (
              <Button
                key={tab.value}
                variant={selectedKashrut === tab.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedKashrut(tab.value)}
                className="text-xs h-8"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-400 self-center ml-2">קטגוריה:</span>
            {CATEGORY_TABS.map(tab => (
              <Button
                key={tab.value}
                variant={selectedCategory === tab.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(tab.value)}
                className={`text-xs h-8 ${selectedCategory === tab.value ? 'font-semibold' : ''}`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dishes Grid / Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">טוען מנות...</div>
          ) : isError ? (
            <div className="py-12 text-center text-rose-600">
              <p>שגיאה בטעינת קטלוג המנות</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                נסה שוב
              </Button>
            </div>
          ) : dishes.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <UtensilsCrossed className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="font-medium">לא נמצאו מנות התואמות לחיפוש</p>
              <p className="text-xs text-slate-400 mt-1">נסה לשנות את תנאי הסינון או צור מנה חדשה</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                    <th className="py-3 px-4">שם המנה</th>
                    <th className="py-3 px-4">קטגוריה</th>
                    <th className="py-3 px-4">כשרות</th>
                    <th className="py-3 px-4">מחיר ללקוח</th>
                    <th className="py-3 px-4">עלות מזון (Food Cost)</th>
                    <th className="py-3 px-4">רווחיות גולמית (%)</th>
                    <th className="py-3 px-4">רכיבים במתכון</th>
                    <th className="py-3 px-4 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dishes.map(d => (
                    <tr
                      key={d.id}
                      className={`hover:bg-slate-50/70 transition-colors ${!d.active ? 'opacity-60 bg-slate-50/40' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <Link
                          to={`/dishes/${d.id}`}
                          className="hover:text-primary transition-colors font-semibold"
                        >
                          {d.name}
                        </Link>
                        {d.allergens && d.allergens.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {d.allergens.map(a => (
                              <span
                                key={a}
                                className="inline-block text-[10px] bg-amber-50 text-amber-700 border border-amber-200/50 px-1 rounded"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {labels.DishCategory[d.category] ?? d.category}
                      </td>
                      <td className="py-3.5 px-4">{getKashrutBadge(d.kashrut)}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {formatMoney(d.price)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {d.cost ? formatMoney(d.cost.perPortion) : <span className="text-slate-400 text-xs">לא חושב</span>}
                      </td>
                      <td className="py-3.5 px-4">{getMarginBadge(d.cost?.marginPercent)}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {d.recipe && d.recipe.length > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-slate-400" />
                            {d.recipe.length} חומרי גלם
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            אין מתכון
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link to={`/dishes/${d.id}`}>
                          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                            <Edit className="h-3.5 w-3.5" />
                            ערוך מתכון
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
    </div>
  );
};
