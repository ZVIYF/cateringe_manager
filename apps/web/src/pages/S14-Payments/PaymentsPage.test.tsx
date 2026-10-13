import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S14 Payments & Billing', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders payments ledger, stats, and overdue balances', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/payments');

    expect(await screen.findByRole('heading', { name: /תשלומים, קבלות ויתרות לגבייה/ })).toBeInTheDocument();
    expect(screen.getByText('רישום תשלום')).toBeInTheDocument();
    expect(screen.getByText('קישור לתשלום')).toBeInTheDocument();

    // Check overdue balances section
    expect(await screen.findByText(/הזמנות עם יתרת חוב פתוחה/)).toBeInTheDocument();
    expect(screen.getAllByText('משפחת כהן').length).toBeGreaterThanOrEqual(1);

    // Check payments ledger rows
    expect((await screen.findAllByText('הושלם')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('העברה')).toBeInTheDocument();
  });

  it('opens manual payment registration modal', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/payments');

    expect(await screen.findByRole('heading', { name: /תשלומים, קבלות ויתרות לגבייה/ })).toBeInTheDocument();

    const user = userEvent.setup();
    const payBtn = screen.getByText('רישום תשלום');
    await user.click(payBtn);

    expect(await screen.findByRole('heading', { name: 'רישום תשלום ידני' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/order-1 או מספר הזמנה/)).toBeInTheDocument();
    expect(screen.getByText('אשר ורשום תשלום')).toBeInTheDocument();
  });

  it('opens payment link generator modal from overdue row', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/payments');

    expect(await screen.findByText(/הזמנות עם יתרת חוב פתוחה/)).toBeInTheDocument();

    const user = userEvent.setup();
    const linkBtns = screen.getAllByText(/שלח קישור לתשלום/);
    await user.click(linkBtns[0]);

    expect(await screen.findByRole('heading', { name: 'יצירת קישור לתשלום באשראי' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('order-101')).toBeInTheDocument();
  });
});
