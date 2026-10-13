import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S12 Kitchen Tablet Display', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders kitchen tablet board with quick dates and tasks', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/kitchen');

    expect(await screen.findByRole('heading', { name: 'מטבח' })).toBeInTheDocument();
    expect(screen.getByText('היום')).toBeInTheDocument();
    expect(screen.getByText('מחר')).toBeInTheDocument();
    expect(screen.getByText('דף ייצור')).toBeInTheDocument();

    // Check mock tasks appear
    expect(await screen.findByText('סיגרים אסאדו')).toBeInTheDocument();
    expect(screen.getByText('סטייק פרגית במרינדה')).toBeInTheDocument();
    expect(screen.getByText('תפוחי אדמה אפויים ברוזמרין')).toBeInTheDocument();
  });

  it('filters kitchen tasks by kashrut', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/kitchen');

    expect(await screen.findByText('סיגרים אסאדו')).toBeInTheDocument();

    const user = userEvent.setup();
    const parveButton = screen.getByRole('button', { name: /פרווה/ });
    await user.click(parveButton);

    expect(await screen.findByText('תפוחי אדמה אפויים ברוזמרין')).toBeInTheDocument();
    expect(screen.queryByText('סיגרים אסאדו')).not.toBeInTheDocument();
  });

  it('expands order breakdown for a task', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/kitchen');

    const expandButtons = await screen.findAllByRole('button', { name: /פירוט הזמנות/ });
    const user = userEvent.setup();
    await user.click(expandButtons[0]);

    // Check that customer/order name is displayed
    expect(await screen.findByText(/משפחת כהן/)).toBeInTheDocument();
  });
});
