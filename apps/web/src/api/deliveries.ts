import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type {
  Delivery,
  UpdateDeliveryBody,
  StartDeliveryResponse,
  CompleteDeliveryBody,
  CompleteDeliveryResponse
} from '@catering/shared';

export interface DeliveriesQueryParams {
  date?: string;
  driverId?: string;
  status?: string;
}

export function useDeliveries(params: DeliveriesQueryParams = {}) {
  const search = new URLSearchParams();
  if (params.date) search.set('date', params.date);
  if (params.driverId) search.set('driverId', params.driverId);
  if (params.status) search.set('status', params.status);

  const qs = search.toString();
  const path = qs ? `/deliveries?${qs}` : '/deliveries';

  return useQuery({
    queryKey: ['deliveries', params],
    queryFn: () => apiFetch<{ data: Delivery[] }>(path)
  });
}

export function useDriverDeliveriesToday() {
  return useQuery({
    queryKey: ['driver', 'deliveries', 'today'],
    queryFn: () => apiFetch<{ data: Delivery[] }>('/driver/deliveries/today')
  });
}

export function useDelivery(id: string | undefined) {
  return useQuery({
    queryKey: ['deliveries', id],
    queryFn: () => apiFetch<{ data: Delivery }>(`/deliveries/${id}`),
    enabled: Boolean(id)
  });
}

export function useUpdateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateDeliveryBody }) =>
      apiFetch<{ data: Delivery }>(`/deliveries/${id}`, {
        method: 'PATCH',
        body
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['driver', 'deliveries'] });
    }
  });
}

export function useStartDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<StartDeliveryResponse>(`/deliveries/${id}/start`, {
        method: 'POST'
      }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries', id] });
      queryClient.invalidateQueries({ queryKey: ['driver', 'deliveries'] });
    }
  });
}

export function useCompleteDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CompleteDeliveryBody }) =>
      apiFetch<CompleteDeliveryResponse>(`/deliveries/${id}/complete`, {
        method: 'POST',
        body
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['driver', 'deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}
