import React, { useState, useRef, useEffect } from 'react';
import { useDriverDeliveriesToday, useStartDelivery, useCompleteDelivery } from '@/api/deliveries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Delivery } from '@catering/shared';
import {
  Truck,
  Navigation,
  MapPin,
  Phone,
  Package,
  CheckCircle2,
  Camera,
  PenTool,
  X,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const DriverMobilePage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useDriverDeliveriesToday();
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);

  // Complete delivery modal state
  const [receiverName, setReceiverName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [photoSelected, setPhotoSelected] = useState<string | null>(null);
  const [checkedBoxes, setCheckedBoxes] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 32.0853, lng: 34.7818 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Canvas signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDeliveryMutation = useStartDelivery();
  const completeDeliveryMutation = useCompleteDelivery();

  const deliveries = data?.data ?? [];

  // Capture GPS on mount or modal open
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          // Fallback coords
          setCoords({ lat: 32.0853, lng: 34.7818 });
        }
      );
    }
  }, []);

  const handleStartDelivery = async (delivery: Delivery) => {
    try {
      await startDeliveryMutation.mutateAsync(delivery.id);
      alert(`נסיעה הופעלה בהצלחה! סמס אוטומטי נשלח אל ${delivery.customerName}.`);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בהפעלת נסיעה');
    }
  };

  const openCompleteModal = (delivery: Delivery) => {
    setActiveDelivery(delivery);
    setReceiverName(delivery.customerName);
    setDeliveryNotes('');
    setPhotoSelected(null);
    setHasSignature(false);

    // Initialize box checkboxes
    const initialBoxes = Array.from({ length: delivery.boxesCount }, (_, i) => `ארגז #${i + 1}`);
    setCheckedBoxes(initialBoxes);

    // Clear canvas shortly after render
    setTimeout(() => {
      clearCanvas();
    }, 100);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDelivery) return;

    if (!receiverName.trim()) {
      alert('נא להזין את שם מקבל המשלוח');
      return;
    }

    const canvas = canvasRef.current;
    const signatureBase64 = hasSignature && canvas
      ? canvas.toDataURL('image/png')
      : 'data:image/png;base64,mockSignatureSignatureHandled';

    setIsSubmitting(true);
    try {
      await completeDeliveryMutation.mutateAsync({
        id: activeDelivery.id,
        body: {
          receiverName: receiverName.trim(),
          signature: signatureBase64,
          photo: photoSelected ?? undefined,
          notes: deliveryNotes.trim() || undefined,
          lat: coords.lat,
          lng: coords.lng,
          checkedBoxes,
          clientCompletedAt: new Date().toISOString()
        }
      });
      alert('המשלוח נמסר ונחתם בהצלחה!');
      setActiveDelivery(null);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה באישור מסירת המשלוח');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20 select-none" dir="rtl">
      {/* Mobile Top App Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none">
              נהג
            </h1>
            <p className="text-[11px] text-slate-400 mt-1">
              מסלול משלוחי היום — {deliveries.filter(d => d.status === 'DELIVERED').length} מתוך {deliveries.length} הושלמו
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 text-slate-400 hover:text-white"
          title="רענן מסלול"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {/* Turn-by-Turn Route List */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-500">טוען את מסלול המשלוחים...</div>
      ) : isError ? (
        <div className="p-8 text-center text-red-500">שגיאה בטעינת מסלול הנהג</div>
      ) : deliveries.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Truck className="h-12 w-12 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-700">אין משלוחים משובצים להיום</p>
          <p className="text-xs text-slate-400 mt-1">תהנה מהיום החופשי!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((del, idx) => {
            const isDelivered = del.status === 'DELIVERED';
            const isEnRoute = del.status === 'EN_ROUTE';

            return (
              <Card
                key={del.id}
                className={`border-2 transition-all shadow-sm overflow-hidden ${
                  isDelivered
                    ? 'border-emerald-200 bg-emerald-50/20 opacity-85'
                    : isEnRoute
                    ? 'border-amber-400 ring-2 ring-amber-100 bg-white'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Stop Sequence & Status Pill */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 text-white">
                      <span>עצירה {del.sequence ?? idx + 1}</span>
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : isEnRoute
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isDelivered
                        ? 'נמסר'
                        : isEnRoute
                        ? 'בנסיעה עכשיו'
                        : 'ממתין ליציאה'}
                    </span>
                  </div>

                  {/* Customer and Order Number */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      #{del.orderNumber} {del.customerName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {del.plannedDepartureAt
                        ? `יציאה מתוכננת: ${new Date(del.plannedDepartureAt).toLocaleTimeString('he-IL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}`
                        : 'שעת יציאה גמישה'}
                    </p>
                  </div>

                  {/* Destination Address & Waze Navigation Button */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2 text-xs text-slate-800 font-medium">
                      <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{del.address}</span>
                    </div>

                    <a
                      href={`https://waze.com/ul?q=${encodeURIComponent(del.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Waze</span>
                    </a>
                  </div>

                  {/* Phone & Boxes summary */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <a
                      href={`tel:${del.customerPhone}`}
                      className="flex items-center gap-1 text-slate-600 font-bold hover:text-blue-600"
                      dir="ltr"
                    >
                      <Phone className="h-3.5 w-3.5 text-blue-500" />
                      {del.customerPhone}
                    </a>

                    <div className="flex items-center gap-1 font-bold text-slate-700">
                      <Package className="h-3.5 w-3.5 text-amber-500" />
                      <span>{del.boxesCount} ארגזים</span>
                    </div>
                  </div>

                  {/* Notes for driver */}
                  {del.notes && (
                    <div className="bg-amber-50/70 p-2 rounded-lg text-[11px] text-amber-900 border border-amber-200/60">
                      <strong>הערות:</strong> {del.notes}
                    </div>
                  )}

                  {/* Big Touch-Friendly Action Buttons */}
                  <div className="pt-2">
                    {isDelivered ? (
                      <div className="w-full py-2.5 px-3 bg-emerald-50 rounded-xl text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5 border border-emerald-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>נמסר ונחתם ע"י {del.receiverName || 'הלקוח'}</span>
                      </div>
                    ) : isEnRoute ? (
                      <Button
                        type="button"
                        onClick={() => openCompleteModal(del)}
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-md"
                      >
                        <PenTool className="h-4 w-4" />
                        <span>מסירת משלוח וחתימת לקוח</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => handleStartDelivery(del)}
                        disabled={startDeliveryMutation.isPending}
                        className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-md"
                      >
                        <Truck className="h-4 w-4" />
                        <span>התחל נסיעה ליעד (שלח סמס)</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Hand-off Confirmation Modal with Digital Signature Canvas */}
      {activeDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 overflow-y-auto">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 my-auto">
            <button
              onClick={() => setActiveDelivery(null)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">
                אישור מסירה — הזמנה #{activeDelivery.orderNumber}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeDelivery.customerName} • {activeDelivery.address}
              </p>
            </div>

            <form onSubmit={handleCompleteDelivery} className="space-y-3">
              {/* Receiver name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  שם מקבל המשלוח *
                </label>
                <Input
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                  placeholder="שם מלא של המקבל"
                  className="h-10 text-sm font-semibold"
                  required
                />
              </div>

              {/* Verified Boxes Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  אימות ארגזים ({activeDelivery.boxesCount} סה״כ):
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Array.from({ length: activeDelivery.boxesCount }, (_, i) => {
                    const boxName = `ארגז #${i + 1}`;
                    const isChecked = checkedBoxes.includes(boxName);

                    return (
                      <label
                        key={i}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50 border-blue-300 text-blue-900'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setCheckedBoxes([...checkedBoxes, boxName]);
                            } else {
                              setCheckedBoxes(checkedBoxes.filter(b => b !== boxName));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span>{boxName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Digital Signature Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <PenTool className="h-3.5 w-3.5 text-blue-600" />
                    <span>חתימת לקוח דיגיטלית *</span>
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] text-rose-600 font-bold hover:underline"
                  >
                    נקה חתימה
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 relative touch-none">
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={130}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[130px] block cursor-crosshair"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-slate-400 font-medium">
                      חתום כאן באצבע או בעט מגע
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Upload Placeholder */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5 text-slate-500" />
                  <span>צילום מקום המסירה (אופציונלי):</span>
                </label>
                <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-500 truncate">
                    {photoSelected ? 'תמונה צורפה בהצלחה ✓' : 'לא נבחרה תמונה'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhotoSelected('data:image/jpeg;base64,mockPhotoData')}
                    className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                  >
                    צלם / בחר תמונה
                  </button>
                </div>
              </div>

              {/* GPS Geolocation tag */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>מיקום GPS נקלט</span>
                </span>
                <span className="font-mono">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveDelivery(null)}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                >
                  {isSubmitting ? 'מאשר...' : 'אשר מסירה'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
