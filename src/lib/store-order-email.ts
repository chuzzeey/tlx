import "server-only";

import { formatPrice } from "@/lib/currency";
import type { CustomerDetails } from "@/lib/store-order-schema";

export type StoreOrderEmailStatus = "sent" | "not_configured";

export type StoreOrderEmailItem = {
  productName: string;
  size: string | null;
  quantity: number;
  unitPrice: number;
};

type StoreOrderEmail = {
  orderNumber: string;
  receiptUrl: string;
  customer: CustomerDetails;
  items: StoreOrderEmailItem[];
  totalAmount: number;
};

export async function sendStoreOrderEmail(order: StoreOrderEmail): Promise<StoreOrderEmailStatus> {
  const missingSettings = [
    !process.env.RESEND_API_KEY && "RESEND_API_KEY",
    !process.env.RESEND_FROM_EMAIL && "RESEND_FROM_EMAIL",
  ].filter((setting): setting is string => Boolean(setting));

  if (missingSettings.length > 0) {
    console.warn("Store order email is not configured.", { missingSettings });
    return "not_configured";
  }

  const itemLines = order.items.map((item) => {
    const specification = item.size ? `, size ${item.size}` : "";
    return `- ${item.productName}${specification} × ${item.quantity}: ${formatPrice(item.unitPrice * item.quantity)}`;
  });
  const address = [
    order.customer.street,
    order.customer.city,
    order.customer.region,
    order.customer.country,
  ].join(", ");
  const text = [
    `New bank-transfer order ${order.orderNumber}`,
    "Payment status: Awaiting manual verification",
    "",
    `Name: ${order.customer.name}`,
    `Email: ${order.customer.email || "Not provided"}`,
    `Phone: ${order.customer.phone}`,
    `Delivery address: ${address}`,
    "",
    "Items:",
    ...itemLines,
    "",
    `Total: ${formatPrice(order.totalAmount)}`,
    `Order details: ${order.receiptUrl}`,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [process.env.ORDER_NOTIFICATION_EMAIL || "taylorgrammm@gmail.com"],
      subject: `New bank-transfer order ${order.orderNumber}`,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 1000);
    throw new Error(`Resend returned ${response.status}: ${details}`);
  }

  return "sent";
}
