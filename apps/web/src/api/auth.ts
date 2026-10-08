import type { Role } from '@catering/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, getAccessToken, refreshSession, setAccessToken } from './client';

// TODO(api-request #4): no User/Me/Login Zod schemas exist in @catering/shared yet.
// These local types mirror API_CONTRACT.md §2.2 only; replace with the shared schemas
// (and parse responses with them) once the backend adds them.
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface Me {
  user: SessionUser;
  permissions: string[];
}
export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export const authKeys = { me: ['auth', 'me'] as const };

const fetchMe = async (): Promise<Me> => {
  if (!getAccessToken()) await refreshSession(); // page load: cookie -> access token
  return (await apiFetch<{ data: Me }>('/auth/me')).data;
};

/** Current session. On a fresh page load this performs the refresh call first (§2). */
export const useMe = () =>
  useQuery({ queryKey: authKeys.me, queryFn: fetchMe, staleTime: 5 * 60_000, retry: false });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await apiFetch<{ data: { accessToken: string; user: SessionUser } }>('/auth/login', {
        method: 'POST',
        body: input
      });
      setAccessToken(data.accessToken);
      return qc.fetchQuery({ queryKey: authKeys.me, queryFn: fetchMe, staleTime: 0 });
    }
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      setAccessToken(null);
      qc.clear();
    }
  });
};

/** Landing page per role (S01). */
export const homePathForRole = (role: Role): string => {
  switch (role) {
    case 'DRIVER':
      return '/driver';
    case 'KITCHEN_MANAGER':
    case 'KITCHEN_STAFF':
      return '/kitchen';
    default:
      return '/';
  }
};
