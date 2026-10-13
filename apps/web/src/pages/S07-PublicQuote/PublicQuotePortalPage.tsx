import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicQuote, useApprovePublicQuote, useRequestQuoteChange } from '@/api/publicQuote';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney, labels } from '@catering/shared';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  MessageSquare,
  Download,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const PublicQuotePortalPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError } = usePublicQuote(token);
  const approveMutation = useApprovePublicQuote(token ?? '');
  const requestChangeMutation = useRequestQuoteChange(token ?? '');

  // Approval state & Canvas signature
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signatureError, setSignatureError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Request change state
  const [isChangeOpen, setIsChangeOpen] = useState(false);
  const [changeMessage, setChangeMessage] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0]!.clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0]!.clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0]!.clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0]!.clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Submit Approval
  const handleApprove = async () => {
    if (!signerName.trim()) {
      setSignatureError('יש להזין שם מלא לחתימה');
      return;
    }
    const canvas = canvasRef.current;
    let signaturePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    if (canvas && hasDrawn) {
      signaturePng = canvas.toDataURL('image/png');
    }

    try {
      setSignatureError('');
      const res = await approveMutation.mutateAsync({
        signerName: signerName.trim(),
        signaturePng
      });
      // Redirect to payment url
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (err: unknown) {
      setSignatureError(err instanceof Error ? err.message : 'שגיאה באישור ההצעה');
    }
  };

  // Submit Change Request
  const handleRequestChange = async () => {
    if (!changeMessage.trim()) return;
    try {
      await requestChangeMutation.mutateAsync({ message: changeMessage.trim() });
      setChangeSuccess(true);
      setTimeout(() => {
        setIsChangeOpen(false);
        setChangeSuccess(false);
        setChangeMessage('');
      }, 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בשליחת הבקשה');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4" dir="rtl">
        <div className="text-center text-sm text-slate-500">טוען הצעת מחיר...</div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4" dir="rtl">
        <Card className="w-full max-w-md p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-900">ההצעה לא נמצאה או שפג תוקפה</h2>
          <p className="mt-2 text-sm text-slate-600">
            הקישור להצעת המחיר אינו תקף. אנא פנה לצוות הקייטרינג לקבלת קישור מעודכן.
          </p>
        </Card>
      </div>
    );
  }

  const quote = data.data;
  const startsAt = new Date(quote.event.startsAt);
  const formattedEventDate = !isNaN(startsAt.getTime())
    ? startsAt.toLocaleDateString('he-IL', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : quote.event.startsAt;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Branding & Welcome Card */}
        <Card className="overflow-hidden border-indigo-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 p-6 text-white text-center">
            <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>הצעת מחיר לאירוע שלכם</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{quote.business.name}</h1>
            <p className="mt-1 text-sm text-indigo-200">
              {quote.business.phone} • {quote.business.address || ''}
            </p>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-lg bg-indigo-50/50 p-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>{formattedEventDate}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>{quote.event.address}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>{quote.event.guests} מוזמנים • כשרות {labels.Kashrut[quote.event.kashrut as keyof typeof labels.Kashrut] ?? quote.event.kashrut}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items Breakdown */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-bold text-slate-900">
              תפריט המנות שנבחרו ({quote.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {quote.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <div className="font-semibold text-slate-900">{item.dishName}</div>
                    <div className="text-xs text-slate-500">
                      {labels.DishCategory[item.category as keyof typeof labels.DishCategory] ?? item.category}
                      {item.notes ? ` • ${item.notes}` : ''}
                    </div>
                  </div>
                  <div className="text-left font-semibold text-slate-900">
                    <div>{formatMoney(item.lineTotal)}</div>
                    <div className="text-xs font-normal text-slate-500">
                      {item.qty} יח' ({formatMoney(item.unitPrice)})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Services if any */}
        {quote.services.length > 0 && (
          <Card className="bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900">שירותים נלווים</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {quote.services.map((srv, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 text-sm">
                    <div className="font-medium text-slate-900">{srv.name}</div>
                    <div className="font-semibold text-slate-900">{formatMoney(srv.lineTotal)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Summary Card */}
        <Card className="bg-white shadow-sm border-indigo-100">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-bold text-slate-900">סיכום כספי לתשלום</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>סיכום ביניים:</span>
              <span>{formatMoney(quote.totals.subtotal)}</span>
            </div>
            {quote.totals.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>הנחה:</span>
                <span>-{formatMoney(quote.totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>מע"מ:</span>
              <span>{formatMoney(quote.totals.vat)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900">
              <span>סה"כ לתשלום:</span>
              <span className="text-indigo-600">{formatMoney(quote.totals.total)}</span>
            </div>
            <div className="flex justify-between rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-900 border border-emerald-100">
              <span>מקדמה נדרשת לאישור ההזמנה:</span>
              <span>{formatMoney(quote.totals.deposit)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        {quote.terms && (
          <div className="rounded-lg bg-slate-100/70 p-4 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-700">תנאי ההזמנה:</div>
            <p>{quote.terms}</p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="sticky bottom-4 z-20 rounded-xl bg-white p-4 shadow-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChangeOpen(true)}
            className="gap-1.5"
          >
            <MessageSquare className="h-4 w-4" />
            <span>בקש שינוי בהצעה</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>הדפס / שמור</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsApproveOpen(true)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5"
            >
              <CheckCircle className="h-4 w-4" />
              <span>אשר הצעה ותשלום מקדמה</span>
            </Button>
          </div>
        </div>

        {/* APPROVE MODAL WITH SIGNATURE PAD */}
        {isApproveOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-lg bg-white p-6 shadow-2xl space-y-4">
              <h2 className="text-lg font-bold text-slate-900">אישור הצעת מחיר וחתימה דיגיטלית</h2>
              <p className="text-xs text-slate-600">
                נא להזין את שמך המלא ולחתום במסגרת למטה כדי לאשר את ההצעה ולעבור לתשלום המקדמה בסך{' '}
                <span className="font-bold text-slate-900">{formatMoney(quote.totals.deposit)}</span>.
              </p>

              {signatureError && (
                <div className="rounded-md bg-rose-50 p-2.5 text-xs text-rose-700">
                  {signatureError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">שם מלא *</label>
                <Input
                  placeholder="הזן שם מלא"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">חתימה דיגיטלית על המסך</label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>נקה חתימה</span>
                  </button>
                </div>
                <div className="border border-slate-300 rounded-lg bg-slate-50 overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={450}
                    height={140}
                    className="w-full h-[140px] touch-none cursor-crosshair bg-white"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsApproveOpen(false)}>
                  ביטול
                </Button>
                <Button
                  size="sm"
                  disabled={approveMutation.isPending}
                  onClick={handleApprove}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>חתום ועבור לתשלום</span>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* REQUEST CHANGE MODAL */}
        {isChangeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md bg-white p-6 shadow-2xl space-y-4">
              <h2 className="text-lg font-bold text-slate-900">בקשת שינוי בהצעת המחיר</h2>
              <p className="text-xs text-slate-600">
                פרט מה תרצה לשנות (כמות סועדים, הוספת מנות, שינוי תאריך וכו'):
              </p>

              {changeSuccess ? (
                <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 text-center font-medium">
                  בקשתך נשלחה בהצלחה! צוות הקייטרינג ייצור עמך קשר.
                </div>
              ) : (
                <>
                  <textarea
                    rows={4}
                    placeholder="כתוב את בקשתך כאן..."
                    value={changeMessage}
                    onChange={e => setChangeMessage(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsChangeOpen(false)}>
                      ביטול
                    </Button>
                    <Button
                      size="sm"
                      disabled={!changeMessage.trim() || requestChangeMutation.isPending}
                      onClick={handleRequestChange}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      שלח בקשה
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
