import { authHandlers } from './auth';

const modules = { auth: authHandlers };

/** `VITE_MOCK_MODULES` limits mocking to the listed modules; empty = all. */
export function getHandlers(only = import.meta.env.VITE_MOCK_MODULES as string | undefined) {
  const wanted = only?.split(',').map((m) => m.trim()).filter(Boolean) ?? [];
  return Object.entries(modules)
    .filter(([name]) => wanted.length === 0 || wanted.includes(name))
    .flatMap(([, handlers]) => handlers);
}
