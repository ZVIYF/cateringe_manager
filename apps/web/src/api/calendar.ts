import { DashboardSchemas } from '@catering/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';

export const calendarKeys = {
  range: (from: string, to: string) => ['calendar', from, to] as const,
};

export const fetchCalendarOrders = async (
  from: string,
  to: string
): Promise<DashboardSchemas.CalendarOrderItem[]> => {
  const res = await apiFetch<DashboardSchemas.CalendarViewResponse>(
    `/orders?view=calendar&from=${from}&to=${to}`,
    {
      schema: DashboardSchemas.CalendarViewResponse,
    }
  );
  return res.data;
};

export const useCalendarOrders = (from: string, to: string) =>
  useQuery({
    queryKey: calendarKeys.range(from, to),
    queryFn: () => fetchCalendarOrders(from, to),
    enabled: Boolean(from && to),
    staleTime: 60_000,
  });

