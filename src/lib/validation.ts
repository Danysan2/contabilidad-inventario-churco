import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  sku: z.string().min(1).max(40).trim().toUpperCase(),
  price: z.number().positive(),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  image: z.string().url().optional().nullable(),
  categoryId: z.string().cuid(),
  active: z.boolean().optional(),
  costPrice: z.number().positive().optional().nullable(),
});

export const saleItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1).max(50),
  note: z.string().max(200).optional(),
});

export const purchaseItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  unitCost: z.number().positive(),
});

export const purchaseSchema = z.object({
  items: z.array(purchaseItemSchema).min(1).max(50),
  note: z.string().max(200).optional(),
  date: z.string().datetime().optional(),
});

export const fixedExpenseSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  amount: z.number().positive(),
  categorySlug: z.string().max(60).optional().nullable(),
  description: z.string().max(300).optional().nullable(),
  active: z.boolean().optional(),
});

// ISO date string validation for query params
export const isValidDate = (s: string) => !isNaN(Date.parse(s));
