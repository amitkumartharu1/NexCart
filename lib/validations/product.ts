import { z } from "zod";
import { ProductStatus } from "@prisma/client";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  slug: z.string().optional(),
  sku: z.string().max(100).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  basePrice: z.number().positive("Price must be greater than 0"),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  weight: z.number().positive().optional(),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().max(160).optional(),
  metaDesc: z.string().max(320).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productVariantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().optional(),
  price: z.number().positive().optional(),
  options: z.record(z.string(), z.string()),
  isActive: z.boolean().default(true),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
