import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useDish,
  useCreateDish,
  useUpdateDish,
  useUpdateDishRecipe,
  useIngredientsList
} from '@/api/dishes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  formatMoney,
  toAgorot,
  type Kashrut,
  type DishCategory,
  type SaleUnit
} from '@catering/shared';
import {
  ArrowRight,
  Plus,
  Trash2,
  Save,
  Layers,
  Scale
} from 'lucide-react';

interface LocalRecipeLine {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  qtyPerPortion: number;
  costPerUnit: number;
}

export const DishEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const { data: dishData, isLoading: isLoadingDish } = useDish(id);
  const { data: ingredientsData } = useIngredientsList();

  const createMutation = useCreateDish();
  const updateMutation = useUpdateDish(id ?? '');
  const updateRecipeMutation = useUpdateDishRecipe(id ?? '');

  const dish = dishData?.data;
  const ingredients = useMemo(() => ingredientsData?.data ?? [], [ingredientsData]);

  // Metadata form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DishCategory>('MAIN');
  const [kashrut, setKashrut] = useState<Kashrut>('MEAT');
  const [unit, setUnit] = useState<SaleUnit>('PORTION');
  const [portionsPerUnit, setPortionsPerUnit] = useState(1);
  const [priceShekels, setPriceShekels] = useState<number | string>(0);
  const [allergensText, setAllergensText] = useState('');
  const [active, setActive] = useState(true);

  // Recipe lines state
  const [recipeLines, setRecipeLines] = useState<LocalRecipeLine[]>([]);

  // Add ingredient inputs
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [addQty, setAddQty] = useState<number | string>(0.1);

  const [metaMessage, setMetaMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [recipeMessage, setRecipeMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Populate state when dish loads
  useEffect(() => {
    if (dish) {
      setName(dish.name);
      setCategory(dish.category);
      setKashrut(dish.kashrut);
      setUnit(dish.unit);
      setPortionsPerUnit(dish.portionsPerUnit);
      setPriceShekels(dish.price / 100);
      setAllergensText(dish.allergens.join(', '));
      setActive(dish.active);

      // Map dish recipe lines with ingredient cost data
      const initialLines: LocalRecipeLine[] = (dish.recipe ?? []).map(r => {
        const found = ingredients.find(i => i.id === r.ingredientId);
        return {
          ingredientId: r.ingredientId,
          ingredientName: r.ingredientName,
          unit: r.unit,
          qtyPerPortion: r.qtyPerPortion,
          costPerUnit: found ? found.costPerUnit : 0
        };
      });
      setRecipeLines(initialLines);
    }
  }, [dish, ingredients]);

  // Calculate live Food Cost & Margin
  const currentSellingPriceAgorot = useMemo(() => {
    const val = Number(priceShekels);
    return isNaN(val) ? 0 : toAgorot(val);
  }, [priceShekels]);

  const liveFoodCostAgorot = useMemo(() => {
    return recipeLines.reduce((acc, line) => {
      return acc + Math.round(line.qtyPerPortion * line.costPerUnit);
    }, 0);
  }, [recipeLines]);

  const liveMarginPercent = useMemo(() => {
    if (currentSellingPriceAgorot <= 0) return 0;
    const margin =
      ((currentSellingPriceAgorot - liveFoodCostAgorot) / currentSellingPriceAgorot) * 100;
    return Number(margin.toFixed(1));
  }, [currentSellingPriceAgorot, liveFoodCostAgorot]);

  // Handle adding an ingredient to recipe
  const handleAddIngredient = () => {
    if (!selectedIngredientId) return;
    const ing = ingredients.find(i => i.id === selectedIngredientId);
    if (!ing) return;

    const qty = Number(addQty);
    if (isNaN(qty) || qty <= 0) return;

    // Check if ingredient already in recipe
    const existingIndex = recipeLines.findIndex(r => r.ingredientId === ing.id);
    if (existingIndex >= 0) {
      const updated = [...recipeLines];
      updated[existingIndex].qtyPerPortion += qty;
      setRecipeLines(updated);
    } else {
      setRecipeLines(prev => [
        ...prev,
        {
          ingredientId: ing.id,
          ingredientName: ing.name,
          unit: ing.unit,
          qtyPerPortion: qty,
          costPerUnit: ing.costPerUnit
        }
      ]);
    }

    // Reset selection
    setSelectedIngredientId('');
    setAddQty(0.1);
  };

  const handleRemoveLine = (index: number) => {
    setRecipeLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleQtyChange = (index: number, newQty: number) => {
    if (newQty < 0) return;
    setRecipeLines(prev =>
      prev.map((l, i) => (i === index ? { ...l, qtyPerPortion: newQty } : l))
    );
  };

  // Save Dish Metadata
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setMetaMessage(null);

    const priceAgorot = currentSellingPriceAgorot;
    if (priceAgorot <= 0) {
      setMetaMessage({ type: 'error', text: 'נא להזין מחיר מכירה תקף' });
      return;
    }

    const allergens = allergensText
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    try {
      if (isNew) {
        const res = await createMutation.mutateAsync({
          name: name.trim(),
          category,
          kashrut,
          unit,
          portionsPerUnit: Number(portionsPerUnit) || 1,
          price: priceAgorot,
          allergens,
          active,
          imageUrl: null
        });
        navigate(`/dishes/${res.data.id}`);
      } else {
        await updateMutation.mutateAsync({
          version: dish!.version,
          name: name.trim(),
          category,
          kashrut,
          unit,
          portionsPerUnit: Number(portionsPerUnit) || 1,
          price: priceAgorot,
          allergens,
          active
        });
        setMetaMessage({ type: 'success', text: 'פרטי המנה נשמרו בהצלחה' });
      }
    } catch (err: unknown) {
      setMetaMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'שגיאה בשמירת פרטי המנה'
      });
    }
  };

  // Save Recipe Lines
  const handleSaveRecipe = async () => {
    if (!dish) return;
    setRecipeMessage(null);

    try {
      await updateRecipeMutation.mutateAsync({
        version: dish.version,
        lines: recipeLines.map(l => ({
          ingredientId: l.ingredientId,
          qtyPerPortion: Number(l.qtyPerPortion)
        }))
      });
      setRecipeMessage({ type: 'success', text: 'עץ המוצר (מתכון) עודכן בהצלחה והעלויות חושבו מחדש' });
    } catch (err: unknown) {
      setRecipeMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'שגיאה בעדכון המתכון'
      });
    }
  };

  if (!isNew && isLoadingDish) {
    return (
      <div className="py-20 text-center text-slate-500" dir="rtl">
        טוען נתוני מנה...
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/menus"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה לקטלוג מנות
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isNew ? 'יצירת מנה חדשה' : `עריכת מנה: ${name}`}
            </h1>
            {!isNew && dish && (
              <Badge
                variant="outline"
                className={dish.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}
              >
                {dish.active ? 'פעילה' : 'לא פעילה'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Metadata) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-800">
                פרטי מנה ותמחור
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSaveMetadata} className="space-y-4">
                {metaMessage && (
                  <div
                    className={`p-3 text-sm rounded-lg border ${
                      metaMessage.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {metaMessage.text}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">שם המנה *</label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="למשל: סטייק אנטרקוט ברוטב יין"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">קטגוריה</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as DishCategory)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="STARTER">מנה ראשונה</option>
                      <option value="MAIN">מנה עיקרית</option>
                      <option value="SIDE">תוספת</option>
                      <option value="DESSERT">קינוח</option>
                      <option value="BEVERAGE">שתייה</option>
                      <option value="OTHER">אחר</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">כשרות</label>
                    <select
                      value={kashrut}
                      onChange={e => setKashrut(e.target.value as Kashrut)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="MEAT">בשרי 🥩</option>
                      <option value="DAIRY">חלבי 🧀</option>
                      <option value="PARVE">פרווה 🥗</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      יחידת מכירה
                    </label>
                    <select
                      value={unit}
                      onChange={e => setUnit(e.target.value as SaleUnit)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="PORTION">מנה (Portion)</option>
                      <option value="KG">ק"ג (Kg)</option>
                      <option value="TRAY">מגש (Tray)</option>
                      <option value="PIECE">יחידה (Piece)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      מנות ליחידה
                    </label>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={portionsPerUnit}
                      onChange={e => setPortionsPerUnit(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    מחיר מכירה ללקוח (₪ כולל מע"מ) *
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={priceShekels}
                    onChange={e => setPriceShekels(e.target.value)}
                    className="font-semibold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    אלרגנים (מופרדים בפסיקים)
                  </label>
                  <Input
                    value={allergensText}
                    onChange={e => setAllergensText(e.target.value)}
                    placeholder="למשל: גלוטן, בוטנים, סויה"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="dishActive"
                    checked={active}
                    onChange={e => setActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="dishActive" className="text-xs font-medium text-slate-700">
                    מנה פעילה (זמינה להזמנות חדשות)
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isNew ? 'צור מנה והמשך למתכון' : 'שמור פרטי מנה'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Recipe Builder & Costing) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Costing Bar Card */}
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-slate-50 to-white">
            <CardHeader className="pb-3 border-b border-slate-200/60">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                ניתוח עלות מזון ורווחיות בזמן אמת (Real-time Food Cost)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block">מחיר מכירה</span>
                  <span className="text-lg font-bold text-slate-900 mt-1 block">
                    {formatMoney(currentSellingPriceAgorot)}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block">עלות חומרי גלם (למנה)</span>
                  <span className="text-lg font-bold text-rose-600 mt-1 block">
                    {formatMoney(liveFoodCostAgorot)}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 block">רווחיות גולמית</span>
                  <div className="mt-1 flex flex-col items-center">
                    <span
                      className={`text-lg font-bold ${
                        liveMarginPercent >= 65
                          ? 'text-emerald-600'
                          : liveMarginPercent >= 50
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {liveMarginPercent}%
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {liveMarginPercent >= 65
                        ? 'רווחיות יעד מעולה'
                        : liveMarginPercent >= 50
                        ? 'רווחיות בינונית'
                        : 'מתחת ליעד (זהירות)'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipe Lines Builder Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-500" />
                עץ מוצר (רכיבי המתכון)
              </CardTitle>
              {!isNew && (
                <Button
                  size="sm"
                  onClick={handleSaveRecipe}
                  disabled={updateRecipeMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  {updateRecipeMutation.isPending ? 'מעדכן...' : 'שמור מתכון'}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {isNew ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  שמור תחילה את פרטי המנה כדי לבנות את עץ המוצר (מתכון)
                </div>
              ) : (
                <>
                  {recipeMessage && (
                    <div
                      className={`p-3 text-sm rounded-lg border ${
                        recipeMessage.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      {recipeMessage.text}
                    </div>
                  )}

                  {/* Add Ingredient Bar */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <div className="flex-1">
                      <select
                        value={selectedIngredientId}
                        onChange={e => setSelectedIngredientId(e.target.value)}
                        className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">-- בחר חומר גלם מהמלאי --</option>
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit}) - {formatMoney(ing.costPerUnit)} / {ing.unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28 flex items-center gap-1">
                      <Input
                        type="number"
                        min={0.001}
                        step={0.05}
                        placeholder="כמות"
                        value={addQty}
                        onChange={e => setAddQty(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddIngredient}
                      disabled={!selectedIngredientId}
                      className="bg-primary hover:bg-primary/90 text-white text-xs h-9"
                    >
                      <Plus className="h-3.5 w-3.5 ml-1" />
                      הוסף רכיב
                    </Button>
                  </div>

                  {/* Recipe Lines Table */}
                  {recipeLines.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      לא הוגדרו עדיין רכיבים למתכון זה. בחר חומר גלם למעלה והוסף אותו.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                            <th className="py-2.5 px-3">חומר גלם</th>
                            <th className="py-2.5 px-3">יחידת מידה</th>
                            <th className="py-2.5 px-3">כמות למנה</th>
                            <th className="py-2.5 px-3">מחיר יחידה</th>
                            <th className="py-2.5 px-3">עלות כוללת</th>
                            <th className="py-2.5 px-3 text-center">הסר</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {recipeLines.map((line, idx) => {
                            const lineCost = Math.round(line.qtyPerPortion * line.costPerUnit);
                            return (
                              <tr key={line.ingredientId} className="hover:bg-slate-50/70">
                                <td className="py-2.5 px-3 font-medium text-slate-900">
                                  {line.ingredientName}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500">{line.unit}</td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="number"
                                    min={0.001}
                                    step={0.05}
                                    value={line.qtyPerPortion}
                                    onChange={e => handleQtyChange(idx, Number(e.target.value))}
                                    className="w-20 px-2 py-1 border border-slate-200 rounded text-center text-xs"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  {formatMoney(line.costPerUnit)}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-rose-600">
                                  {formatMoney(lineCost)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLine(idx)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
