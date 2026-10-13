import { http, HttpResponse } from 'msw';
import {
  mockRevenueReport,
  mockProfitabilityReport,
  mockTopDishesReport,
  mockConversionReport
} from '../fixtures/reports';

export const reportsHandlers = [
  // ── GET /api/v1/reports/revenue ──────────────────────────────────────────────
  http.get('*/api/v1/reports/revenue', () => {
    return HttpResponse.json({ data: mockRevenueReport });
  }),

  // ── GET /api/v1/reports/profitability ────────────────────────────────────────
  http.get('*/api/v1/reports/profitability', () => {
    return HttpResponse.json({ data: mockProfitabilityReport });
  }),

  // ── GET /api/v1/reports/top-dishes ───────────────────────────────────────────
  http.get('*/api/v1/reports/top-dishes', () => {
    return HttpResponse.json({ data: mockTopDishesReport });
  }),

  // ── GET /api/v1/reports/conversion ───────────────────────────────────────────
  http.get('*/api/v1/reports/conversion', () => {
    return HttpResponse.json({ data: mockConversionReport });
  })
];

