import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type {
  PaymentListItem,
  OpenBalanceItem,
  CreatePaymentBody,
  CreatePaymentLinkBody,
  PaymentLinkResponse,
  RefundPaymentBody
} from '@catering/shared';

export interface PaymentsQueryParams {
  status?: string;
  method?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface PaymentsListEnvelope {
  data: PaymentListItem[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  stats?: {
    totalCollected: number;
    openBalancesTotal: number;
    overdueCount: number;
  };
}

export function usePayments(params: PaymentsQueryParams = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.method) search.set('method', params.method);
  if (params.q) search.set('q', params.q);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));

  const qs = search.toString();
  const path = qs ? `/payments?${qs}` : '/payments';

  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => apiFetch<PaymentsListEnvelope>(path)
  });
}

export function useOpenBalances() {
  return useQuery({
    queryKey: ['payments', 'open-balances'],
    queryFn: () => apiFetch<{ data: OpenBalanceItem[] }>('/payments/open-balances')
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePaymentBody) =>
      apiFetch<{ data: PaymentListItem }>('/payments', {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

export function useCreatePaymentLink() {
  return useMutation({
    mutationFn: (body: CreatePaymentLinkBody) =>
      apiFetch<{ data: PaymentLinkResponse }>('/payments/link', {
        method: 'POST',
        body
      })
  });
}

export function useRefundPayment(paymentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RefundPaymentBody) =>
      apiFetch<{ data: PaymentListItem }>(`/payments/${paymentId}/refund`, {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

