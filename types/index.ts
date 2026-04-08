import type { User, UserRole } from "@prisma/client";

// =============================================================================
// Auth session types (used throughout the app)
// =============================================================================

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: Date | null;
}

// =============================================================================
// API response wrapper
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// =============================================================================
// Server Action response (used by useActionState)
// =============================================================================

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
}

// =============================================================================
// Pagination params
// =============================================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SortParams {
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface FilterParams {
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  status?: string;
}

export type ProductQueryParams = PaginationParams & SortParams & FilterParams;

// =============================================================================
// Cart types (client-side)
// =============================================================================

export interface CartItemClient {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  slug: string;
  image?: string | null;
  options?: Record<string, string> | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CartState {
  items: CartItemClient[];
  subtotal: number;
  itemCount: number;
  couponCode?: string | null;
  discount?: number;
}

// =============================================================================
// Storage
// =============================================================================

export interface UploadedFile {
  url: string;
  publicId?: string;
  provider: "local" | "cloudinary" | "s3";
  width?: number;
  height?: number;
  size?: number;
  format?: string;
}

// =============================================================================
// Navigation
// =============================================================================

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
  requiresAuth?: boolean;
  requiresRole?: UserRole;
}

// =============================================================================
// Re-exports from Prisma for convenience
// =============================================================================

export type { User, UserRole } from "@prisma/client";
