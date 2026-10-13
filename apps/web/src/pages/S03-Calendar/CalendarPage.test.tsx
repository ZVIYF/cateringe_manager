import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S03 Calendar', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders calendar title, kashrut legend, and event days', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/calendar');

    expect(await screen.findByRole('heading', { name: 'יומן אירועים' })).toBeInTheDocument();
    expect(screen.getByText('בשרי')).toBeInTheDocument();
    expect(screen.getByText('חלבי')).toBeInTheDocument();
    expect(screen.getByText('פרווה')).toBeInTheDocument();

    // Days of week in Hebrew (wait for query to resolve)
    expect(await screen.findByText('ראשון')).toBeInTheDocument();
    expect(screen.getByText('שבת')).toBeInTheDocument();

    // Events in calendar
    expect(await screen.findByText(/משפחת כהן/)).toBeInTheDocument();
  });

  it('switches to list agenda view and shows event details', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/calendar');

    const listBtn = await screen.findByRole('button', { name: 'תצוגת רשימה' });
    const user = userEvent.setup();
    await user.click(listBtn);

    expect(await screen.findByText('משפחת לוי')).toBeInTheDocument();
    expect(screen.getByText('חברת הייטק בע"מ')).toBeInTheDocument();
  });
});
