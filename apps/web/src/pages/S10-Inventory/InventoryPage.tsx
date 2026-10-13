import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useIngredients,
  useCreateIngredient,
  useInventoryForecast,
  useStockMoves,
  useCreateStockMove
} from '@/api/inventory';
import { useCreatePOsFromShortages } from '@/api/purchasing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  formatMoney,
  toAgorot,
  type StockMoveType
} from '@catering/shared';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Search,
  Plus,
  ArrowRightLeft,
  Calendar,
  History,
  ShoppingCart,
  CheckCircle2,
  X
} from 'lucide-react';


function getStockMoveBadge(type: StockMoveType) {
  switch (type) {
    case 'IN':
      return <Badge className="bg-emerald-600 text-white">כניסה</Badge>;
    case 'OUT':
      return <Badge className="bg-blue-600 text-white">יציאה</Badge>;
    case 'ADJUST':
      return <Badge className="bg-purple-600 text-white">התאמה</Badge>;
    case 'WASTE':
      return <Badge variant="destructive">פחת</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'FORECAST' | 'MOVES'>('STOCK');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showBelowMinOnly, setShowBelowMinOnly] = useState(false);

  // Stock Move modal state
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveIngredientId, setMoveIngredientId] = useState('');
  const [moveType, setMoveType] = useState<StockMoveType>('IN');
  const [moveQty, setMoveQty] = useState<number | string>('');
  const [moveReason, setMoveReason] = useState('');
  const [moveError, setMoveError] = useState<string | null>(null);

  // New Ingredient modal state
  const [isIngModalOpen, setIsIngModalOpen] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngCategory, setNewIngCategory] = useState('');
  const [newIngUnit, setNewIngUnit] = useState('ק"ג');
  const [newIngCurrentStock, setNewIngCurrentStock] = useState<number | string>(0);
  const [newIngMinStock, setNewIngMinStock] = useState<number | string>(10);
  const [newIngCostShekels, setNewIngCostShekels] = useState<number | string>(10);
  const [ingError, setIngError] = useState<string | null>(null);

  // Generation from shortages state
  const [poGenSuccess, setPoGenSuccess] = useState<string | null>(null);

  const {
    data: ingredientsData,
    isLoading: isLoadingIng,
    isError: isErrorIng,
    refetch: refetchIng
  } = useIngredients({
    q: searchQuery || undefined,
    category: selectedCategory || undefined,
    belowMin: showBelowMinOnly ? true : undefined
  });

  const {
    data: forecastData,
    isLoading: isLoadingForecast,
    isError: isErrorForecast
  } = useInventoryForecast(7);

  const {
    data: stockMovesData,
    isLoading: isLoadingMoves,
    isError: isErrorMoves
  } = useStockMoves({
    page: 1,
    pageSize: 30
  });

  const createStockMoveMutation = useCreateStockMove();
  const createIngredientMutation = useCreateIngredient();
  const createPOsFromShortagesMutation = useCreatePOsFromShortages();

  const ingredients = ingredientsData?.data ?? [];
  const forecastItems = forecastData?.data ?? [];
  const stockMoves = stockMovesData?.data ?? [];

  const lowStockCount = ingredients.filter(i => i.currentStock <= i.minStock).length;
  const totalStockValue = ingredients.reduce(
    (acc, i) => acc + Math.round(i.currentStock * i.costPerUnit),
    0
  );

  const shortagesCount = forecastItems.filter(f => f.shortage > 0).length;

  const handleCreateMove = async (e: React.FormEvent) => {
    e.preventDefault();
    setMoveError(null);

    const qty = Number(moveQty);
    if (!moveIngredientId) {
      setMoveError('נא לבחור חומר גלם');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setMoveError('נא להזין כמות חיובית');
      return;
    }
    if (!moveReason.trim()) {
      setMoveError('נא לציין סיבה או הסבר לתנועת המלאי');
      return;
    }

    try {
      await createStockMoveMutation.mutateAsync({
        ingredientId: moveIngredientId,
        type: moveType,
        qty,
        reason: moveReason.trim()
      });
      setIsMoveModalOpen(false);
      setMoveIngredientId('');
      setMoveQty('');
      setMoveReason('');
    } catch (err: unknown) {
      setMoveError(err instanceof Error ? err.message : 'שגיאה ברישום תנועת המלאי');
    }
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngError(null);

    if (!newIngName.trim()) {
      setIngError('נא להזין שם חומר גלם');
      return;
    }

    try {
      await createIngredientMutation.mutateAsync({
        name: newIngName.trim(),
        category: newIngCategory.trim() || undefined,
        unit: newIngUnit.trim(),
        currentStock: Number(newIngCurrentStock) || 0,
        minStock: Number(newIngMinStock) || 0,
        costPerUnit: toAgorot(Number(newIngCostShekels) || 0)
      });
      setIsIngModalOpen(false);
      setNewIngName('');
      setNewIngCategory('');
      setNewIngCurrentStock(0);
      setNewIngMinStock(10);
      setNewIngCostShekels(10);
    } catch (err: unknown) {
      setIngError(err instanceof Error ? err.message : 'שגיאה ביצירת חומר הגלם');
    }
  };

  const handleGeneratePOs = async () => {
    setPoGenSuccess(null);
    try {
      const res = await createPOsFromShortagesMutation.mutateAsync({ days: 7 });
      setPoGenSuccess(`הופקו בהצלחה ${res.data.length} הזמנות רכש מרוכזות מספקים!`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בהפקת הזמנות רכש');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ניהול מלאי ותחזית חוסרים
          </h1>
          <p className="text-sm text-slate-500">
            מעקב מלאי שוטף, התרעות על סף מינימום, תחזית חוסרים לפי הזמנות ויומן תנועות
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setMoveError(null);
              setIsMoveModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <ArrowRightLeft className="h-4 w-4" />
            רישום תנועת מלאי
          </Button>
          <Button
            onClick={() => {
              setIngError(null);
              setIsIngModalOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            חומר גלם חדש
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">סה"כ פריטים במלאי</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{ingredients.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">פריטים מתחת לסף מינימום</p>
              <h3
                className={`text-2xl font-bold mt-1 ${
                  lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {lowStockCount}
              </h3>
            </div>
            <div
              className={`p-3 rounded-xl ${
                lowStockCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">שווי מלאי נוכחי מוערך</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {formatMoney(totalStockValue)}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingDown className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('STOCK')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'STOCK'
              ? 'border-b-2 border-primary text-primary font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="h-4 w-4" />
          ספר מלאי שוטף ({ingredients.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FORECAST')}
          className={`pb-3 transition-colors flex items-center gap-2 relative ${
            activeTab === 'FORECAST'
              ? 'border-b-2 border-primary text-primary font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="h-4 w-4" />
          תחזית חוסרים ל-7 ימים
          {shortagesCount > 0 && (
            <span className="bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
              {shortagesCount} חסרים
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MOVES')}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === 'MOVES'
              ? 'border-b-2 border-primary text-primary font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <History className="h-4 w-4" />
          יומן תנועות מלאי
        </button>
      </div>

      {/* ── TAB 1: CURRENT STOCK LEDGER ─────────────────────────────────────── */}
      {activeTab === 'STOCK' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="חיפוש חומר גלם לפי שם או קטגוריה..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-9 text-right"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white"
                >
                  <option value="">כל הקטגוריות</option>
                  {Array.from(new Set(ingredients.map(i => i.category).filter(Boolean))).map(cat => (
                    <option key={cat} value={cat as string}>
                      {cat}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBelowMinOnly}
                    onChange={e => setShowBelowMinOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  הצג פריטים בחוסר בלבד
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Ingredients Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {isLoadingIng ? (
                <div className="py-12 text-center text-slate-500">טוען נתוני מלאי...</div>
              ) : isErrorIng ? (
                <div className="py-12 text-center text-rose-600">
                  <p>שגיאה בטעינת נתוני המלאי</p>
                  <Button variant="outline" size="sm" onClick={() => refetchIng()} className="mt-2">
                    נסה שוב
                  </Button>
                </div>
              ) : ingredients.length === 0 ? (
                <div className="py-12 text-center text-slate-500">לא נמצאו פריטים תואמים</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium text-xs">
                        <th className="py-3 px-4">חומר גלם</th>
                        <th className="py-3 px-4">קטגוריה</th>
                        <th className="py-3 px-4">יחידה</th>
                        <th className="py-3 px-4">מלאי נוכחי</th>
                        <th className="py-3 px-4">סף מינימום</th>
                        <th className="py-3 px-4">עלות יחידה</th>
                        <th className="py-3 px-4">ספק מועדף</th>
                        <th className="py-3 px-4 text-center">סטטוס</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ingredients.map(ing => {
                        const isLow = ing.currentStock <= ing.minStock;
                        return (
                          <tr
                            key={ing.id}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              isLow ? 'bg-rose-50/30' : ''
                            }`}
                          >
                            <td className="py-3.5 px-4 font-semibold text-slate-900">{ing.name}</td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs">
                              {ing.category ?? 'כללי'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 text-xs">{ing.unit}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <span
                                className={isLow ? 'text-rose-600 font-extrabold' : 'text-slate-800'}
                              >
                                {ing.currentStock} {ing.unit}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 text-xs">
                              {ing.minStock} {ing.unit}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-800">
                              {formatMoney(ing.costPerUnit)}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs">
                              {ing.supplierName ?? '-'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isLow ? (
                                <Badge variant="destructive" className="text-[11px]">
                                  מתחת למינימום
                                </Badge>
                              ) : (
                                <Badge variant="success" className="text-[11px]">
                                  מלאי תקין
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 2: SHORTAGE FORECAST (7-DAY WINDOW) ─────────────────────────── */}
      {activeTab === 'FORECAST' && (
        <div className="space-y-4">
          {/* Action Callout */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                תחזית חוסרי חומרי גלם (שבוע קדימה)
              </h3>
              <p className="text-xs text-amber-800 mt-1">
                התחזית מחושבת על פי מתכוני המנות בכלל ההזמנות המאושרות ובייצור ב-7 הימים הקרובים.
              </p>
            </div>

            <Button
              onClick={handleGeneratePOs}
              disabled={createPOsFromShortagesMutation.isPending || shortagesCount === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {createPOsFromShortagesMutation.isPending
                ? 'מייצר הזמנות...'
                : 'הפק הזמנות רכש מרוכזות מחוסרים'}
            </Button>
          </div>

          {poGenSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {poGenSuccess}
              </span>
              <Link to="/purchase-orders" className="text-primary hover:underline text-xs font-bold">
                עבור להזמנות רכש &larr;
              </Link>
            </div>
          )}

          {/* Forecast Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {isLoadingForecast ? (
                <div className="py-12 text-center text-slate-500">מחשב תחזית חוסרים...</div>
              ) : isErrorForecast ? (
                <div className="py-12 text-center text-rose-600">שגיאה בחישוב התחזית</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium text-xs">
                        <th className="py-3 px-4">חומר גלם</th>
                        <th className="py-3 px-4">יחידה</th>
                        <th className="py-3 px-4">מלאי נוכחי</th>
                        <th className="py-3 px-4">נדרש לייצור</th>
                        <th className="py-3 px-4">צפוי להיכנס</th>
                        <th className="py-3 px-4">חסר לגיוס</th>
                        <th className="py-3 px-4">ספק מומלץ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {forecastItems.map(item => {
                        const hasShortage = item.shortage > 0;
                        return (
                          <tr
                            key={item.ingredientId}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              hasShortage ? 'bg-amber-50/40' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                            <td className="py-3 px-4 text-slate-500 text-xs">{item.unit}</td>
                            <td className="py-3 px-4 text-slate-800">
                              {item.stock} {item.unit}
                            </td>
                            <td className="py-3 px-4 font-medium text-blue-700">
                              {item.required} {item.unit}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {item.incoming > 0 ? `${item.incoming} ${item.unit}` : '-'}
                            </td>
                            <td className="py-3 px-4 font-bold">
                              {hasShortage ? (
                                <span className="text-rose-600 font-extrabold flex items-center gap-1">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  {item.shortage} {item.unit}
                                </span>
                              ) : (
                                <span className="text-emerald-600 text-xs font-semibold">
                                  מכוסה במלואו
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-xs">
                              {item.supplier ? item.supplier.name : <span className="text-slate-400">לא הוגדר ספק</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 3: STOCK MOVES LOG ─────────────────────────────────────────── */}
      {activeTab === 'MOVES' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoadingMoves ? (
              <div className="py-12 text-center text-slate-500">טוען יומן תנועות מלאי...</div>
            ) : isErrorMoves ? (
              <div className="py-12 text-center text-rose-600">שגיאה בטעינת יומן התנועות</div>
            ) : stockMoves.length === 0 ? (
              <div className="py-12 text-center text-slate-500">אין תנועות מלאי להצגה</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium text-xs">
                      <th className="py-3 px-4">תאריך ושעה</th>
                      <th className="py-3 px-4">חומר גלם</th>
                      <th className="py-3 px-4">סוג תנועה</th>
                      <th className="py-3 px-4">כמות</th>
                      <th className="py-3 px-4">סיבה והערות</th>
                      <th className="py-3 px-4">נרשם ע"י</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockMoves.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          {new Date(m.createdAt).toLocaleDateString('he-IL')}{' '}
                          {new Date(m.createdAt).toLocaleTimeString('he-IL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {m.ingredientName ?? 'חומר גלם'}
                        </td>
                        <td className="py-3 px-4">{getStockMoveBadge(m.type)}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{m.qty}</td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{m.reason}</td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {m.createdByName ?? 'מערכת'}
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

      {/* Stock Move Modal */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">רישום תנועת מלאי ידנית</h2>
              <button
                type="button"
                onClick={() => setIsMoveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMove} className="p-5 space-y-4">
              {moveError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                  {moveError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">חומר גלם *</label>
                <select
                  value={moveIngredientId}
                  onChange={e => setMoveIngredientId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                >
                  <option value="">-- בחר פריט מהמלאי --</option>
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (נוכחי: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">סוג תנועה *</label>
                <select
                  value={moveType}
                  onChange={e => setMoveType(e.target.value as StockMoveType)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="IN">כניסה (רכש / קבלה)</option>
                  <option value="OUT">יציאה (ייצור / בישול)</option>
                  <option value="ADJUST">התאמת ספירת מלאי</option>
                  <option value="WASTE">פחת / בלאי / קלקול</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">כמות *</label>
                <Input
                  type="number"
                  step={0.1}
                  min={0.1}
                  value={moveQty}
                  onChange={e => setMoveQty(e.target.value)}
                  placeholder="0.0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">סיבה / הסבר *</label>
                <Input
                  value={moveReason}
                  onChange={e => setMoveReason(e.target.value)}
                  placeholder="למשל: נזרק עקב קלקול במקרר, או קבלת עודף"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMoveModalOpen(false)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={createStockMoveMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {createStockMoveMutation.isPending ? 'רושם תנועה...' : 'עדכן מלאי'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Ingredient Modal */}
      {isIngModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">הוספת חומר גלם חדש למלאי</h2>
              <button
                type="button"
                onClick={() => setIsIngModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIngredient} className="p-5 space-y-4">
              {ingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                  {ingError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">שם חומר הגלם *</label>
                <Input
                  value={newIngName}
                  onChange={e => setNewIngName(e.target.value)}
                  placeholder="למשל: סלמון טרי או שמן קנולה"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">קטגוריה</label>
                  <Input
                    value={newIngCategory}
                    onChange={e => setNewIngCategory(e.target.value)}
                    placeholder="בשר / ירקות / שמנים"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">יחידת מידה</label>
                  <select
                    value={newIngUnit}
                    onChange={e => setNewIngUnit(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="ק&quot;ג">ק"ג</option>
                    <option value="גרם">גרם</option>
                    <option value="ליטר">ליטר</option>
                    <option value="יחידה">יחידה</option>
                    <option value="חבילה">חבילה</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">מלאי פתיחה</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={newIngCurrentStock}
                    onChange={e => setNewIngCurrentStock(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">סף מינימום</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={newIngMinStock}
                    onChange={e => setNewIngMinStock(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  עלות יחידה (₪) *
                </label>
                <Input
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={newIngCostShekels}
                  onChange={e => setNewIngCostShekels(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsIngModalOpen(false)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={createIngredientMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {createIngredientMutation.isPending ? 'שומר...' : 'צור חומר גלם'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
