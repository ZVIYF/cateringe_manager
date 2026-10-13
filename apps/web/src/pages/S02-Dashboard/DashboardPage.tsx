import { formatMoney, labels, type DashboardSchemas } from '@catering/shared';
import {
  CalendarDays,
  FileText,
  TrendingUp,
  AlertCircle,
  Clock,
  Users,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '@/api/dashboard';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const alertConfig: Record<
  DashboardSchemas.DashboardAlertType,
  { label: string; variant: 'destructive' | 'warning' | 'default' }
> = {
  LOW_STOCK: { label: 'מלאי נמוך', variant: 'destructive' },
  NO_DRIVER: { label: 'חסר נהג', variant: 'destructive' },
  QUOTE_EXPIRING: { label: 'תוקף הצעה', variant: 'warning' },
  CHANGE_REQUESTED: { label: 'בקשת שינוי', variant: 'warning' },
  PAYMENT_RECEIVED: { label: 'תשלום התקבל', variant: 'default' }
};

function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function DashboardPage() {
  const { data, isPending, error } = useDashboard();

  if (isPending) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="טוען לוח בקרה">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <Skeleton className="h-72 rounded-lg" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert className="max-w-xl">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <span>אירעה שגיאה בטעינת נתוני לוח הבקרה. נסו לרענן את העמוד.</span>
      </Alert>
    );
  }

  const { kpis, upcoming, alerts, revenueChart } = data;
  const maxRevenue = revenueChart && revenueChart.length > 0
    ? Math.max(...revenueChart.map((m) => m.revenue), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">לוח בקרה</h1>
        <p className="text-sm text-muted-foreground">מבט כולל על הפעילות, אירועים קרובים והתראות מערכת</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">אירועים השבוע</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.eventsThisWeek}</div>
            <p className="text-xs text-muted-foreground">אירועים מתוכננים לשבעת הימים הקרובים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הצעות מחיר ממתינות</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pendingQuotes}</div>
            <p className="text-xs text-muted-foreground">הצעות מחיר שנשלחו וממתינות לאישור לקוח</p>
          </CardContent>
        </Card>

        {kpis.revenueThisMonth !== undefined && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">הכנסות החודש</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatMoney(kpis.revenueThisMonth)}</div>
              <p className="text-xs text-muted-foreground">סך הזמנות מאושרות לחודש הנוכחי</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">יתרות פתוחות</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatMoney(kpis.openBalances)}</div>
            <p className="text-xs text-muted-foreground">סך חובות פתוחים מאירועים פעילים</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart (Omitted for OFFICE) */}
      {revenueChart && revenueChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>מגמת הכנסות (6 חודשים אחרונים)</CardTitle>
            <CardDescription>הכנסות מהזמנות לפי חודש ביצוע האירוע</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end gap-3 pt-6 pb-2">
              {revenueChart.map((item) => {
                const heightPct = Math.round((item.revenue / maxRevenue) * 100);
                return (
                  <div
                    key={item.month}
                    className="flex flex-1 flex-col items-center justify-end gap-2 h-full"
                  >
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {formatMoney(item.revenue)}
                    </span>
                    <div
                      className="w-full max-w-[44px] rounded-t-md bg-primary/85 transition-all hover:bg-primary"
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                      title={`${item.month}: ${formatMoney(item.revenue)}`}
                    />
                    <span className="text-xs text-muted-foreground">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Orders & Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>אירועים קרובים</CardTitle>
              <CardDescription>הזמנות ומנות בהכנה או באישור לימים הקרובים</CardDescription>
            </div>
            <Link
              to="/calendar"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>לוח שנה מלא</span>
              <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">אין אירועים קרובים</p>
            ) : (
              <div className="divide-y">
                {upcoming.map((order) => (
                  <div
                    key={order.orderId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">#{order.number}</span>
                        <span className="text-sm font-medium">{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {formatDateTime(order.startsAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" aria-hidden="true" />
                          {order.guests} מוזמנים
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {labels.OrderStatus[order.status] ?? order.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-normal">
                        {order.paymentState}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actionable Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>התראות מערכת</CardTitle>
            <CardDescription>חוסרי מלאי, תזכורות נהגים ופעולות דחופות</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">אין התראות חדשות</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, idx) => {
                  const cfg = alertConfig[alert.type] ?? {
                    label: alert.type,
                    variant: 'secondary' as const
                  };
                  return (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={cfg.variant} className="text-xs">
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground">{alert.message}</p>
                      </div>
                      <Link
                        to={alert.link}
                        className="shrink-0 text-xs font-medium text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        <span>מעבר</span>
                        <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

