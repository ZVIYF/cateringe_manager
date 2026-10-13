import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type {
  Order,
  OrderListItem,
  Dish,
  Customer
} from '@catering/shared';

export interface OrdersQueryParams {
  status?: string;
  from?: string;
  to?: string;
  customerId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface OrdersListEnvelope {
  data: OrderListItem[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function useOrders(params: OrdersQueryParams = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.customerId) search.set('customerId', params.customerId);
  if (params.q) search.set('q', params.q);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));

  const qs = search.toString();
  const path = qs ? `/orders?${qs}` : '/orders';

  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => apiFetch<OrdersListEnvelope>(path)
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => apiFetch<{ data: Order }>(`/orders/${id}`),
    enabled: Boolean(id)
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { customerId: string; event: unknown }) =>
      apiFetch<{ data: Order }>('/orders', { method: 'POST', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

export function useUpdateOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { version: number; event?: unknown; pricing?: unknown }) =>
      apiFetch<{ data: Order }>(`/orders/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

export function usePutOrderItems(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      version: number;
      items: Array<{ dishId: string; qty: number; unitPrice?: number; notes?: string }>;
      overrideReason?: string;
    }) => apiFetch<{ data: Order }>(`/orders/${id}/items`, { method: 'PUT', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

export function usePutOrderServices(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      version: number;
      services: Array<{ serviceId: string; qty: number; unitPrice?: number; name?: string }>;
    }) => apiFetch<{ data: Order }>(`/orders/${id}/services`, { method: 'PUT', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

export function useTransitionOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { to: string; reason?: string }) =>
      apiFetch<{ data: Order }>(`/orders/${id}/transition`, { method: 'POST', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

export function useDuplicateOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { startsAt: string }) =>
      apiFetch<{ data: Order }>(`/orders/${id}/duplicate`, { method: 'POST', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

export function usePreviewQuote(id: string) {
  return useMutation({
    mutationFn: () => apiFetch<{ data: { pdfUrl: string } }>(`/orders/${id}/quote/preview`, { method: 'POST' })
  });
}

export function useSendQuote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { channels: string[]; message?: string }) =>
      apiFetch<{ data: { order: Order; quoteVersion: number; publicUrl: string } }>(`/orders/${id}/quote/send`, {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}

export function useDishesList(params: { kashrut?: string; category?: string; q?: string } = {}) {
  const search = new URLSearchParams();
  if (params.kashrut) search.set('kashrut', params.kashrut);
  if (params.category) search.set('category', params.category);
  if (params.q) search.set('q', params.q);
  const qs = search.toString();
  const path = qs ? `/dishes?${qs}` : '/dishes';

  return useQuery({
    queryKey: ['dishes', params],
    queryFn: () => apiFetch<{ data: Dish[] }>(path)
  });
}

export function useCustomersList(q?: string) {
  const search = new URLSearchParams();
  if (q) search.set('q', q);
  const qs = search.toString();
  const path = qs ? `/customers?${qs}` : '/customers';

  return useQuery({
    queryKey: ['customers', q],
    queryFn: () => apiFetch<{ data: Customer[] }>(path)
  });
}

