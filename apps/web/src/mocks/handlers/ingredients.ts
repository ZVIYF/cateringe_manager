import { http, HttpResponse } from 'msw';
import { mockIngredients } from '../fixtures/ingredients';

export const ingredientsHandlers = [
  http.get('*/api/v1/inventory/ingredients', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();

    let list = mockIngredients;
    if (q) {
      list = list.filter(i => i.name.toLowerCase().includes(q) || (i.category && i.category.toLowerCase().includes(q)));
    }
    return HttpResponse.json({ data: list });
  }),

  http.get('*/api/v1/ingredients', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();

    let list = mockIngredients;
    if (q) {
      list = list.filter(i => i.name.toLowerCase().includes(q) || (i.category && i.category.toLowerCase().includes(q)));
    }
    return HttpResponse.json({ data: list });
  })
];

