import { ApiErrorSchema, type ErrorCode } from '@catering/shared';

const BASE_URL: string = import.meta.env.VITE_API_URL ?? '/api/v1';

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode | 'NETWORK_ERROR' | 'UNKNOWN',
    message: string,
    public readonly fields: Record<string, string> = {},
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// Access token lives in memory only (never localStorage/sessionStorage).
let accessToken: string | null = null;
let onUnauthenticated: (() => void) | null = null;
let refreshInFlight: Promise<unknown> | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const setUnauthenticatedHandler = (handler: (() => void) | null) => {
  onUnauthenticated = handler;
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Zod-like schema applied to the full response in development. */
  schema?: { parse: (value: unknown) => unknown };
  signal?: AbortSignal;
}

async function toError(res: Response): Promise<ApiClientError> {
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return new ApiClientError(res.status, 'UNKNOWN', res.statusText);
  }
  const parsed = ApiErrorSchema.safeParse(json);
  if (!parsed.success) return new ApiClientError(res.status, 'UNKNOWN', res.statusText);
  const { code, message, details, requestId } = parsed.data.error;
  return new ApiClientError(res.status, code, message, details?.fields ?? {}, requestId);
}

async function send(path: string, { method = 'GET', body, signal }: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  try {
    return await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
      signal
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiClientError(0, 'NETWORK_ERROR', 'שגיאת תקשורת');
  }
}

async function parse<T>(res: Response, schema: RequestOptions['schema']): Promise<T> {
  if (res.status === 204) return undefined as T;
  const json: unknown = await res.json();
  if (import.meta.env.DEV && schema) schema.parse(json);
  return json as T;
}

/**
 * Exchanges the httpOnly refresh cookie for a new access token. Concurrent
 * callers share one in-flight request. Returns the `data` payload.
 */
export function refreshSession<T = unknown>(): Promise<T> {
  refreshInFlight ??= (async () => {
    const res = await send('/auth/refresh', { method: 'POST' });
    if (!res.ok) throw await toError(res);
    const { data } = (await res.json()) as { data: { accessToken: string } };
    accessToken = data.accessToken;
    return data;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight as Promise<T>;
}

/** Fetch wrapper returning the full response envelope (`{ data }` / `{ data, meta }`). */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isAuthPath = path.startsWith('/auth/');
  let res = await send(path, options);

  if (res.status === 401 && !isAuthPath) {
    let err = await toError(res);
    if (err.code === 'TOKEN_EXPIRED') {
      try {
        await refreshSession();
        res = await send(path, options); // retry once
        if (res.ok) return parse<T>(res, options.schema);
        err = await toError(res);
      } catch (refreshErr) {
        err = refreshErr instanceof ApiClientError ? refreshErr : err;
      }
    }
    if (err.status === 401) {
      accessToken = null;
      onUnauthenticated?.();
    }
    throw err;
  }

  if (!res.ok) throw await toError(res);
  return parse<T>(res, options.schema);
}
