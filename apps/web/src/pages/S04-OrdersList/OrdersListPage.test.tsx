import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S04 Orders List', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders order management header, status tabs, and order items table', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/orders');

    expect(await screen.findByRole('heading', { name: 'הזמנות ומכירות' })).toBeInTheDocument();
    expect(screen.getByText('הזמנה חדשה')).toBeInTheDocument();

    // Check status tabs
    expect(screen.getByText('הכל')).toBeInTheDocument();
    expect(screen.getByText('בייצור')).toBeInTheDocument();
    expect(screen.getByText('מאושרות')).toBeInTheDocument();
    expect(screen.getByText('טיוטות')).toBeInTheDocument();

    // Table rows from mock data
    expect(await screen.findByText(/משפחת כהן/)).toBeInTheDocument();
    expect(screen.getByText(/הייטק סולושנס בע"מ/)).toBeInTheDocument();
  });

  it('filters by status tab when clicked', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/orders');

    expect(await screen.findByText(/משפחת כהן/)).toBeInTheDocument();

    const user = userEvent.setup();
    const confirmedTab = screen.getByText('מאושרות');
    await user.click(confirmedTab);

    // CONFIRMED orders should be displayed
    expect(await screen.findByText(/הייטק סולושנס בע"מ/)).toBeInTheDocument();
  });
});

