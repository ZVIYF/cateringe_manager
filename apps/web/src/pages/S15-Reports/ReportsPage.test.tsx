import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S15 Executive Reports & Business Analytics', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders executive reports overview and revenue YoY analytics tab', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/reports');

    expect(await screen.findByRole('heading', { name: /דוחות מנהלים וניתוח עסקי/ })).toBeInTheDocument();
    expect(await screen.findByText(/השוואת הכנסות חודשית/)).toBeInTheDocument();
    expect(await screen.findByText('הכנסות השנה')).toBeInTheDocument();
    expect(await screen.findByText('הכנסות אשתקד')).toBeInTheDocument();

    // Check KPI cards
    expect(screen.getByText('סה״כ הכנסות בתקופה')).toBeInTheDocument();
    expect(screen.getByText('סה״כ אירועים שבוצעו')).toBeInTheDocument();
    expect(screen.getByText('יחס המרת הצעות מחיר')).toBeInTheDocument();
  });

  it('switches between report tabs: profitability, top dishes, and quote conversion', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/reports');

    expect(await screen.findByRole('heading', { name: /דוחות מנהלים וניתוח עסקי/ })).toBeInTheDocument();

    const user = userEvent.setup();

    // 1. Switch to Profitability tab
    const profitTab = screen.getByRole('button', { name: /רווחיות אירועים/ });
    await user.click(profitTab);

    expect(await screen.findByText('עלות חומרי גלם')).toBeInTheDocument();
    expect(await screen.findByText('רווח גולמי')).toBeInTheDocument();
    expect(await screen.findByText('שיעור רווחיות')).toBeInTheDocument();

    // 2. Switch to Top Dishes tab
    const dishesTab = screen.getByRole('button', { name: /מנות מובילות/ });
    await user.click(dishesTab);

    expect((await screen.findAllByText('סיגרים אסאדו מובחר')).length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('שם המנה')).toBeInTheDocument();

    // 3. Switch to Quote Conversion tab
    const convTab = screen.getByRole('button', { name: /משפך המרות/ });
    await user.click(convTab);

    expect(await screen.findByText(/משפך המרת הצעות מחיר/)).toBeInTheDocument();
    expect(await screen.findByText(/יחס המרה כולל:/)).toBeInTheDocument();
  });
});
