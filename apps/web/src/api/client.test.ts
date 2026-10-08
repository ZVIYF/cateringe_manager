import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { errorResponse } from '@/mocks/handlers/auth';
import { apiFetch, ApiClientError, getAccessToken, setAccessToken, setUnauthenticatedHandler } from './client';

beforeEach(() => setAccessToken(null));
afterEach(() => setUnauthenticatedHandler(null));

describe('apiFetch', () => {
  it('refreshes once for concurrent TOKEN_EXPIRED responses and retries each request', async () => {
    let refreshCalls = 0;
    server.use(
      http.post('*/auth/refresh', () => {
        refreshCalls++;
        return HttpResponse.json({ data: { accessToken: 'fresh', user: {} } });
      }),
      http.get('*/things', ({ request }) =>
        request.headers.get('Authorization') === 'Bearer fresh'
          ? HttpResponse.json({ data: ['ok'] })
          : errorResponse('TOKEN_EXPIRED')
      )
    );
    setAccessToken('stale');

    const results = await Promise.all([1, 2, 3].map(() => apiFetch<{ data: string[] }>('/things')));

    expect(results.every((r) => r.data[0] === 'ok')).toBe(true);
    expect(refreshCalls).toBe(1);
    expect(getAccessToken()).toBe('fresh');
  });

  it('clears the token and notifies on UNAUTHENTICATED', async () => {
    const handler = vi.fn();
    setUnauthenticatedHandler(handler);
    server.use(http.get('*/things', () => errorResponse('UNAUTHENTICATED')));
    setAccessToken('bad');

    await expect(apiFetch('/things')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(handler).toHaveBeenCalledOnce();
    expect(getAccessToken()).toBeNull();
  });

  it('notifies when the refresh itself fails', async () => {
    const handler = vi.fn();
    setUnauthenticatedHandler(handler);
    server.use(
      http.get('*/things', () => errorResponse('TOKEN_EXPIRED')),
      http.post('*/auth/refresh', () => errorResponse('UNAUTHENTICATED'))
    );
    setAccessToken('stale');

    await expect(apiFetch('/things')).rejects.toBeInstanceOf(ApiClientError);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not redirect on a failed login (auth paths skip the 401 handling)', async () => {
    const handler = vi.fn();
    setUnauthenticatedHandler(handler);

    await expect(
      apiFetch('/auth/login', { method: 'POST', body: { email: 'admin@dev.local', password: 'wrong-password' } })
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED', status: 401 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('exposes field errors from details.fields', async () => {
    await expect(
      apiFetch('/auth/login', { method: 'POST', body: { email: 'nope', password: 'x' } })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', fields: { email: expect.any(String) } });
  });

  it('never writes the token to web storage', async () => {
    await apiFetch('/auth/login', {
      method: 'POST',
      body: { email: 'admin@dev.local', password: 'Passw0rd!' }
    });
    setAccessToken('secret-token');
    expect(JSON.stringify({ ...localStorage })).not.toContain('secret-token');
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('secret-token');
  });
});
