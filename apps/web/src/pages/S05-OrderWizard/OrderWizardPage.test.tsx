import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S05 Order Wizard', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders creation wizard with 4 steps and customer select', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/orders/new');

    expect(await screen.findByRole('heading', { name: 'אשף פתיחת הזמנה חדשה' })).toBeInTheDocument();
    expect(screen.getByText('פרטי אירוע ולקוח')).toBeInTheDocument();
    expect(screen.getByText('תפריט ומנות')).toBeInTheDocument();
    expect(screen.getByText('שירותים וציוד')).toBeInTheDocument();
    expect(screen.getByText('תמחור ותנאים')).toBeInTheDocument();

    // Check step 1 inputs
    expect(screen.getByText('-- בחר לקוח --')).toBeInTheDocument();
    expect(screen.getByText('כתובת האירוע / מקום *')).toBeInTheDocument();
    expect(screen.getByText('סיכום הזמנה חי')).toBeInTheDocument();
  });

  it('renders edit mode with existing order details prefilled', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/orders/order-101/edit');

    expect(await screen.findByRole('heading', { name: /עריכת הזמנה #1045/ })).toBeInTheDocument();
    expect(screen.getByDisplayValue('בר מצווה — יונתן')).toBeInTheDocument();
  });
});
