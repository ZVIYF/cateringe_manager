import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S13 Deliveries Dispatcher & Driver PWA', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  describe('Dispatcher View (/deliveries)', () => {
    it('renders deliveries overview, stats cards, and table rows', async () => {
      setAccessToken('mock-access-clu_admin');
      document.cookie = 'mock_session=clu_admin; path=/';

      renderApp('/deliveries');

      expect(await screen.findByRole('heading', { name: /ניהול והפצת משלוחים/ })).toBeInTheDocument();
      expect(screen.getByText('סה״כ משלוחים ליום זה')).toBeInTheDocument();
      expect((await screen.findAllByText('בדרך ללקוח')).length).toBeGreaterThanOrEqual(1);
      expect((await screen.findAllByText('נמסרו בהצלחה')).length).toBeGreaterThanOrEqual(1);

      // Check delivery rows
      expect(await screen.findByText(/משפחת כהן/)).toBeInTheDocument();
      expect(screen.getByText(/הייטק סולושנס/)).toBeInTheDocument();
      expect(screen.getByText(/ישראל ישראלי/)).toBeInTheDocument();
    });

    it('opens delivery hand-off inspection modal', async () => {
      setAccessToken('mock-access-clu_admin');
      document.cookie = 'mock_session=clu_admin; path=/';

      renderApp('/deliveries');

      expect(await screen.findByRole('heading', { name: /ניהול והפצת משלוחים/ })).toBeInTheDocument();

      const user = userEvent.setup();
      const detailButtons = await screen.findAllByRole('button', { name: /פרטים/ });
      await user.click(detailButtons[0]);

      expect(await screen.findByRole('heading', { name: /פרטי משלוח להזמנה/ })).toBeInTheDocument();
      expect(screen.getByText('הוראות ודגשים למשלוח:')).toBeInTheDocument();
    });
  });

  describe('Driver Mobile View (/driver)', () => {
    it('renders driver route list and allows opening delivery hand-off modal', async () => {
      setAccessToken('mock-access-clu_driver');
      document.cookie = 'mock_session=clu_driver; path=/';

      renderApp('/driver');

      expect(await screen.findByRole('heading', { name: 'נהג' })).toBeInTheDocument();
      expect(await screen.findByText(/מסלול משלוחי היום/)).toBeInTheDocument();

      // Ensure customer addresses are rendered
      expect(await screen.findByText(/משפחת כהן/)).toBeInTheDocument();

      const user = userEvent.setup();
      const completeButtons = await screen.findAllByRole('button', { name: /מסירת משלוח וחתימת לקוח/ });
      await user.click(completeButtons[0]);

      // Complete delivery hand-off modal
      expect(await screen.findByRole('heading', { name: /אישור מסירה — הזמנה/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'אשר מסירה' })).toBeInTheDocument();
    });
  });
});
