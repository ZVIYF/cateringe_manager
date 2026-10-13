import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { setAccessToken } from '@/api/client';
import { renderApp } from '@/test/renderApp';

describe('S07 Public Quote Portal', () => {
  beforeEach(() => {
    setAccessToken(null);
    document.cookie = 'mock_session=; path=/; max-age=0';
  });

  it('renders customer quote portal without requiring authentication', async () => {
    // Unauthenticated public access
    renderApp('/p/mock-public-quote-token-101');

    expect(await screen.findByText('קייטרינג שף גורמה')).toBeInTheDocument();
    expect(screen.getByText('הצעת מחיר לאירוע שלכם')).toBeInTheDocument();

    // Event Info
    expect(screen.getByText('אולם היכל שלמה, ירושלים')).toBeInTheDocument();
    expect(screen.getByText(/120 מוזמנים/)).toBeInTheDocument();

    // Menu list
    expect(screen.getByText(/תפריט המנות שנבחרו/)).toBeInTheDocument();
    expect(screen.getByText('סטייק פרגית במרינדה')).toBeInTheDocument();

    // Commercial totals
    expect(screen.getByText('סיכום כספי לתשלום')).toBeInTheDocument();
    expect(screen.getByText(/סה"כ לתשלום/)).toBeInTheDocument();

    // Action buttons
    expect(screen.getByText('אשר הצעה ותשלום מקדמה')).toBeInTheDocument();
    expect(screen.getByText('בקש שינוי בהצעה')).toBeInTheDocument();
  });
});
