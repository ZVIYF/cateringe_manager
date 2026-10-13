import { http, HttpResponse } from 'msw';
import { mockKitchenTasks } from '../fixtures/kitchen';
import type { KitchenTask, KitchenTaskUpdate } from '@catering/shared';

let kitchenTasksStore: KitchenTask[] = [...mockKitchenTasks];

export const kitchenHandlers = [
  // ── GET /api/v1/kitchen/tasks ──────────────────────────────────────────────
  http.get('*/api/v1/kitchen/tasks', ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    let tasks = kitchenTasksStore;
    if (date) {
      tasks = tasks.filter(t => t.date === date);
    }
    return HttpResponse.json({ data: tasks });
  }),

  // ── PATCH /api/v1/kitchen/tasks/:id ────────────────────────────────────────
  http.patch('*/api/v1/kitchen/tasks/:id', async ({ params, request }) => {
    const { id } = params;
    const idx = kitchenTasksStore.findIndex(t => t.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'משימת מטבח לא נמצאה' } },
        { status: 404 }
      );
    }

    const body = (await request.json()) as KitchenTaskUpdate;
    kitchenTasksStore[idx] = {
      ...kitchenTasksStore[idx],
      ...(body.status ? { status: body.status } : {}),
      updatedAt: new Date().toISOString()
    };

    return HttpResponse.json({ data: kitchenTasksStore[idx] });
  }),

  // ── GET /api/v1/kitchen/production-sheet ────────────────────────────────────
  http.get('*/api/v1/kitchen/production-sheet', () => {
    return HttpResponse.json({
      data: {
        pdfUrl: 'https://example.com/production-sheet.pdf'
      }
    });
  }),

  // ── GET /api/v1/kitchen/updates ────────────────────────────────────────────
  http.get('*/api/v1/kitchen/updates', ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    let tasks = kitchenTasksStore;
    if (date) {
      tasks = tasks.filter(t => t.date === date);
    }
    return HttpResponse.json({ data: tasks });
  })
];

export function resetKitchenMockStore() {
  kitchenTasksStore = [...mockKitchenTasks];
}
