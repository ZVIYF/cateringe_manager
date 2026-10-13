import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type {
  Supplier,
  SupplierCreate,
  SupplierUpdate,
  PurchaseOrder,
  CreatePurchaseOrderBody,
  ReceivePurchaseOrderBody,
  SendPurchaseOrderBody
} from '@catering/shared';

export interface SuppliersQueryParams {
  q?: string;
}

export interface PurchaseOrdersQueryParams {
  status?: string;
  supplierId?: string;
  page?: number;
  pageSize?: number;
}

export interface PurchaseOrdersListEnvelope {
  data: PurchaseOrder[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function useSuppliers(params: SuppliersQueryParams = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);

  const qs = search.toString();
  const path = qs ? `/suppliers?${qs}` : '/suppliers';

  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => apiFetch<{ data: Supplier[] }>(path)
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => apiFetch<{ data: Supplier }>(`/suppliers/${id}`),
    enabled: Boolean(id)
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SupplierCreate) =>
      apiFetch<{ data: Supplier }>('/suppliers', {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });
}

export function useUpdateSupplier(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SupplierUpdate) =>
      apiFetch<{ data: Supplier }>(`/suppliers/${id}`, {
        method: 'PATCH',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers', id] });
    }
  });
}

export function usePurchaseOrders(params: PurchaseOrdersQueryParams = {}) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.supplierId) search.set('supplierId', params.supplierId);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));

  const qs = search.toString();
  const path = qs ? `/purchase-orders?${qs}` : '/purchase-orders';

  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => apiFetch<PurchaseOrdersListEnvelope>(path)
  });
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => apiFetch<{ data: PurchaseOrder }>(`/purchase-orders/${id}`),
    enabled: Boolean(id)
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePurchaseOrderBody) =>
      apiFetch<{ data: PurchaseOrder }>('/purchase-orders', {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    }
  });
}

export function useCreatePOsFromShortages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { days?: number } = {}) =>
      apiFetch<{ data: PurchaseOrder[] }>('/purchase-orders/from-shortages', {
        method: 'POST',
        body: { days: body.days ?? 7 }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'forecast'] });
    }
  });
}

export function useSendPurchaseOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SendPurchaseOrderBody) =>
      apiFetch<{ data: PurchaseOrder }>(`/purchase-orders/${id}/send`, {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', id] });
    }
  });
}

export function useReceivePurchaseOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReceivePurchaseOrderBody) =>
      apiFetch<{ data: PurchaseOrder }>(`/purchase-orders/${id}/receive`, {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', id] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });
}
