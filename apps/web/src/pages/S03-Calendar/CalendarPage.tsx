import { useState, useMemo } from 'react';
import { labels, type Kashrut, type DashboardSchemas } from '@catering/shared';
import {
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Users,
  Clock,
  List,
  Grid,
  AlertCircle
} from 'lucide-react';
import { useCalendarOrders } from '@/api/calendar';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const MONTH_NAMES = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר'
];

const WEEK_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const kashrutConfig: Record<
  Kashrut,
  { label: string; variant: 'meat' | 'dairy' | 'parve'; dotClass: string }
> = {
  MEAT: { label: 'בשרי', variant: 'meat', dotClass: 'bg-red-500' },
  DAIRY: { label: 'חלבי', variant: 'dairy', dotClass: 'bg-blue-500' },
  PARVE: { label: 'פרווה', variant: 'parve', dotClass: 'bg-emerald-500' }
};

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const startDayOfWeek = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);

  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const { data: events = [], isPending, error } = useCalendarOrders(from, to);

  // Group events by day of month (1..31)
  const eventsByDay = useMemo(() => {
    const map = new Map<number, DashboardSchemas.CalendarOrderItem[]>();
    for (const ev of events) {
      if (!ev.startsAt) continue;
      const dayNum = parseInt(ev.startsAt.slice(8, 10), 10);
      if (!isNaN(dayNum)) {
        const list = map.get(dayNum) ?? [];
        list.push(ev);
        map.set(dayNum, list);
      }
    }
    return map;
  }, [events]);

  const handlePrevMonth = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const selectedDayEvents = selectedDay ? eventsByDay.get(selectedDay) ?? [] : [];

  return (
    <div className="space-y-6">
      {/* Calendar Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">יומן אירועים</h1>
          <p className="text-sm text-muted-foreground">תצוגת אירועים, זמנים וחלוקת כשרות</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">כשרות:</span>
          <Badge variant="meat" className="gap-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
            בשרי
          </Badge>
          <Badge variant="dairy" className="gap-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
            חלבי
          </Badge>
          <Badge variant="parve" className="gap-1 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            פרווה
          </Badge>
        </div>
      </div>

      {/* Month Navigation & View Toggle */}
      <Card>
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between border-b">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-xl">
              {MONTH_NAMES[month]} {year}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border p-1 bg-muted/40">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setViewMode('grid')}
                aria-label="תצוגת לוח"
              >
                <Grid className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="mr-1 hidden sm:inline">לוח</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setViewMode('list')}
                aria-label="תצוגת רשימה"
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="mr-1 hidden sm:inline">רשימה</span>
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={handleToday} className="text-xs">
              היום
            </Button>
            {/* RTL: Prev month is right arrow, Next month is left arrow */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              aria-label="חודש קודם"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              aria-label="חודש הבא"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isPending ? (
            <div className="space-y-4" aria-busy="true" aria-label="טוען אירועים">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-md" />
                ))}
              </div>
            </div>
          ) : error ? (
            <Alert className="max-w-xl">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <span>שגיאה בטעינת לוח האירועים. נסו לרענן את העמוד.</span>
            </Alert>
          ) : viewMode === 'list' ? (
            /* List Agenda View */
            <div className="space-y-4">
              {events.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  אין אירועים בחודש זה
                </p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {events.map((ev) => {
                    const kConfig = kashrutConfig[ev.kashrut] ?? kashrutConfig.PARVE;
                    const dateStr = ev.startsAt ? new Date(ev.startsAt).toLocaleDateString('he-IL', { dateStyle: 'full' }) : '';
                    return (
                      <div
                        key={ev.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">#{ev.number}</span>
                            <span className="font-medium text-sm">{ev.customerName}</span>
                            <Badge variant={kConfig.variant} className="text-xs">
                              {kConfig.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>{dateStr}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {formatTime(ev.startsAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" aria-hidden="true" />
                              {ev.guests} מוזמנים
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {labels.OrderStatus[ev.status] ?? ev.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Month Grid View */
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground pb-2 border-b">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Empty padding cells for start of month */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[80px] sm:min-h-[110px] rounded-md border border-dashed border-muted/50 bg-muted/10 p-1 opacity-50"
                  />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = eventsByDay.get(day) ?? [];
                  const isCurrentDay =
                    today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === day;
                  const isSelected = selectedDay === day;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                      className={`min-h-[80px] sm:min-h-[110px] rounded-md border p-1 sm:p-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                          : isCurrentDay
                          ? 'border-primary/50 bg-muted/30'
                          : 'hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1">
                        <span
                          className={`text-xs font-semibold ${
                            isCurrentDay
                              ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {dayEvents.length} אירועים
                          </span>
                        )}
                      </div>

                      {/* Event items in day cell */}
                      <div className="space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((ev) => {
                          const kConfig = kashrutConfig[ev.kashrut] ?? kashrutConfig.PARVE;
                          return (
                            <div
                              key={ev.id}
                              className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                                ev.kashrut === 'MEAT'
                                  ? 'bg-red-50 text-red-900 border-red-200'
                                  : ev.kashrut === 'DAIRY'
                                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              }`}
                              title={`#${ev.number} ${ev.customerName} (${kConfig.label}) - ${formatTime(
                                ev.startsAt
                              )}`}
                            >
                              <span className="font-semibold">#{ev.number}</span> {ev.customerName}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-muted-foreground font-semibold px-1">
                            +{dayEvents.length - 3} נוספים
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Day Details Panel */}
              {selectedDay !== null && (
                <div className="mt-6 rounded-lg border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-sm">
                      אירועים ליום {selectedDay} ב{MONTH_NAMES[month]} {year}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setSelectedDay(null)}
                    >
                      סגור
                    </Button>
                  </div>

                  {selectedDayEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      אין אירועים רשומים ליום זה
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayEvents.map((ev) => {
                        const kConfig = kashrutConfig[ev.kashrut] ?? kashrutConfig.PARVE;
                        return (
                          <div
                            key={ev.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border bg-background p-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">#{ev.number}</span>
                                <span className="font-medium text-sm">{ev.customerName}</span>
                                <Badge variant={kConfig.variant} className="text-xs">
                                  {kConfig.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" aria-hidden="true" />
                                  {formatTime(ev.startsAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" aria-hidden="true" />
                                  {ev.guests} מוזמנים
                                </span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="w-fit">
                              {labels.OrderStatus[ev.status] ?? ev.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

