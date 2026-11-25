import "server-only";

import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@dashboard/lib/supabase-server";

export type AdminStoreOrderStatus = "awaiting_verification" | "paid" | "cancelled";
export type AdminStoreOrderEmailStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed"
  | "not_configured";

export type AdminStoreOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  street: string;
  city: string;
  region: string;
  country: string;
  paymentStatus: AdminStoreOrderStatus;
  emailStatus: AdminStoreOrderEmailStatus;
  totalAmount: number;
  currency: "NGN";
  createdAt: string;
  updatedAt: string;
  paymentVerifiedAt: string | null;
  items: {
    productName: string;
    imageUrl: string;
    size: string | null;
    quantity: number;
    unitPrice: number;
  }[];
};

function isPaymentStatus(value: string): value is AdminStoreOrderStatus {
  return value === "awaiting_verification" || value === "paid" || value === "cancelled";
}

function isEmailStatus(value: string): value is AdminStoreOrderEmailStatus {
  return (
    value === "pending" ||
    value === "sending" ||
    value === "sent" ||
    value === "failed" ||
    value === "not_configured"
  );
}

export async function getAdminStoreOrders(): Promise<AdminStoreOrder[]> {
  if (!isSupabaseAdminConfigured) {
    throw new Error("Supabase admin access is not configured.");
  }

  const { data, error } = await createAdminSupabaseClient()
    .from("tlx_orders")
    .select(
      "id,order_number,customer_name,customer_email,customer_phone,street,city,region,country,payment_status,email_status,total_amount,currency,created_at,updated_at,payment_verified_at,items:tlx_order_items(product_name,image_url,size,quantity,unit_price,position)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Orders could not be loaded: ${error.message}`);
  }

  return (data ?? []).map((order) => {
    if (!isPaymentStatus(order.payment_status) || !isEmailStatus(order.email_status)) {
      throw new Error(`Order ${order.order_number} has an unsupported status.`);
    }
    if (order.currency !== "NGN" || !Number.isFinite(Number(order.total_amount))) {
      throw new Error(`Order ${order.order_number} has invalid totals.`);
    }
    if (!order.items?.length) {
      throw new Error(`Order ${order.order_number} is missing its item details.`);
    }

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      street: order.street,
      city: order.city,
      region: order.region,
      country: order.country,
      paymentStatus: order.payment_status,
      emailStatus: order.email_status,
      totalAmount: Number(order.total_amount),
      currency: order.currency,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      paymentVerifiedAt: order.payment_verified_at,
      items: order.items.map((item) => ({
        productName: item.product_name,
        imageUrl: item.image_url,
        size: item.size,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
      })),
    };
  });
}
