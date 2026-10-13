import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type {
  PublicQuote,
  ApproveQuoteBody,
  ApproveQuoteResponse
} from '@catering/shared';

export function usePublicQuote(token: string | undefined) {
  return useQuery({
    queryKey: ['public-quote', token],
    queryFn: () => apiFetch<{ data: PublicQuote }>(`/public/quotes/${token}`),
    enabled: Boolean(token)
  });
}

export function useApprovePublicQuote(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ApproveQuoteBody) =>
      apiFetch<{ data: ApproveQuoteResponse }>(`/public/quotes/${token}/approve`, {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-quote', token] });
    }
  });
}

export function useRequestQuoteChange(token: string) {
  return useMutation({
    mutationFn: (body: { message: string }) =>
      apiFetch<void>(`/public/quotes/${token}/request-change`, {
        method: 'POST',
        body
      })
  });
}

