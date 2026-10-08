import { createApp } from './app';

const PORT = Number(process.env['PORT'] ?? 4000);

const app = createApp();

app.listen(PORT, () => {
  console.log(`[api] Server listening on http://localhost:${PORT}`);
  console.log(`[api] Base URL: http://localhost:${PORT}/api/v1`);
});

