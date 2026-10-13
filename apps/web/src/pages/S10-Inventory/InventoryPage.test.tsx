import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S10 Inventory & Forecasting', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders inventory ledger, stats and items', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/inventory');

    expect(await screen.findByRole('heading', { name: /ניהול מלאי ותחזית חוסרים/ })).toBeInTheDocument();
    expect(screen.getByText('רישום תנועת מלאי')).toBeInTheDocument();
    expect(screen.getByText('חומר גלם חדש')).toBeInTheDocument();

    // Check mock ingredients in table
    expect(await screen.findByText('פרגית טרייה')).toBeInTheDocument();
    expect(screen.getByText('בשר אסאדו מובחר')).toBeInTheDocument();
    expect(screen.getByText('תפוחי אדמה')).toBeInTheDocument();
  });

  it('navigates to shortage forecast tab and displays shortages', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/inventory');

    const forecastButton = await screen.findByText(/תחזית חוסרים ל-7 ימים/);
    const user = userEvent.setup();
    await user.click(forecastButton);

    // Verify forecast button and table columns are displayed
    expect(await screen.findByText(/הפק הזמנות רכש מרוכזות מחוסרים/)).toBeInTheDocument();
    expect(screen.getByText('חסר לגיוס')).toBeInTheDocument();
  });

  it('switches to stock movements history tab', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/inventory');

    const movesButton = await screen.findByText('יומן תנועות מלאי');
    const user = userEvent.setup();
    await user.click(movesButton);

    expect(await screen.findByText('סיבה והערות')).toBeInTheDocument();
    expect(await screen.findByText('קבלת סחורה מהזמנת רכש #5000')).toBeInTheDocument();
  });
});
