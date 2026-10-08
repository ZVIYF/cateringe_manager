import { AuthSchemas, type Role } from '@catering/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, getAccessToken, refreshSession, setAccessToken } from './client';

export type SessionUser = AuthSchemas.AuthUser;
export type Me = AuthSchemas.MeResponse['data'];
export type LoginInput = AuthSchemas.LoginBody;

export const authKeys = { me: ['auth', 'me'] as const };

const fetchMe = async (): Promise<Me> => {
  if (!getAccessToken()) await refreshSession(); // page load: cookie -> access token
  return (await apiFetch<AuthSchemas.MeResponse>('/auth/me', { schema: AuthSchemas.MeResponse })).data;
};

/** Current session. On a fresh page load this performs the refresh call first (§2). */
export const useMe = () =>
  useQuery({ queryKey: authKeys.me, queryFn: fetchMe, staleTime: 5 * 60_000, retry: false });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await apiFetch<AuthSchemas.LoginResponse>('/auth/login', {
        method: 'POST',
        body: input,
        schema: AuthSchemas.LoginResponse
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
