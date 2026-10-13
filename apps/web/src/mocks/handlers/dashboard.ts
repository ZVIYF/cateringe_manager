import { DashboardSchemas } from '@catering/shared';
import { http, HttpResponse } from 'msw';
import { mockDashboardData, mockCalendarOrders } from '../fixtures/dashboard';
import { mockUsers } from '../fixtures/auth';

const TOKEN_PREFIX = 'mock-access-';
const userFromToken = (header: string | null) => {
  const id = header?.replace(`Bearer ${TOKEN_PREFIX}`, '');
  return mockUsers.find((u) => u.id === id);
};

export const dashboardHandlers = [
  http.get('*/dashboard', ({ request }) => {
    const user = userFromToken(request.headers.get('Authorization'));
    // If user is OFFICE, omit revenueThisMonth and revenueChart per §5.9
    const isOffice = user?.role === 'OFFICE';

    const responseData: DashboardSchemas.DashboardData = {
      ...mockDashboardData,
      kpis: {
        ...mockDashboardData.kpis,
        revenueThisMonth: isOffice ? undefined : mockDashboardData.kpis.revenueThisMonth,
      },
      revenueChart: isOffice ? undefined : mockDashboardData.revenueChart,
    };

    return HttpResponse.json<DashboardSchemas.DashboardResponse>({
      data: responseData,
    });
  }),

  http.get('*/orders', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('view') === 'calendar') {
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      let filtered = mockCalendarOrders;
      if (from && to) {
        filtered = mockCalendarOrders.filter((o) => {
          const d = o.startsAt.slice(0, 10);
          return d >= from && d <= to;
        });
      }
      return HttpResponse.json<DashboardSchemas.CalendarViewResponse>({
        data: filtered,
      });
    }

    return HttpResponse.json({ data: [] });
  }),
];

