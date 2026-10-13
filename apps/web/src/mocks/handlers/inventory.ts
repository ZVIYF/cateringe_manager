import { http, HttpResponse } from 'msw';
import { mockIngredients, mockStockMoves, mockForecastItems } from '../fixtures/inventory';
import type {
  Ingredient,
  IngredientCreate,
  IngredientUpdate,
  StockMove,
  CreateStockMoveBody
} from '@catering/shared';

let ingredientsStore: Ingredient[] = [...mockIngredients];
let stockMovesStore: StockMove[] = [...mockStockMoves];

export const inventoryHandlers = [
  // ── GET /api/v1/ingredients ────────────────────────────────────────────────
  http.get('*/api/v1/ingredients', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();
    const category = url.searchParams.get('category');
    const belowMin = url.searchParams.get('belowMin') === 'true';

    let list = ingredientsStore;
    if (q) {
      list = list.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          (i.category && i.category.toLowerCase().includes(q))
      );
    }
    if (category) {
      list = list.filter(i => i.category === category);
    }
    if (belowMin) {
      list = list.filter(i => i.currentStock <= i.minStock);
    }

    return HttpResponse.json({ data: list });
  }),

  // Backward compatibility / alias for /api/v1/inventory/ingredients
  http.get('*/api/v1/inventory/ingredients', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();
    let list = ingredientsStore;
    if (q) {
      list = list.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          (i.category && i.category.toLowerCase().includes(q))
      );
    }
    return HttpResponse.json({ data: list });
  }),

  // ── POST /api/v1/ingredients ───────────────────────────────────────────────
  http.post('*/api/v1/ingredients', async ({ request }) => {
    const body = (await request.json()) as IngredientCreate;
    const newIngredient: Ingredient = {
      id: `ing-${Date.now()}`,
      name: body.name,
      category: body.category,
      unit: body.unit,
      currentStock: body.currentStock ?? 0,
      minStock: body.minStock ?? 0,
      costPerUnit: body.costPerUnit,
      supplierId: body.supplierId ?? null,
      createdAt: new Date().toISOString()
    };

    ingredientsStore = [newIngredient, ...ingredientsStore];
    return HttpResponse.json({ data: newIngredient }, { status: 201 });
  }),

  // ── GET /api/v1/ingredients/:id ────────────────────────────────────────────
  http.get('*/api/v1/ingredients/:id', ({ params }) => {
    const { id } = params;
    const ing = ingredientsStore.find(i => i.id === id);
    if (!ing) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'חומר גלם לא נמצא' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: ing });
  }),

  // ── PATCH /api/v1/ingredients/:id ──────────────────────────────────────────
  http.patch('*/api/v1/ingredients/:id', async ({ params, request }) => {
    const { id } = params;
    const idx = ingredientsStore.findIndex(i => i.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'חומר גלם לא נמצא' } },
        { status: 404 }
      );
    }

    const body = (await request.json()) as IngredientUpdate;
    ingredientsStore[idx] = {
      ...ingredientsStore[idx],
      ...body,
      updatedAt: new Date().toISOString()
    };

    return HttpResponse.json({ data: ingredientsStore[idx] });
  }),

  // ── GET /api/v1/inventory/forecast ─────────────────────────────────────────
  http.get('*/api/v1/inventory/forecast', () => {
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    return HttpResponse.json({
      data: mockForecastItems,
      meta: { from, to }
    });
  }),

  // ── GET /api/v1/inventory/moves ────────────────────────────────────────────
  http.get('*/api/v1/inventory/moves', ({ request }) => {
    const url = new URL(request.url);
    const ingredientId = url.searchParams.get('ingredientId');
    const type = url.searchParams.get('type');
    const page = Number(url.searchParams.get('page') || '1');
    const pageSize = Number(url.searchParams.get('pageSize') || '20');

    let filtered = stockMovesStore;
    if (ingredientId) {
      filtered = filtered.filter(m => m.ingredientId === ingredientId);
    }
    if (type) {
      filtered = filtered.filter(m => m.type === type);
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      data: paginated,
      meta: { total, page, pageSize, totalPages }
    });
  }),

  // ── POST /api/v1/inventory/moves ───────────────────────────────────────────
  http.post('*/api/v1/inventory/moves', async ({ request }) => {
    const body = (await request.json()) as CreateStockMoveBody;
    const ingIndex = ingredientsStore.findIndex(i => i.id === body.ingredientId);
    const ing = ingredientsStore[ingIndex];

    const newMove: StockMove = {
      id: `sm-${Date.now()}`,
      ingredientId: body.ingredientId,
      ingredientName: ing?.name ?? 'חומר גלם',
      type: body.type,
      qty: body.qty,
      reason: body.reason,
      createdAt: new Date().toISOString(),
      createdByName: 'מנהל מערכת'
    };

    // Update physical stock balance
    if (ingIndex >= 0) {
      let updatedStock = ingredientsStore[ingIndex].currentStock;
      if (body.type === 'IN') {
        updatedStock += body.qty;
      } else if (body.type === 'OUT' || body.type === 'WASTE') {
        updatedStock = Math.max(0, updatedStock - body.qty);
      } else if (body.type === 'ADJUST') {
        updatedStock = body.qty;
      }
      ingredientsStore[ingIndex] = {
        ...ingredientsStore[ingIndex],
        currentStock: updatedStock
      };
    }

    stockMovesStore = [newMove, ...stockMovesStore];
    return HttpResponse.json({ data: newMove }, { status: 201 });
  })
];

export function resetInventoryMockStore() {
  ingredientsStore = [...mockIngredients];
  stockMovesStore = [...mockStockMoves];
}
