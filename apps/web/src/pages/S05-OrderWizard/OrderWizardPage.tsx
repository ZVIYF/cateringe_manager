import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  useOrder,
  useCreateOrder,
  useUpdateOrder,
  usePutOrderItems,
  usePutOrderServices,
  useDishesList,
  useCustomersList
} from '@/api/orders';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  calcTotals,
  formatMoney,
  toAgorot,
  labels,
  type Kashrut,
  type EventType,
  type ServiceType,
  type DiscountType,
  type PaymentMethod
} from '@catering/shared';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  FileText
} from 'lucide-react';

interface SelectedItem {
  dishId: string;
  dishName: string;
  category: string;
  unit: string;
  qty: number;
  unitPrice: number; // in agorot
  notes?: string;
}

interface SelectedService {
  serviceId: string;
  name: string;
  qty: number;
  unitPrice: number; // in agorot
}

const STEPS = [
  { id: 1, title: 'פרטי אירוע ולקוח' },
  { id: 2, title: 'תפריט ומנות' },
  { id: 3, title: 'שירותים וציוד' },
  { id: 4, title: 'תמחור ותנאים' }
];

export const OrderWizardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  // Queries & Mutations
  const { data: existingOrderData, isLoading: isLoadingOrder } = useOrder(id);
  const { data: customersData } = useCustomersList();
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder(id ?? '');
  const putItemsMutation = usePutOrderItems(id ?? '');
  const putServicesMutation = usePutOrderServices(id ?? '');

  // Step state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Step 1: Customer & Event
  const [customerId, setCustomerId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [eventType, setEventType] = useState<EventType>('CELEBRATION');
  const [startsAt, setStartsAt] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [guests, setGuests] = useState<number>(50);
  const [kashrut, setKashrut] = useState<Kashrut>('MEAT');
  const [serviceType, setServiceType] = useState<ServiceType>('DELIVERY_AND_SERVING');
  const [eventNotes, setEventNotes] = useState<string>('');

  // Step 2: Items
  const { data: dishesData } = useDishesList({ kashrut });
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [selectedDishIdToAdd, setSelectedDishIdToAdd] = useState<string>('');
  const [addQty, setAddQty] = useState<number>(50);

  // Step 3: Services
  const [services, setServices] = useState<SelectedService[]>([]);
  const [serviceNameInput, setServiceNameInput] = useState<string>('');
  const [serviceQtyInput, setServiceQtyInput] = useState<number>(1);
  const [servicePriceInput, setServicePriceInput] = useState<number>(350); // In NIS

  // Step 4: Pricing & Commercials
  const [discountType, setDiscountType] = useState<DiscountType>('NONE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [vatPercent] = useState<number>(18);
  const [pricesIncludeVat, setPricesIncludeVat] = useState<boolean>(false);
  const [depositPercent, setDepositPercent] = useState<number>(30);
  const [paymentTerms, setPaymentTerms] = useState<PaymentMethod | 'NET_30'>('TRANSFER');
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] ?? ''
  );

  // Initialize from existing order in edit mode
  useEffect(() => {
    if (existingOrderData?.data) {
      const o = existingOrderData.data;
      setCustomerId(o.customer.id);
      setTitle(o.event.title ?? '');
      setEventType(o.event.type as EventType);
      setStartsAt(o.event.startsAt ? o.event.startsAt.slice(0, 16) : '');
      setAddress(o.event.address ?? '');
      setGuests(o.event.guests ?? 50);
      setKashrut(o.event.kashrut as Kashrut);
      setServiceType(o.event.serviceType as ServiceType);
      setEventNotes(o.event.notes ?? '');

      setItems(
        o.items.map(it => ({
          dishId: it.dishId,
          dishName: it.dishName,
          category: it.category,
          unit: it.unit,
          qty: it.qty,
          unitPrice: it.unitPrice,
          notes: it.notes ?? undefined
        }))
      );

      setServices(
        o.services.map(s => ({
          serviceId: s.serviceId,
          name: s.name,
          qty: s.qty,
          unitPrice: s.unitPrice
        }))
      );

      setDiscountType(o.pricing.discountType as DiscountType);
      setDiscountValue(o.pricing.discountValue ?? 0);
      setPricesIncludeVat(o.pricing.pricesIncludeVat ?? false);
      setDepositPercent(o.pricing.depositPercent ?? 30);
      setPaymentTerms(o.pricing.paymentTerms as PaymentMethod | 'NET_30');
      setValidUntil(o.pricing.validUntil ?? '');
    }
  }, [existingOrderData]);

  // Real-time calculated totals
  const allLines = [
    ...items.map(it => ({ qty: it.qty, unitPrice: it.unitPrice })),
    ...services.map(s => ({ qty: s.qty, unitPrice: s.unitPrice }))
  ];

  const calculatedTotals = calcTotals({
    lines: allLines,
    discountType,
    discountValue,
    vatPercent,
    pricesIncludeVat,
    depositPercent,
    guests: guests > 0 ? guests : 1,
    paid: existingOrderData?.data.totals.paid ?? 0
  });

  // Adding dish
  const handleAddDish = () => {
    if (!selectedDishIdToAdd) return;
    const dish = dishesData?.data.find(d => d.id === selectedDishIdToAdd);
    if (!dish) return;

    const existingIdx = items.findIndex(it => it.dishId === dish.id);
    if (existingIdx >= 0) {
      setItems(prev =>
        prev.map((it, idx) => (idx === existingIdx ? { ...it, qty: it.qty + addQty } : it))
      );
    } else {
      setItems(prev => [
        ...prev,
        {
          dishId: dish.id,
          dishName: dish.name,
          category: dish.category,
          unit: dish.unit,
          qty: addQty,
          unitPrice: dish.price
        }
      ]);
    }
    setSelectedDishIdToAdd('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    setItems(prev => prev.map((it, i) => (i === index ? { ...it, qty: newQty } : it)));
  };

  const handleUpdateItemPrice = (index: number, newPriceNis: number) => {
    if (newPriceNis < 0) return;
    setItems(prev =>
      prev.map((it, i) => (i === index ? { ...it, unitPrice: toAgorot(newPriceNis) } : it))
    );
  };

  // Adding service
  const handleAddService = () => {
    if (!serviceNameInput.trim()) return;
    setServices(prev => [
      ...prev,
      {
        serviceId: `srv-${Date.now()}`,
        name: serviceNameInput.trim(),
        qty: serviceQtyInput,
        unitPrice: toAgorot(servicePriceInput)
      }
    ]);
    setServiceNameInput('');
    setServiceQtyInput(1);
    setServicePriceInput(350);
  };

  const handleRemoveService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!customerId) {
      setErrorMsg('יש לבחור לקוח');
      return false;
    }
    if (!startsAt) {
      setErrorMsg('יש לבחור תאריך ושעת אירוע');
      return false;
    }
    if (!address.trim()) {
      setErrorMsg('יש להזין כתובת');
      return false;
    }
    if (guests < 1 || guests > 5000) {
      setErrorMsg('מספר סועדים חייב להיות בין 1 ל-5,000');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  // Submission handler
  const handleFinalSubmit = async () => {
    setErrorMsg('');
    try {
      const eventPayload = {
        title: title.trim() || undefined,
        type: eventType,
        startsAt: new Date(startsAt).toISOString(),
        address: address.trim(),
        guests,
        kashrut,
        serviceType,
        notes: eventNotes.trim() || undefined
      };

      const pricingPayload = {
        discountType,
        discountValue,
        vatPercent,
        pricesIncludeVat,
        depositPercent,
        paymentTerms,
        validUntil
      };

      let orderId = id;

      if (!isEdit) {
        // Create initial order
        const created = await createOrderMutation.mutateAsync({
          customerId,
          event: eventPayload
        });
        orderId = created.data.id;

        // Save pricing
        await updateOrderMutation.mutateAsync({
          version: created.data.version,
          event: eventPayload,
          pricing: pricingPayload
        });
      } else if (orderId) {
        // Update existing order
        await updateOrderMutation.mutateAsync({
          version: existingOrderData!.data.version,
          event: eventPayload,
          pricing: pricingPayload
        });
      }

      if (orderId) {
        // Update items
        if (items.length > 0) {
          const currentVersion = isEdit ? existingOrderData!.data.version + 1 : 2;
          await putItemsMutation.mutateAsync({
            version: currentVersion,
            items: items.map(it => ({
              dishId: it.dishId,
              qty: it.qty,
              unitPrice: it.unitPrice,
              notes: it.notes
            }))
          });
        }

        // Update services
        if (services.length > 0) {
          const currentVersion = isEdit ? existingOrderData!.data.version + 2 : 3;
          await putServicesMutation.mutateAsync({
            version: currentVersion,
            services: services.map(s => ({
              serviceId: s.serviceId,
              name: s.name,
              qty: s.qty,
              unitPrice: s.unitPrice
            }))
          });
        }

        navigate(`/orders/${orderId}`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'שגיאה בשמירת ההזמנה');
    }
  };

  if (isEdit && isLoadingOrder) {
    return <div className="p-12 text-center text-sm text-slate-500">טוען פרטי הזמנה...</div>;
  }

  const selectedCustomer = customersData?.data.find(c => c.id === customerId);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isEdit ? `עריכת הזמנה #${existingOrderData?.data.number ?? ''}` : 'אשף פתיחת הזמנה חדשה'}
          </h1>
          <p className="text-sm text-slate-600">בניית הזמנה והצעת מחיר מפורטת ב-4 שלבים מודרכים</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/orders">ביטול וחזרה</Link>
        </Button>
      </div>

      {/* Stepper Header */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map(step => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;
          return (
            <button
              key={step.id}
              onClick={() => {
                if (step.id < currentStep || validateStep1()) {
                  setCurrentStep(step.id);
                }
              }}
              className={`flex items-center gap-3 rounded-lg border p-3 text-right transition-colors ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span className="text-xs font-semibold sm:text-sm">{step.title}</span>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-md bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Layout: Wizard Form (left) + Sticky Summary Panel (right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Form (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* STEP 1: EVENT & CUSTOMER */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">שלב 1: פרטי לקוח ואירוע</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Customer Select */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">לקוח *</label>
                    <select
                      value={customerId}
                      onChange={e => setCustomerId(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- בחר לקוח --</option>
                      {customersData?.data.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Event Title */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">שם / כותרת האירוע</label>
                    <Input
                      placeholder="לדוגמה: בר מצווה — יוסף"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Event Type */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">סוג אירוע *</label>
                    <select
                      value={eventType}
                      onChange={e => setEventType(e.target.value as EventType)}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      {Object.entries(labels.EventType).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Starts At */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">תאריך ושעת אירוע *</label>
                    <Input
                      type="datetime-local"
                      value={startsAt}
                      onChange={e => setStartsAt(e.target.value)}
                    />
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">מספר סועדים *</label>
                    <Input
                      type="number"
                      min={1}
                      max={5000}
                      value={guests}
                      onChange={e => setGuests(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">כתובת האירוע / מקום *</label>
                  <Input
                    placeholder="כתובת מלאה כולל עיר ואולם"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Kashrut */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">כשרות *</label>
                    <div className="flex gap-4 pt-1">
                      {(['MEAT', 'DAIRY', 'PARVE'] as Kashrut[]).map(k => (
                        <label key={k} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                          <input
                            type="radio"
                            name="kashrut"
                            value={k}
                            checked={kashrut === k}
                            onChange={() => setKashrut(k)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{labels.Kashrut[k]}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Service Type */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">סוג שירות *</label>
                    <select
                      value={serviceType}
                      onChange={e => setServiceType(e.target.value as ServiceType)}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      {Object.entries(labels.ServiceType).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">הערות לאירוע</label>
                  <textarea
                    rows={3}
                    placeholder="בקשות מיוחדות, דרישות תפעוליות..."
                    value={eventNotes}
                    onChange={e => setEventNotes(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: DISHES & MENU */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-900">שלב 2: תפריט ומנות</CardTitle>
                  <Badge variant={kashrut === 'MEAT' ? 'meat' : kashrut === 'DAIRY' ? 'dairy' : 'parve'}>
                    כשרות: {labels.Kashrut[kashrut]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Dish Box */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-700">הוספת מנה מהקטלוג</h3>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      value={selectedDishIdToAdd}
                      onChange={e => setSelectedDishIdToAdd(e.target.value)}
                      className="flex-1 rounded-md border border-slate-300 bg-white p-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- בחר מנה להוספה --</option>
                      {dishesData?.data.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({labels.DishCategory[d.category as keyof typeof labels.DishCategory]}) — {formatMoney(d.price)}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={addQty}
                        onChange={e => setAddQty(Number(e.target.value))}
                        className="w-24"
                        placeholder="כמות"
                      />
                      <Button
                        type="button"
                        onClick={handleAddDish}
                        disabled={!selectedDishIdToAdd}
                        className="gap-1 bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Plus className="h-4 w-4" />
                        <span>הוסף</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Selected Dishes Table */}
                {items.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    עדיין לא נבחרו מנות להזמנה. בחר מנה למעלה ולחץ "הוסף".
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                        <tr>
                          <th className="px-3 py-2">שם המנה</th>
                          <th className="px-3 py-2">קטגוריה</th>
                          <th className="px-3 py-2">כמות</th>
                          <th className="px-3 py-2">מחיר ליח' (₪)</th>
                          <th className="px-3 py-2">סה"כ</th>
                          <th className="px-3 py-2 text-center">הסר</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((it, idx) => (
                          <tr key={`${it.dishId}-${idx}`}>
                            <td className="px-3 py-2 font-medium text-slate-900">{it.dishName}</td>
                            <td className="px-3 py-2 text-slate-500">
                              {labels.DishCategory[it.category as keyof typeof labels.DishCategory] ?? it.category}
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min={1}
                                value={it.qty}
                                onChange={e => handleUpdateItemQty(idx, Number(e.target.value))}
                                className="h-8 w-20 text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min={0}
                                step="0.5"
                                value={it.unitPrice / 100}
                                onChange={e => handleUpdateItemPrice(idx, Number(e.target.value))}
                                className="h-8 w-24 text-center"
                              />
                            </td>
                            <td className="px-3 py-2 font-semibold text-slate-800">
                              {formatMoney(it.qty * it.unitPrice)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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

          {/* STEP 3: SERVICES */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">שלב 3: שירותים וצוות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-700">הוספת שירות נוסף (מלצרים, ציוד וכו')</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <Input
                        placeholder="תיאור השירות (למשל: 3 מלצרים)"
                        value={serviceNameInput}
                        onChange={e => setServiceNameInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        min={1}
                        placeholder="כמות"
                        value={serviceQtyInput}
                        onChange={e => setServiceQtyInput(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="מחיר ב-₪"
                        value={servicePriceInput}
                        onChange={e => setServicePriceInput(Number(e.target.value))}
                      />
                      <Button
                        type="button"
                        onClick={handleAddService}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {services.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    לא נוספו שירותים נלווים. ניתן לדלג לשלב הבא.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                        <tr>
                          <th className="px-3 py-2">שם השירות</th>
                          <th className="px-3 py-2">כמות</th>
                          <th className="px-3 py-2">מחיר ליח'</th>
                          <th className="px-3 py-2">סה"כ</th>
                          <th className="px-3 py-2 text-center">הסר</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {services.map((srv, idx) => (
                          <tr key={`${srv.serviceId}-${idx}`}>
                            <td className="px-3 py-2 font-medium text-slate-900">{srv.name}</td>
                            <td className="px-3 py-2 text-slate-700">{srv.qty}</td>
                            <td className="px-3 py-2 text-slate-700">{formatMoney(srv.unitPrice)}</td>
                            <td className="px-3 py-2 font-semibold text-slate-800">
                              {formatMoney(srv.qty * srv.unitPrice)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveService(idx)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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

          {/* STEP 4: COMMERCIALS & PRICING */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">שלב 4: תמחור ותנאים מסחריים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Discount Type */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">סוג הנחה</label>
                    <select
                      value={discountType}
                      onChange={e => setDiscountType(e.target.value as DiscountType)}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="NONE">ללא הנחה</option>
                      <option value="PERCENT">אחוזים (%)</option>
                      <option value="FIXED">סכום קבוע (₪)</option>
                    </select>
                  </div>

                  {/* Discount Value */}
                  {discountType !== 'NONE' && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        ערך ההנחה {discountType === 'PERCENT' ? '(%)' : '(₪)'}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={discountValue}
                        onChange={e => setDiscountValue(Number(e.target.value))}
                      />
                      {discountType === 'PERCENT' && discountValue > 15 && (
                        <p className="mt-1 text-xs text-amber-600 font-medium">
                          שים לב: הנחה מעל 15% דורשת אישור מנהל בהצעת המחיר.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Deposit Percent */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">אחוז מקדמה נדרש (%)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={depositPercent}
                      onChange={e => setDepositPercent(Number(e.target.value))}
                    />
                  </div>

                  {/* Payment Terms */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">תנאי תשלום</label>
                    <select
                      value={paymentTerms}
                      onChange={e => setPaymentTerms(e.target.value as PaymentMethod | 'NET_30')}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="TRANSFER">העברה בנקאית</option>
                      <option value="CREDIT_CARD">כרטיס אשראי</option>
                      <option value="CHECK">צ'ק</option>
                      <option value="CASH">מזומן</option>
                      <option value="NET_30">שוטף + 30</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Valid Until */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">תוקף ההצעה עד</label>
                    <Input
                      type="date"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                    />
                  </div>

                  {/* VAT option */}
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="vatCheck"
                      checked={pricesIncludeVat}
                      onChange={e => setPricesIncludeVat(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="vatCheck" className="text-sm font-medium text-slate-700">
                      המחירים כוללים מע"מ (18%)
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(s => s - 1)}
                className="gap-1"
              >
                <ChevronRight className="h-4 w-4" />
                <span>הקודם</span>
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !validateStep1()) return;
                  setCurrentStep(s => s + 1);
                }}
                className="gap-1 bg-indigo-600 hover:bg-indigo-700"
              >
                <span>המשך לשלב הבא</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={createOrderMutation.isPending || updateOrderMutation.isPending}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="h-4 w-4" />
                <span>{isEdit ? 'שמור שינויים' : 'שמור וצור הזמנה'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Sticky Live Summary Panel (1 col) */}
        <div className="space-y-6">
          <Card className="sticky top-6 border-indigo-100 bg-indigo-50/30">
            <CardHeader className="border-b border-indigo-100/60 pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-indigo-950">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span>סיכום הזמנה חי</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-sm">
              {/* Event details snapshot */}
              <div className="space-y-1.5 border-b border-slate-200/80 pb-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">לקוח:</span>
                  <span>{selectedCustomer ? selectedCustomer.name : 'טרם נבחר'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">מועד:</span>
                  <span>{startsAt ? new Date(startsAt).toLocaleDateString('he-IL') : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">סועדים:</span>
                  <span>{guests} סועדים</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">כשרות:</span>
                  <span>{labels.Kashrut[kashrut]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">מנות שנבחרו:</span>
                  <span>{items.length} פריטים</span>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>סיכום ביניים:</span>
                  <span>{formatMoney(calculatedTotals.subtotal)}</span>
                </div>

                {calculatedTotals.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>הנחה:</span>
                    <span>-{formatMoney(calculatedTotals.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>מע"מ ({vatPercent}%):</span>
                  <span>{formatMoney(calculatedTotals.vat)}</span>
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                  <span>סה"כ לתשלום:</span>
                  <span className="text-indigo-600">{formatMoney(calculatedTotals.total)}</span>
                </div>

                <div className="flex justify-between text-xs text-slate-500">
                  <span>מחיר לסועד:</span>
                  <span>{formatMoney(calculatedTotals.perGuest)}</span>
                </div>

                <div className="flex justify-between rounded-md bg-white p-2 text-xs font-semibold text-slate-700 border border-indigo-100">
                  <span>מקדמה לתשלום ({depositPercent}%):</span>
                  <span className="text-emerald-700">{formatMoney(calculatedTotals.deposit)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
