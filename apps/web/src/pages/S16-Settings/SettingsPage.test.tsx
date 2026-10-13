import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S16 Settings & System Administration', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders business settings and defaults tab', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/settings');

    expect(await screen.findByRole('heading', { name: /הגדרות מערכת וניהול/ })).toBeInTheDocument();
    expect(await screen.findByText('פרטי החברה לחשבוניות והצעות')).toBeInTheDocument();
    expect(screen.getByText('ברירות מחדל מסחריות')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /שמור הגדרות עסק/ })).toBeInTheDocument();
  });

  it('navigates to staff users directory and opens create user modal', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/settings');

    expect(await screen.findByRole('heading', { name: /הגדרות מערכת וניהול/ })).toBeInTheDocument();

    const user = userEvent.setup();
    const usersTab = screen.getByRole('button', { name: /משתמשי צוות והרשאות/ });
    await user.click(usersTab);

    expect(await screen.findByText('ידידיה שוורץ')).toBeInTheDocument();
    expect(await screen.findByText('אבי כהן (נהג)')).toBeInTheDocument();

    // Open add new user modal
    const addUserBtn = screen.getByRole('button', { name: /משתמש חדש/ });
    await user.click(addUserBtn);

    expect(await screen.findByRole('heading', { name: 'הוספת משתמש מערכת חדש' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ישראל ישראלי')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('user@dev.local')).toBeInTheDocument();
  });

  it('navigates to message templates tab and displays SMS/WhatsApp templates', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/settings');

    expect(await screen.findByRole('heading', { name: /הגדרות מערכת וניהול/ })).toBeInTheDocument();

    const user = userEvent.setup();
    const templatesTab = screen.getByRole('button', { name: /תבניות הודעות וסמס/ });
    await user.click(templatesTab);

    expect(await screen.findByText(/תבניות הודעות אוטומטיות/)).toBeInTheDocument();
    expect(await screen.findByText('שליחת הצעת מחיר ללקוח')).toBeInTheDocument();
    expect(await screen.findByText('תזכורת לתשלום יתרה פתוחה')).toBeInTheDocument();
  });
});
