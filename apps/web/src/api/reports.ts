import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';
import type {
  RevenueReportItem,
  ProfitabilityReportItem,
  TopDishReportItem,
  ConversionReport
} from '@catering/shared';

export interface ReportsFilterParams {
  from?: string;
  to?: string;
  groupBy?: 'month' | 'week' | 'day';
}

export function useRevenueReport(params: ReportsFilterParams = {}) {
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.groupBy) search.set('groupBy', params.groupBy);

  const qs = search.toString();
  const path = qs ? `/reports/revenue?${qs}` : '/reports/revenue';

  return useQuery({
    queryKey: ['reports', 'revenue', params],
    queryFn: () => apiFetch<{ data: RevenueReportItem[] }>(path)
  });
}

export function useProfitabilityReport(params: ReportsFilterParams = {}) {
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);

  const qs = search.toString();
  const path = qs ? `/reports/profitability?${qs}` : '/reports/profitability';

  return useQuery({
    queryKey: ['reports', 'profitability', params],
    queryFn: () => apiFetch<{ data: ProfitabilityReportItem[] }>(path)
  });
}

export function useTopDishesReport(params: ReportsFilterParams = {}) {
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);

  const qs = search.toString();
  const path = qs ? `/reports/top-dishes?${qs}` : '/reports/top-dishes';

  return useQuery({
    queryKey: ['reports', 'top-dishes', params],
    queryFn: () => apiFetch<{ data: TopDishReportItem[] }>(path)
  });
}

export function useConversionReport(params: ReportsFilterParams = {}) {
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);

  const qs = search.toString();
  const path = qs ? `/reports/conversion?${qs}` : '/reports/conversion';

  return useQuery({
    queryKey: ['reports', 'conversion', params],
    queryFn: () => apiFetch<{ data: ConversionReport }>(path)
  });
}

