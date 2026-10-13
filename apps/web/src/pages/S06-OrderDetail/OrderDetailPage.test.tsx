import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S06 Order Detail', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders order overview, status badge, action buttons, and allowed transitions', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/orders/order-101');

    expect(await screen.findByRole('heading', { name: /הזמנה #1045/ })).toBeInTheDocument();
    expect(screen.getByText('ערוך הזמנה')).toBeInTheDocument();
    expect(screen.getByText('צפה בהצעה')).toBeInTheDocument();
    expect(screen.getByText('שלח ללקוח')).toBeInTheDocument();
    expect(screen.getByText('שכפל')).toBeInTheDocument();

    // Event & Customer Details
    expect(screen.getByText('משפחת כהן')).toBeInTheDocument();
    expect(screen.getByText('אולם היכל שלמה, ירושלים')).toBeInTheDocument();

    // Items and Services
    expect(screen.getByText(/תפריט ומנות/)).toBeInTheDocument();
    expect(screen.getByText('סטייק פרגית במרינדה')).toBeInTheDocument();

    // Financial Breakdown
    expect(screen.getByText('סיכום כספי')).toBeInTheDocument();
    expect(screen.getByText(/מקדמה נדרשת/)).toBeInTheDocument();
  });
});
