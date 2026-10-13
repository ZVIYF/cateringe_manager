import { http, HttpResponse } from 'msw';
import { mockDeliveries } from '../fixtures/deliveries';
import type { Delivery, UpdateDeliveryBody, CompleteDeliveryBody } from '@catering/shared';

const deliveriesStore: Delivery[] = [...mockDeliveries];

export const deliveriesHandlers = [
  // ── GET /api/v1/deliveries ───────────────────────────────────────────────────
  http.get('*/api/v1/deliveries', ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const driverId = url.searchParams.get('driverId');
    const status = url.searchParams.get('status');

    let list = deliveriesStore;
    if (date) {
      list = list.filter(d => (d.plannedDepartureAt || d.createdAt || '').slice(0, 10) === date);
    }
    if (driverId) {
      list = list.filter(d => d.driverId === driverId);
    }
    if (status) {
      list = list.filter(d => d.status === status);
    }

    return HttpResponse.json({ data: list });
  }),

  // ── GET /api/v1/driver/deliveries/today ───────────────────────────────────────
  http.get('*/api/v1/driver/deliveries/today', () => {
    // Return all driver deliveries ordered by sequence
    const list = [...deliveriesStore].sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99));
    return HttpResponse.json({ data: list });
  }),

  // ── GET /api/v1/deliveries/:id ───────────────────────────────────────────────
  http.get('*/api/v1/deliveries/:id', ({ params }) => {
    const delivery = deliveriesStore.find(d => d.id === params.id);
    if (!delivery) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'משלוח לא נמצא' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: delivery });
  }),

  // ── PATCH /api/v1/deliveries/:id (Dispatch update) ───────────────────────────
  http.patch('*/api/v1/deliveries/:id', async ({ params, request }) => {
    const body = (await request.json()) as UpdateDeliveryBody;
    const index = deliveriesStore.findIndex(d => d.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'משלוח לא נמצא' } },
        { status: 404 }
      );
    }

    const current = deliveriesStore[index];
    let newStatus = current.status;
    if (body.driverId !== undefined) {
      if (body.driverId && current.status === 'UNASSIGNED') {
        newStatus = 'ASSIGNED';
      } else if (!body.driverId && current.status === 'ASSIGNED') {
        newStatus = 'UNASSIGNED';
      }
    }

    const updated: Delivery = {
      ...current,
      driverId: body.driverId !== undefined ? body.driverId : current.driverId,
      driverName: body.driverId ? (body.driverId === 'clu_driver' ? 'אבי הנהג' : 'נהג משובץ') : null,
      sequence: body.sequence !== undefined ? body.sequence : current.sequence,
      plannedDepartureAt: body.plannedDepartureAt !== undefined ? body.plannedDepartureAt : current.plannedDepartureAt,
      notes: body.notes !== undefined ? body.notes : current.notes,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    deliveriesStore[index] = updated;
    return HttpResponse.json({ data: updated });
  }),

  // ── POST /api/v1/deliveries/:id/start (Driver start delivery) ────────────────
  http.post('*/api/v1/deliveries/:id/start', ({ params }) => {
    const index = deliveriesStore.findIndex(d => d.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'משלוח לא נמצא' } },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    deliveriesStore[index] = {
      ...deliveriesStore[index],
      status: 'EN_ROUTE',
      startedAt: now,
      updatedAt: now
    };

    return HttpResponse.json({
      data: {
        deliveryId: params.id,
        status: 'EN_ROUTE',
        startedAt: now,
        smsSent: true
      }
    });
  }),

  // ── POST /api/v1/deliveries/:id/complete (Driver hand-off completion) ─────────
  http.post('*/api/v1/deliveries/:id/complete', async ({ params, request }) => {
    const body = (await request.json()) as CompleteDeliveryBody;
    const index = deliveriesStore.findIndex(d => d.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'משלוח לא נמצא' } },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    deliveriesStore[index] = {
      ...deliveriesStore[index],
      status: 'DELIVERED',
      completedAt: body.clientCompletedAt || now,
      receiverName: body.receiverName,
      signatureUrl: body.signature,
      photoUrl: body.photo ?? null,
      deliveryNotes: body.notes ?? null,
      lat: body.lat,
      lng: body.lng,
      updatedAt: now
    };

    return HttpResponse.json({
      data: {
        deliveryId: params.id,
        status: 'DELIVERED',
        completedAt: deliveriesStore[index].completedAt,
        receiverName: body.receiverName
      }
    });
  })
];
