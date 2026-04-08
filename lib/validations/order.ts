import { z } from "zod";

export const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
});

export const checkoutSchema = z.object({
  addressId: z.string().optional(),
  newAddress: addressSchema.optional(),
  saveAddress: z.boolean().default(false),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(["stripe", "cash_on_delivery"]),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED",
    "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED",
    "REFUNDED", "RETURN_REQUESTED", "RETURNED",
  ]),
  note: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
