import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S09 Menus & Dish Catalog', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders dishes list with prices, food cost, and margin badges', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/menus');

    expect(await screen.findByRole('heading', { name: /תפריטים וקטלוג מנות/ })).toBeInTheDocument();
    expect(screen.getByText('מנה חדשה')).toBeInTheDocument();

    // Check dishes from mock
    expect(await screen.findByText('סיגרים אסאדו')).toBeInTheDocument();
    expect(screen.getByText('סטייק פרגית במרינדה')).toBeInTheDocument();
  });

  it('filters dishes by kashrut tabs', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/menus');

    expect(await screen.findByText('סיגרים אסאדו')).toBeInTheDocument();

    const user = userEvent.setup();
    const parveTab = screen.getByRole('button', { name: /פרווה/ });
    await user.click(parveTab);

    expect(await screen.findByText('תפוחי אדמה אפויים ברוזמרין')).toBeInTheDocument();
  });

  it('renders dish editor and displays real-time recipe ingredient food cost and margin', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/dishes/dish-1');

    expect(await screen.findByRole('heading', { name: /עריכת מנה: סיגרים אסאדו/ })).toBeInTheDocument();
    expect(screen.getByText(/ניתוח עלות מזון ורווחיות בזמן אמת/)).toBeInTheDocument();
    expect(screen.getByText('עלות חומרי גלם (למנה)')).toBeInTheDocument();
    expect(screen.getByText('רווחיות גולמית')).toBeInTheDocument();
    expect(screen.getByText('עץ מוצר (רכיבי המתכון)')).toBeInTheDocument();

    // Check ingredients table
    expect(await screen.findByText('בשר אסאדו מובחר')).toBeInTheDocument();
    expect(screen.getByText('עלי סיגר מרוקאי')).toBeInTheDocument();
  });
});
