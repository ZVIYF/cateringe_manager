import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type {
  Dish,
  DishCreate,
  DishUpdate,
  DishRecipeUpdate,
  Ingredient
} from '@catering/shared';

export interface DishesQueryParams {
  kashrut?: string;
  category?: string;
  active?: boolean;
  q?: string;
}

export function useDishes(params: DishesQueryParams = {}) {
  const search = new URLSearchParams();
  if (params.kashrut) search.set('kashrut', params.kashrut);
  if (params.category) search.set('category', params.category);
  if (params.active !== undefined) search.set('active', String(params.active));
  if (params.q) search.set('q', params.q);

  const qs = search.toString();
  const path = qs ? `/dishes?${qs}` : '/dishes';

  return useQuery({
    queryKey: ['dishes', params],
    queryFn: () => apiFetch<{ data: Dish[] }>(path)
  });
}

export function useDish(id: string | undefined) {
  return useQuery({
    queryKey: ['dishes', id],
    queryFn: () => apiFetch<{ data: Dish }>(`/dishes/${id}`),
    enabled: Boolean(id) && id !== 'new'
  });
}

export function useCreateDish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DishCreate) =>
      apiFetch<{ data: Dish }>('/dishes', {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
    }
  });
}

export function useUpdateDish(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DishUpdate) =>
      apiFetch<{ data: Dish }>(`/dishes/${id}`, {
        method: 'PATCH',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['dishes', id] });
    }
  });
}

export function useUpdateDishRecipe(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DishRecipeUpdate) =>
      apiFetch<{ data: Dish }>(`/dishes/${id}/recipe`, {
        method: 'PUT',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['dishes', id] });
    }
  });
}

export function useIngredientsList(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return useQuery({
    queryKey: ['ingredients', q],
    queryFn: () => apiFetch<{ data: Ingredient[] }>(`/ingredients${qs}`)
  });
}

