import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type {
  Customer,
  CustomerCreate,
  CustomerUpdate,
  CustomerPublic,
  OrderListItem
} from '@catering/shared';

export interface CustomersQueryParams {
  q?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export interface CustomersListEnvelope {
  data: CustomerPublic[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  stats?: {
    totalCustomers: number;
    totalRevenue: number;
    openBalance: number;
  };
}

export function useCustomers(params: CustomersQueryParams = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.type) search.set('type', params.type);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));

  const qs = search.toString();
  const path = qs ? `/customers?${qs}` : '/customers';

  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => apiFetch<CustomersListEnvelope>(path)
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => apiFetch<{ data: Customer }>(`/customers/${id}`),
    enabled: Boolean(id)
  });
}

export function useCustomerOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customers', customerId, 'orders'],
    queryFn: () => apiFetch<{ data: OrderListItem[] }>(`/customers/${customerId}/orders`),
    enabled: Boolean(customerId)
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CustomerCreate) =>
      apiFetch<{ data: Customer }>('/customers', {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CustomerUpdate) =>
      apiFetch<{ data: Customer }>(`/customers/${id}`, {
        method: 'PATCH',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
    }
  });
}

