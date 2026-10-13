import { http, HttpResponse } from 'msw';
import { mockDishes } from '../fixtures/orders';
import { mockIngredients } from '../fixtures/ingredients';
import type { Dish, DishCreate, DishUpdate, DishRecipeUpdate, RecipeLine } from '@catering/shared';

let dishesStore: Dish[] = [...mockDishes];

function computeDishCost(recipeLines: RecipeLine[], sellingPrice: number) {
  let costPerPortion = 0;
  for (const line of recipeLines) {
    const ing = mockIngredients.find(i => i.id === line.ingredientId);
    if (ing) {
      costPerPortion += Math.round(line.qtyPerPortion * ing.costPerUnit);
    }
  }

  const marginPercent =
    sellingPrice > 0 ? Number((((sellingPrice - costPerPortion) / sellingPrice) * 100).toFixed(1)) : 0;

  return { perPortion: costPerPortion, marginPercent };
}

export const dishesHandlers = [
  // ── GET /api/v1/dishes ──────────────────────────────────────────────────────
  http.get('*/api/v1/dishes', ({ request }) => {
    const url = new URL(request.url);
    const kashrut = url.searchParams.get('kashrut');
    const category = url.searchParams.get('category');
    const active = url.searchParams.get('active');
    const q = url.searchParams.get('q')?.toLowerCase();

    let list = dishesStore;
    if (kashrut) {
      list = list.filter(d => d.kashrut === kashrut || d.kashrut === 'PARVE');
    }
    if (category) {
      list = list.filter(d => d.category === category);
    }
    if (active !== null && active !== undefined && active !== '') {
      const isActive = active === 'true';
      list = list.filter(d => d.active === isActive);
    }
    if (q) {
      list = list.filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          d.allergens.some(a => a.toLowerCase().includes(q))
      );
    }

    return HttpResponse.json({ data: list });
  }),

  // ── POST /api/v1/dishes ─────────────────────────────────────────────────────
  http.post('*/api/v1/dishes', async ({ request }) => {
    const body = (await request.json()) as DishCreate;
    const newDish: Dish = {
      id: `dish-${Date.now()}`,
      version: 1,
      name: body.name,
      category: body.category,
      kashrut: body.kashrut,
      unit: body.unit ?? 'PORTION',
      portionsPerUnit: body.portionsPerUnit ?? 1,
      price: body.price,
      imageUrl: body.imageUrl ?? null,
      allergens: body.allergens ?? [],
      active: body.active ?? true,
      recipe: [],
      cost: { perPortion: 0, marginPercent: 100 }
    };

    dishesStore = [newDish, ...dishesStore];
    return HttpResponse.json({ data: newDish }, { status: 201 });
  }),

  // ── GET /api/v1/dishes/:id ──────────────────────────────────────────────────
  http.get('*/api/v1/dishes/:id', ({ params }) => {
    const { id } = params;
    const dish = dishesStore.find(d => d.id === id);
    if (!dish) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'מנה לא נמצאה' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: dish });
  }),

  // ── PATCH /api/v1/dishes/:id ────────────────────────────────────────────────
  http.patch('*/api/v1/dishes/:id', async ({ params, request }) => {
    const { id } = params;
    const idx = dishesStore.findIndex(d => d.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'מנה לא נמצאה' } },
        { status: 404 }
      );
    }

    const body = (await request.json()) as DishUpdate;
    const current = dishesStore[idx]!;

    const newPrice = body.price ?? current.price;
    const cost = computeDishCost(current.recipe, newPrice);

    const updated: Dish = {
      ...current,
      version: current.version + 1,
      name: body.name ?? current.name,
      category: body.category ?? current.category,
      kashrut: body.kashrut ?? current.kashrut,
      unit: body.unit ?? current.unit,
      portionsPerUnit: body.portionsPerUnit ?? current.portionsPerUnit,
      price: newPrice,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : current.imageUrl,
      allergens: body.allergens ?? current.allergens,
      active: body.active !== undefined ? body.active : current.active,
      cost
    };

    dishesStore[idx] = updated;
    return HttpResponse.json({ data: updated });
  }),

  // ── PUT /api/v1/dishes/:id/recipe ───────────────────────────────────────────
  http.put('*/api/v1/dishes/:id/recipe', async ({ params, request }) => {
    const { id } = params;
    const idx = dishesStore.findIndex(d => d.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'מנה לא נמצאה' } },
        { status: 404 }
      );
    }

    const body = (await request.json()) as DishRecipeUpdate;
    const current = dishesStore[idx]!;

    const newLines: RecipeLine[] = body.lines.map(line => {
      const ing = mockIngredients.find(i => i.id === line.ingredientId);
      return {
        ingredientId: line.ingredientId,
        ingredientName: ing ? ing.name : 'חומר גלם',
        unit: ing ? ing.unit : 'יח',
        qtyPerPortion: line.qtyPerPortion
      };
    });

    const cost = computeDishCost(newLines, current.price);

    const updated: Dish = {
      ...current,
      version: current.version + 1,
      recipe: newLines,
      cost
    };

    dishesStore[idx] = updated;
    return HttpResponse.json({ data: updated });
  })
];

export function resetDishesMockStore() {
  dishesStore = [...mockDishes];
}

