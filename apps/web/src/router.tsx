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
import { CustomersListPage } from '@/pages/S08-Customers/CustomersListPage';
import { CustomerDetailPage } from '@/pages/S08-Customers/CustomerDetailPage';
import { DishesListPage } from '@/pages/S09-Dishes/DishesListPage';
import { DishEditorPage } from '@/pages/S09-Dishes/DishEditorPage';
import { InventoryPage } from '@/pages/S10-Inventory/InventoryPage';
import { SuppliersPage } from '@/pages/S11-Purchasing/SuppliersPage';
import { PurchaseOrdersPage } from '@/pages/S11-Purchasing/PurchaseOrdersPage';
import { KitchenTabletPage } from '@/pages/S12-Kitchen/KitchenTabletPage';
import { DeliveriesDispatcherPage } from '@/pages/S13-Deliveries/DeliveriesDispatcherPage';
import { DriverMobilePage } from '@/pages/S13-Deliveries/DriverMobilePage';
import { PaymentsLedgerPage } from '@/pages/S14-Payments/PaymentsLedgerPage';
import { ReportsPage } from '@/pages/S15-Reports/ReportsPage';
import { SettingsPage } from '@/pages/S16-Settings/SettingsPage';

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
      { path: '/customers', element: <CustomersListPage /> },
      { path: '/customers/:id', element: <CustomerDetailPage /> },
      { path: '/menus', element: <DishesListPage /> },
      { path: '/dishes/new', element: <DishEditorPage /> },
      { path: '/dishes/:id', element: <DishEditorPage /> },
      { path: '/inventory', element: <InventoryPage /> },
      { path: '/suppliers', element: <SuppliersPage /> },
      { path: '/purchase-orders', element: <PurchaseOrdersPage /> },
      { path: '/kitchen', element: <KitchenTabletPage /> },
      { path: '/deliveries', element: <DeliveriesDispatcherPage /> },
      { path: '/driver', element: <DriverMobilePage /> },
      { path: '/payments', element: <PaymentsLedgerPage /> },
      { path: '/reports', element: <ReportsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <Placeholder title="העמוד לא נמצא" /> }
    ]
  }
];

export const createRouter = () => createBrowserRouter(routes);
