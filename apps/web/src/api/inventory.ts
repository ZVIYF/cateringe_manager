import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type {
  Ingredient,
  IngredientCreate,
  IngredientUpdate,
  StockMove,
  CreateStockMoveBody,
  InventoryForecastItem
} from '@catering/shared';

export interface IngredientsQueryParams {
  q?: string;
  category?: string;
  belowMin?: boolean;
}

export interface StockMovesQueryParams {
  ingredientId?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export interface StockMovesListEnvelope {
  data: StockMove[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function useIngredients(params: IngredientsQueryParams = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.category) search.set('category', params.category);
  if (params.belowMin !== undefined) search.set('belowMin', String(params.belowMin));

  const qs = search.toString();
  const path = qs ? `/ingredients?${qs}` : '/ingredients';

  return useQuery({
    queryKey: ['ingredients', params],
    queryFn: () => apiFetch<{ data: Ingredient[] }>(path)
  });
}

export function useIngredient(id: string | undefined) {
  return useQuery({
    queryKey: ['ingredients', id],
    queryFn: () => apiFetch<{ data: Ingredient }>(`/ingredients/${id}`),
    enabled: Boolean(id)
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: IngredientCreate) =>
      apiFetch<{ data: Ingredient }>('/ingredients', {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    }
  });
}

export function useUpdateIngredient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: IngredientUpdate) =>
      apiFetch<{ data: Ingredient }>(`/ingredients/${id}`, {
        method: 'PATCH',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients', id] });
    }
  });
}

export function useInventoryForecast(days = 7) {
  return useQuery({
    queryKey: ['inventory', 'forecast', days],
    queryFn: () =>
      apiFetch<{ data: InventoryForecastItem[]; meta: { from: string; to: string } }>(
        `/inventory/forecast?days=${days}`
      )
  });
}

export function useStockMoves(params: StockMovesQueryParams = {}) {
  const search = new URLSearchParams();
  if (params.ingredientId) search.set('ingredientId', params.ingredientId);
  if (params.type) search.set('type', params.type);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));

  const qs = search.toString();
  const path = qs ? `/inventory/moves?${qs}` : '/inventory/moves';

  return useQuery({
    queryKey: ['inventory', 'moves', params],
    queryFn: () => apiFetch<StockMovesListEnvelope>(path)
  });
}

export function useCreateStockMove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateStockMoveBody) =>
      apiFetch<{ data: StockMove }>('/inventory/moves', {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    }
  });
}
