import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S02 Dashboard', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders KPIs, revenue chart, alerts, and upcoming orders for ADMIN', async () => {
    setAccessToken('mock-access-clu_admin');
    document.cookie = 'mock_session=clu_admin; path=/';

    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'לוח בקרה' })).toBeInTheDocument();
    expect(screen.getByText('אירועים השבוע')).toBeInTheDocument();
    expect(screen.getByText('הצעות מחיר ממתינות')).toBeInTheDocument();
    expect(screen.getByText('הכנסות החודש')).toBeInTheDocument();
    expect(screen.getByText('יתרות פתוחות')).toBeInTheDocument();

    // Revenue chart exists for ADMIN
    expect(screen.getByText('מגמת הכנסות (6 חודשים אחרונים)')).toBeInTheDocument();

    // Upcoming orders
    expect(screen.getByText('אירועים קרובים')).toBeInTheDocument();
    expect(screen.getByText('משפחת כהן')).toBeInTheDocument();

    // Alerts
    expect(screen.getByText('התראות מערכת')).toBeInTheDocument();
    expect(screen.getByText('מלאי נמוך: שוק עוף (3 ק"ג)')).toBeInTheDocument();
  });

  it('omits revenue KPI and revenue chart for OFFICE role', async () => {
    setAccessToken('mock-access-clu_office');
    document.cookie = 'mock_session=clu_office; path=/';

    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'לוח בקרה' })).toBeInTheDocument();
    expect(screen.getByText('אירועים השבוע')).toBeInTheDocument();
    expect(screen.getByText('הצעות מחיר ממתינות')).toBeInTheDocument();
    expect(screen.getByText('יתרות פתוחות')).toBeInTheDocument();

    // Should NOT have revenue KPI or chart for OFFICE
    await waitFor(() => {
      expect(screen.queryByText('הכנסות החודש')).not.toBeInTheDocument();
      expect(screen.queryByText('מגמת הכנסות (6 חודשים אחרונים)')).not.toBeInTheDocument();
    });
  });
});

