import { DashboardSchemas } from '@catering/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';

export const dashboardKeys = {
  all: ['dashboard'] as const,
};

export const fetchDashboard = async (): Promise<DashboardSchemas.DashboardData> => {
  const res = await apiFetch<DashboardSchemas.DashboardResponse>('/dashboard', {
    schema: DashboardSchemas.DashboardResponse,
  });
  return res.data;
};

export const useDashboard = () =>
  useQuery({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboard,
    staleTime: 60_000,
  });

