import "server-only";

import { createHash } from "node:crypto";
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@dashboard/lib/supabase-server";

export type StoreOrderReceipt = {
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  street: string;
  city: string;
  region: string;
  country: string;
  paymentStatus: "awaiting_verification" | "paid" | "cancelled";
  totalAmount: number;
  currency: "NGN";
  createdAt: string;
  items: {
    productName: string;
    imageUrl: string;
    size: string | null;
    quantity: number;
    unitPrice: number;
  }[];
};

export async function getStoreOrderReceipt(token: string): Promise<StoreOrderReceipt | null> {
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  if (!isSupabaseAdminConfigured) {
    throw new Error("Order receipts are not configured.");
  }

  const client = createAdminSupabaseClient();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: order, error: orderError } = await client
    .from("tlx_orders")
    .select(
      "id,order_number,customer_name,customer_email,customer_phone,street,city,region,country,payment_status,total_amount,currency,created_at",
    )
    .eq("receipt_token_hash", tokenHash)
    .maybeSingle();

  if (orderError) {
    throw new Error(`Could not load the order receipt: ${orderError.message}`);
  }
  if (!order) return null;

  const { data: items, error: itemsError } = await client
    .from("tlx_order_items")
    .select("product_name,image_url,size,quantity,unit_price")
    .eq("order_id", order.id)
    .order("position", { ascending: true });

  if (itemsError) {
    throw new Error(`Could not load the order items: ${itemsError.message}`);
  }
  if (!items?.length) {
    throw new Error("The saved order is missing its item details.");
  }

  if (
    order.payment_status !== "awaiting_verification" &&
    order.payment_status !== "paid" &&
    order.payment_status !== "cancelled"
  ) {
    throw new Error("The saved order has an unsupported payment status.");
  }
  if (order.currency !== "NGN" || !Number.isFinite(Number(order.total_amount))) {
    throw new Error("The saved order has invalid receipt totals.");
  }

  return {
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    street: order.street,
    city: order.city,
    region: order.region,
    country: order.country,
    paymentStatus: order.payment_status,
    totalAmount: Number(order.total_amount),
    currency: order.currency,
    createdAt: order.created_at,
    items: items.map((item) => ({
      productName: item.product_name,
      imageUrl: item.image_url,
      size: item.size,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
    })),
  };
}
