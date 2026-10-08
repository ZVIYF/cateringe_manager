import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, useLocation, useRoutes } from 'react-router-dom';
import { routes } from '@/router';

// A declarative router is used here because jsdom's AbortSignal is rejected by
// the data router's undici-backed Request in tests.
function App() {
  const element = useRoutes(routes);
  const { pathname } = useLocation();
  return (
    <>
      {element}
      <output data-testid="pathname">{pathname}</output>
    </>
  );
}

export function renderApp(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { queryClient };
}
