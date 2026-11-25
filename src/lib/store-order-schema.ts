import { z } from "zod";

const plainText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine(
      (value) =>
        !value.split("").some((character) => {
          const code = character.charCodeAt(0);
          return code <= 0x1f || code === 0x7f;
        }),
      "Remove control characters.",
    );

export const optionalCustomerEmailSchema = z
  .string()
  .trim()
  .max(254)
  .refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address.");

export const customerDetailsSchema = z.object({
  name: plainText(120),
  email: optionalCustomerEmailSchema.optional(),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(32)
    .refine((value) => /^[+0-9().\s-]+$/.test(value), "Enter a valid phone number.")
    .refine((value) => (value.match(/\d/g)?.length ?? 0) >= 7, "Enter a valid phone number."),
  street: plainText(200),
  city: plainText(120),
  region: plainText(120),
  country: plainText(120),
});

export const checkoutItemSchema = z.object({
  productId: z.string().trim().min(1).max(128),
  quantity: z.number().int().min(1).max(99),
  size: z.string().trim().min(1).max(32).optional(),
});

export const createStoreOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  receiptToken: z.string().regex(/^[a-f0-9]{64}$/i),
  expectedTotalAmount: z.number().finite().nonnegative(),
  customer: customerDetailsSchema,
  items: z
    .array(checkoutItemSchema)
    .min(1)
    .max(50)
    .refine(
      (items) =>
        new Set(items.map((item) => `${item.productId}\u0000${item.size ?? ""}`)).size === items.length,
      "Each product and size can only appear once.",
    ),
});

export const createStoreOrderResponseSchema = z.object({
  orderId: z.string().min(1),
  receiptUrl: z.string().url(),
  emailStatus: z.enum(["sent", "sending", "not_configured", "failed"]),
  message: z.string().optional(),
});

export const updateStoreOrderStatusSchema = z.object({
  status: z.enum(["paid", "cancelled"]),
});

export const updateStoreOrderStatusResponseSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string().min(1),
  paymentStatus: updateStoreOrderStatusSchema.shape.status,
  updatedAt: z.iso.datetime({ offset: true }),
  paymentVerifiedAt: z.iso.datetime({ offset: true }).nullable(),
});

export type CustomerDetails = z.infer<typeof customerDetailsSchema>;
export type CreateStoreOrderRequest = z.infer<typeof createStoreOrderSchema>;
export type CreateStoreOrderResponse = z.infer<typeof createStoreOrderResponseSchema>;
export type StoreOrderStatus = z.infer<typeof updateStoreOrderStatusSchema>["status"];
