import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { setUnauthenticatedHandler } from '@/api/client';
import { createRouter } from '@/router';
import './index.css';

async function enableMocks() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return;
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } }
});
const router = createRouter();
setUnauthenticatedHandler(() => {
  queryClient.clear();
  void router.navigate('/login', { replace: true });
});

void enableMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  );
});
