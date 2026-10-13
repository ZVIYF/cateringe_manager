import { http, HttpResponse } from 'msw';
import {
  mockSettings,
  mockMessageTemplates,
  mockStaffUsers,
  type SettingsData,
  type MessageTemplateItem
} from '../fixtures/settings';
import type { UserPublic, CreateUserBody, UpdateUserBody } from '@catering/shared';

let settingsStore: SettingsData = { ...mockSettings };
let templatesStore: MessageTemplateItem[] = [...mockMessageTemplates];
const usersStore: UserPublic[] = [...mockStaffUsers];

export const settingsHandlers = [
  // ── GET /api/v1/settings ─────────────────────────────────────────────────────
  http.get('*/api/v1/settings', () => {
    return HttpResponse.json({ data: settingsStore });
  }),

  // ── PATCH /api/v1/settings ───────────────────────────────────────────────────
  http.patch('*/api/v1/settings', async ({ request }) => {
    const body = (await request.json()) as Partial<SettingsData>;
    settingsStore = {
      ...settingsStore,
      business: body.business ? { ...settingsStore.business, ...body.business } : settingsStore.business,
      defaults: body.defaults ? { ...settingsStore.defaults, ...body.defaults } : settingsStore.defaults,
      blockedDates: body.blockedDates ? body.blockedDates : settingsStore.blockedDates
    };
    return HttpResponse.json({ data: settingsStore });
  }),

  // ── GET /api/v1/settings/message-templates ───────────────────────────────────
  http.get('*/api/v1/settings/message-templates', () => {
    return HttpResponse.json({ data: templatesStore });
  }),

  // ── PUT /api/v1/settings/message-templates ───────────────────────────────────
  http.put('*/api/v1/settings/message-templates', async ({ request }) => {
    const body = (await request.json()) as MessageTemplateItem[];
    templatesStore = body;
    return HttpResponse.json({ data: templatesStore });
  }),

  // ── GET /api/v1/users ────────────────────────────────────────────────────────
  http.get('*/api/v1/users', () => {
    return HttpResponse.json({
      data: usersStore,
      meta: {
        total: usersStore.length,
        page: 1,
        pageSize: 50,
        totalPages: 1
      }
    });
  }),

  // ── POST /api/v1/users ───────────────────────────────────────────────────────
  http.post('*/api/v1/users', async ({ request }) => {
    const body = (await request.json()) as CreateUserBody;
    const newUser: UserPublic = {
      id: `usr-${Date.now()}`,
      name: body.name,
      email: body.email,
      role: body.role,
      phone: body.phone ?? null,
      active: true
    };
    usersStore.push(newUser);
    return HttpResponse.json({ data: newUser }, { status: 201 });
  }),

  // ── PATCH /api/v1/users/:id ──────────────────────────────────────────────────
  http.patch('*/api/v1/users/:id', async ({ params, request }) => {
    const body = (await request.json()) as UpdateUserBody;
    const idx = usersStore.findIndex(u => u.id === params.id);
    if (idx === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'משתמש לא נמצא' } },
        { status: 404 }
      );
    }
    const current = usersStore[idx];
    const updated: UserPublic = {
      ...current,
      name: body.name ?? current.name,
      role: body.role ?? current.role,
      phone: body.phone !== undefined ? body.phone : current.phone,
      active: body.active !== undefined ? body.active : current.active
    };
    usersStore[idx] = updated;
    return HttpResponse.json({ data: updated });
  }),

  // ── POST /api/v1/users/:id/reset-password ────────────────────────────────────
  http.post('*/api/v1/users/:id/reset-password', ({ params }) => {
    const user = usersStore.find(u => u.id === params.id);
    if (!user) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'משתמש לא נמצא' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      data: { message: `קישור לאיפוס סיסמה נשלח אל ${user.email}` }
    });
  })
];
