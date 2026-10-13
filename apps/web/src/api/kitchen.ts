import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type {
  KitchenTask,
  KitchenTaskUpdate,
  ProductionSheetResponse
} from '@catering/shared';

export function useKitchenTasks(date: string) {
  return useQuery({
    queryKey: ['kitchen', 'tasks', date],
    queryFn: () => apiFetch<{ data: KitchenTask[] }>(`/kitchen/tasks?date=${date}`),
    enabled: Boolean(date)
  });
}

export function useUpdateKitchenTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: KitchenTaskUpdate }) =>
      apiFetch<{ data: KitchenTask }>(`/kitchen/tasks/${id}`, {
        method: 'PATCH',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen', 'tasks'] });
    }
  });
}

export function useProductionSheet(date: string) {
  return useQuery({
    queryKey: ['kitchen', 'production-sheet', date],
    queryFn: () => apiFetch<ProductionSheetResponse>(`/kitchen/production-sheet?date=${date}`),
    enabled: Boolean(date)
  });
}
