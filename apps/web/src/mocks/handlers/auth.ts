import { errorStatus, type ErrorCode } from '@catering/shared';
import { http, HttpResponse } from 'msw';
import { mockPassword, mockPermissions, mockUsers } from '../fixtures/auth';

const COOKIE = 'mock_session';
const TOKEN_PREFIX = 'mock-access-';

const messages: Partial<Record<ErrorCode, string>> = {
  VALIDATION_ERROR: 'שדות לא תקינים',
  UNAUTHENTICATED: 'פרטים שגויים',
  TOKEN_EXPIRED: 'פג תוקף ההתחברות',
  RATE_LIMITED: 'יותר מדי בקשות',
  INTERNAL_ERROR: 'שגיאה בשרת'
};

export function errorResponse(code: ErrorCode, fields?: Record<string, string>) {
  return HttpResponse.json(
    {
      error: {
        code,
        message: messages[code] ?? code,
        details: fields ? { fields } : {},
        requestId: 'req_mock'
      }
    },
    { status: errorStatus[code] }
  );
}

// `?__mockError=<CODE>` makes the next mocked request fail (once).
let pendingError: ErrorCode | null | undefined;
function takeMockError(): ErrorCode | null {
  if (pendingError === undefined) {
    const code = new URLSearchParams(globalThis.location?.search ?? '').get('__mockError');
    pendingError = (code as ErrorCode | null) ?? null;
  }
  const code = pendingError;
  pendingError = null;
  return code;
}

// The httpOnly refresh cookie is stood in for by a plain cookie holding the user id.
const readSession = () => document.cookie.match(new RegExp(`${COOKIE}=([^;]+)`))?.[1] ?? null;
const writeSession = (value: string | null, rememberMe = false) => {
  document.cookie = value
    ? `${COOKIE}=${value}; path=/; max-age=${rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7}`
    : `${COOKIE}=; path=/; max-age=0`;
};

const userFromToken = (header: string | null) => {
  const id = header?.replace(`Bearer ${TOKEN_PREFIX}`, '');
  return mockUsers.find((u) => u.id === id);
};

export const authHandlers = [
  http.post('*/auth/login', async ({ request }) => {
    const injected = takeMockError();
    if (injected) {
      return errorResponse(injected, injected === 'VALIDATION_ERROR' ? { email: 'אימייל לא תקין' } : undefined);
    }
    const body = (await request.json()) as { email?: string; password?: string; rememberMe?: boolean };
    const fields: Record<string, string> = {};
    if (!body.email?.includes('@')) fields.email = 'אימייל לא תקין';
    if (!body.password || body.password.length < 8) fields.password = 'לפחות 8 תווים';
    if (Object.keys(fields).length) return errorResponse('VALIDATION_ERROR', fields);

    const user = mockUsers.find((u) => u.email === body.email);
    if (!user || body.password !== mockPassword) return errorResponse('UNAUTHENTICATED');
    writeSession(user.id, body.rememberMe);
    return HttpResponse.json({ data: { accessToken: TOKEN_PREFIX + user.id, user } });
  }),

  http.post('*/auth/refresh', () => {
    const user = mockUsers.find((u) => u.id === readSession());
    if (!user) return errorResponse('UNAUTHENTICATED');
    return HttpResponse.json({ data: { accessToken: TOKEN_PREFIX + user.id, user } });
  }),

  http.get('*/auth/me', ({ request }) => {
    const injected = takeMockError();
    if (injected) return errorResponse(injected);
    const user = userFromToken(request.headers.get('Authorization'));
    if (!user) return errorResponse('UNAUTHENTICATED');
    return HttpResponse.json({ data: { user, permissions: mockPermissions[user.role] } });
  }),

  http.post('*/auth/logout', () => {
    writeSession(null);
    return new HttpResponse(null, { status: 204 });
  })
];
