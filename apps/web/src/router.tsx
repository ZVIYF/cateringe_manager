import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Placeholder } from '@/pages/Placeholders/Placeholder';
import { LoginPage } from '@/pages/S01-Login/LoginPage';

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/', element: <Placeholder title="לוח בקרה" /> },
      { path: '/kitchen', element: <Placeholder title="מטבח" /> },
      { path: '/driver', element: <Placeholder title="נהג" /> },
      { path: '*', element: <Placeholder title="העמוד לא נמצא" /> }
    ]
  }
];

export const createRouter = () => createBrowserRouter(routes);
