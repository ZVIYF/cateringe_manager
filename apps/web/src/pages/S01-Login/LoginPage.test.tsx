import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { errorResponse } from '@/mocks/handlers/auth';
import { server } from '@/mocks/server';
import { renderApp } from '@/test/renderApp';

beforeEach(() => {
  setAccessToken(null);
  document.cookie = 'mock_session=; path=/; max-age=0';
});

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('אימייל'), email);
  await user.type(screen.getByLabelText('סיסמה'), password);
  await user.click(screen.getByRole('button', { name: 'התחבר' }));
  return user;
}

describe('S01 Login', () => {
  it('redirects unauthenticated users from a protected route to /login', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'התחברות' })).toBeInTheDocument();
    expect(screen.getByTestId('pathname').textContent).toBe('/login');
  });

  it('shows required/format validation without calling the server', async () => {
    renderApp('/login');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'התחבר' }));
    expect(await screen.findAllByText('שדה חובה')).toHaveLength(2);

    await user.type(screen.getByLabelText('אימייל'), 'not-an-email');
    await user.type(screen.getByLabelText('סיסמה'), 'short');
    await user.click(screen.getByRole('button', { name: 'התחבר' }));
    expect(await screen.findByText('אימייל לא תקין')).toBeInTheDocument();
    expect(screen.getByText('לפחות 8 תווים')).toBeInTheDocument();
  });

  it.each([
    ['admin@dev.local', '/', 'לוח בקרה'],
    ['chef@dev.local', '/kitchen', 'מטבח'],
    ['driver@dev.local', '/driver', 'נהג']
  ])('logs %s in and lands on %s', async (email, path, heading) => {
    renderApp('/login');
    await fillAndSubmit(email, 'Passw0rd!');
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByTestId('pathname').textContent).toBe(path);
  });

  it('shows a generic error for wrong credentials', async () => {
    renderApp('/login');
    await fillAndSubmit('admin@dev.local', 'WrongPass1');
    expect(await screen.findByRole('alert')).toHaveTextContent('פרטים שגויים');
  });

  it('maps server details.fields onto form fields', async () => {
    server.use(
      http.post('*/auth/login', () => errorResponse('VALIDATION_ERROR', { email: 'האימייל תפוס' }))
    );
    renderApp('/login');
    await fillAndSubmit('admin@dev.local', 'Passw0rd!');
    expect(await screen.findByText('האימייל תפוס')).toBeInTheDocument();
    expect(screen.getByLabelText('אימייל')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a rate-limit message on 429', async () => {
    server.use(http.post('*/auth/login', () => errorResponse('RATE_LIMITED')));
    renderApp('/login');
    await fillAndSubmit('admin@dev.local', 'Passw0rd!');
    expect(await screen.findByRole('alert')).toHaveTextContent('יותר מדי ניסיונות');
  });

  it('disables the button while submitting', async () => {
    server.use(
      http.post('*/auth/login', async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json({ data: {} }, { status: 500 });
      })
    );
    renderApp('/login');
    await fillAndSubmit('admin@dev.local', 'Passw0rd!');
    await waitFor(() => expect(screen.getByRole('button', { name: 'התחבר' })).toBeDisabled());
  });

  it('restores the session on reload via refresh, and logout returns to /login', async () => {
    const first = renderApp('/login');
    await fillAndSubmit('office@dev.local', 'Passw0rd!');
    await screen.findByRole('heading', { name: 'לוח בקרה' });
    cleanup();
    first.queryClient.clear();
    setAccessToken(null); // simulates a page reload: memory is gone, cookie remains

    renderApp('/');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'יציאה' }));
    expect(await screen.findByRole('heading', { name: 'התחברות' })).toBeInTheDocument();
    expect(screen.getByTestId('pathname').textContent).toBe('/login');
  });
});
