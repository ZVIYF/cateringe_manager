import { z } from 'zod';
import { DishCategory, Kashrut, SaleUnit } from '../enums';
import { Id, ListQuery, Money, dataOf, pageOf } from '../http';

// ── Recipe & Cost Sub-schemas ────────────────────────────────────────────────

export const RecipeLine = z.object({
  ingredientId: Id,
  ingredientName: z.string().trim().min(1),
  unit: z.string().trim().min(1),
  qtyPerPortion: z.number().positive(),
});
export type RecipeLine = z.infer<typeof RecipeLine>;

export const RecipeLineInput = z.object({
  ingredientId: Id,
  qtyPerPortion: z.number().positive(),
});
export type RecipeLineInput = z.infer<typeof RecipeLineInput>;

export const DishCost = z.object({
  perPortion: Money,
  marginPercent: z.number(),
});
export type DishCost = z.infer<typeof DishCost>;

// ── Main Dish Schema (§4.4) ─────────────────────────────────────────────────

export const Dish = z.object({
  id: Id,
  version: z.number().int().min(1),
  name: z.string().trim().min(2).max(100),
  category: DishCategory,
  kashrut: Kashrut,
  unit: SaleUnit,
  portionsPerUnit: z.number().positive(),
  price: Money,
  imageUrl: z.string().nullable(),
  allergens: z.array(z.string()),
  active: z.boolean(),
  recipe: z.array(RecipeLine),
  cost: DishCost.nullable().optional(),
});
export type Dish = z.infer<typeof Dish>;

// ── Kitchen Staff View (omits price and cost per §5.4) ─────────────────────────

export const DishKitchenView = Dish.omit({ price: true, cost: true });
export type DishKitchenView = z.infer<typeof DishKitchenView>;

// ── Query & Mutation Schemas ────────────────────────────────────────────────

export const DishListQuery = ListQuery.extend({
  category: DishCategory.optional(),
  kashrut: Kashrut.optional(),
  active: z.coerce.boolean().optional(),
});
export type DishListQuery = z.infer<typeof DishListQuery>;

export const DishCreate = z.object({
  name: z.string().trim().min(2).max(100),
  category: DishCategory,
  kashrut: Kashrut,
  unit: SaleUnit.default('PORTION'),
  portionsPerUnit: z.number().positive().default(1),
  price: Money,
  imageUrl: z.string().nullable().optional().default(null),
  allergens: z.array(z.string()).optional().default([]),
  active: z.boolean().optional().default(true),
});
export type DishCreate = z.infer<typeof DishCreate>;

export const DishUpdate = z.object({
  version: z.number().int().min(1),
  name: z.string().trim().min(2).max(100).optional(),
  category: DishCategory.optional(),
  kashrut: Kashrut.optional(),
  unit: SaleUnit.optional(),
  portionsPerUnit: z.number().positive().optional(),
  price: Money.optional(),
  imageUrl: z.string().nullable().optional(),
  allergens: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});
export type DishUpdate = z.infer<typeof DishUpdate>;

export const DishRecipeUpdate = z.object({
  version: z.number().int().min(1),
  lines: z.array(RecipeLineInput),
});
export type DishRecipeUpdate = z.infer<typeof DishRecipeUpdate>;

// ── Access Control Constants (§5.4) ──────────────────────────────────────────
// Mutations (POST, PATCH, DELETE, recipe, image) allowed for ADMIN and KITCHEN_MANAGER.
export const DISH_MUTATION_ROLES = ['ADMIN', 'KITCHEN_MANAGER'] as const;

// ── Response Wrappers ─────────────────────────────────────────────────────────

export const DishResponse = dataOf(Dish);
export type DishResponse = z.infer<typeof DishResponse>;

export const DishListResponse = pageOf(Dish);
export type DishListResponse = z.infer<typeof DishListResponse>;
