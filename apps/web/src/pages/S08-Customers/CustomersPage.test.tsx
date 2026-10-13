import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S08 Customers CRM', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders customers directory and stats', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/customers');

    expect(await screen.findByRole('heading', { name: /ניהול לקוחות/ })).toBeInTheDocument();
    expect(screen.getByText('לקוח חדש')).toBeInTheDocument();
    expect(screen.getByText('סה"כ לקוחות')).toBeInTheDocument();

    // Check mock customer appears
    expect(await screen.findByText('הייטק סולושנס בע"מ')).toBeInTheDocument();
    expect(screen.getByText('ישראל ישראלי')).toBeInTheDocument();
  });

  it('filters customers by search query', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/customers');

    expect(await screen.findByText('הייטק סולושנס בע"מ')).toBeInTheDocument();

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/חיפוש לפי שם/);
    await user.type(searchInput, 'ישראלי');

    expect(await screen.findByText('ישראל ישראלי')).toBeInTheDocument();
    expect(screen.queryByText('הייטק סולושנס בע"מ')).not.toBeInTheDocument();
  });

  it('renders customer card view with details and orders history', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/customers/cust-1');

    expect(await screen.findByRole('heading', { name: 'משפחת כהן' })).toBeInTheDocument();
    expect(screen.getByText('ערוך פרטי לקוח')).toBeInTheDocument();
    expect(screen.getByText('הזמנות שבוצעו')).toBeInTheDocument();
    expect(screen.getByText('פרטי התקשרות וחיוב')).toBeInTheDocument();
    expect(screen.getByText('אנשי קשר נוספים')).toBeInTheDocument();
  });
});
