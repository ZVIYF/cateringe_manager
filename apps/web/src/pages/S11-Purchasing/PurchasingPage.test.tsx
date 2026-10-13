import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S11 Suppliers & Purchase Orders', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders suppliers directory with cards and table', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/suppliers');

    expect(await screen.findByRole('heading', { name: /ספקים והזמנות רכש/ })).toBeInTheDocument();
    expect(screen.getByText('ספק חדש')).toBeInTheDocument();
    expect(screen.getByText('סה״כ ספקים פעילים')).toBeInTheDocument();

    // Check mock suppliers appear
    expect(await screen.findByText('עוף ירושלים')).toBeInTheDocument();
    expect(screen.getByText('ירקות הדרום')).toBeInTheDocument();
  });

  it('filters suppliers by search query', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/suppliers');

    expect(await screen.findByText('עוף ירושלים')).toBeInTheDocument();

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/חיפוש לפי שם ספק/);
    await user.type(searchInput, 'כרמל');

    expect(await screen.findByText('משק כרמל')).toBeInTheDocument();
    expect(screen.queryByText('עוף ירושלים')).not.toBeInTheDocument();
  });

  it('renders purchase orders ledger with statuses and actions', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/purchase-orders');

    expect(await screen.findByRole('heading', { name: /ניהול הזמנות רכש וקליטת מלאי/ })).toBeInTheDocument();
    expect(screen.getByText('הפקת רכש מחוסרים (7 ימים)')).toBeInTheDocument();
    expect(screen.getByText('הזמנת רכש חדשה')).toBeInTheDocument();

    // Check mock PO numbers appear
    expect(await screen.findByText('#5001')).toBeInTheDocument();
    expect(screen.getByText('#5002')).toBeInTheDocument();
    expect(screen.getByText('#5003')).toBeInTheDocument();
  });

  it('opens purchase order details modal', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/purchase-orders');

    const viewButtons = await screen.findAllByRole('button', { name: /פרטים/ });
    const user = userEvent.setup();
    await user.click(viewButtons[0]);

    expect(await screen.findByText(/הזמנת רכש #/)).toBeInTheDocument();
    expect(screen.getByText('שליחה בדוא״ל')).toBeInTheDocument();
  });
});
