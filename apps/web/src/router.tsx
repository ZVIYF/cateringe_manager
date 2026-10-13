import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Placeholder } from '@/pages/Placeholders/Placeholder';
import { LoginPage } from '@/pages/S01-Login/LoginPage';
import { DashboardPage } from '@/pages/S02-Dashboard/DashboardPage';
import { CalendarPage } from '@/pages/S03-Calendar/CalendarPage';
import { OrdersListPage } from '@/pages/S04-OrdersList/OrdersListPage';
import { OrderWizardPage } from '@/pages/S05-OrderWizard/OrderWizardPage';
import { OrderDetailPage } from '@/pages/S06-OrderDetail/OrderDetailPage';
import { StaffQuotePreviewPage } from '@/pages/S07-PublicQuote/StaffQuotePreviewPage';
import { PublicQuotePortalPage } from '@/pages/S07-PublicQuote/PublicQuotePortalPage';

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/p/:token', element: <PublicQuotePortalPage /> },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/calendar', element: <CalendarPage /> },
      { path: '/orders', element: <OrdersListPage /> },
      { path: '/orders/new', element: <OrderWizardPage /> },
      { path: '/orders/:id/edit', element: <OrderWizardPage /> },
      { path: '/orders/:id', element: <OrderDetailPage /> },
      { path: '/orders/:id/quote', element: <StaffQuotePreviewPage /> },
      { path: '/customers', element: <Placeholder title="לקוחות" /> },
      { path: '/menus', element: <Placeholder title="תפריטים ומנות" /> },
      { path: '/inventory', element: <Placeholder title="מלאי" /> },
      { path: '/suppliers', element: <Placeholder title="ספקים ורכש" /> },
      { path: '/kitchen', element: <Placeholder title="מטבח" /> },
      { path: '/deliveries', element: <Placeholder title="משלוחים" /> },
      { path: '/driver', element: <Placeholder title="נהג" /> },
      { path: '/payments', element: <Placeholder title="תשלומים" /> },
      { path: '/reports', element: <Placeholder title="דוחות" /> },
      { path: '/settings', element: <Placeholder title="הגדרות" /> },
      { path: '*', element: <Placeholder title="העמוד לא נמצא" /> }
    ]
  }
];

export const createRouter = () => createBrowserRouter(routes);
