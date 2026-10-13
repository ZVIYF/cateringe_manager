import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { SettingsData, MessageTemplateItem } from '../mocks/fixtures/settings';
import type { UserPublic, CreateUserBody, UpdateUserBody } from '@catering/shared';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<{ data: SettingsData }>('/settings')
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<SettingsData>) =>
      apiFetch<{ data: SettingsData }>('/settings', {
        method: 'PATCH',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });
}

export function useMessageTemplates() {
  return useQuery({
    queryKey: ['settings', 'message-templates'],
    queryFn: () => apiFetch<{ data: MessageTemplateItem[] }>('/settings/message-templates')
  });
}

export function useUpdateMessageTemplates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: MessageTemplateItem[]) =>
      apiFetch<{ data: MessageTemplateItem[] }>('/settings/message-templates', {
        method: 'PUT',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'message-templates'] });
    }
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<{ data: UserPublic[] }>('/users')
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserBody) =>
      apiFetch<{ data: UserPublic }>('/users', {
        method: 'POST',
        body
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserBody }) =>
      apiFetch<{ data: UserPublic }>(`/users/${id}`, {
        method: 'PATCH',
        body
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    }
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ data: { message: string } }>(`/users/${id}/reset-password`, {
        method: 'POST'
      })
  });
}
