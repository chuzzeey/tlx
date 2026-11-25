import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPublishedCatalog } from "@dashboard/lib/catalog-service";
import { createAdminSupabaseClient, isSupabaseAdminConfigured } from "@dashboard/lib/supabase-server";
import { defaultProductSize, productSizeOptions } from "@/lib/product-variants";
import {
  createStoreOrderSchema,
  type CreateStoreOrderResponse,
} from "@/lib/store-order-schema";
import { sendStoreOrderEmail } from "@/lib/store-order-email";

type OrderItemSnapshot = {
  product_id: string;
  product_name: string;
  image_url: string;
  size: string | null;
  quantity: number;
  unit_price: number;
  position: number;
};

type EmailStatus = CreateStoreOrderResponse["emailStatus"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOrderRpcRow(
  value: unknown,
): value is {
  order_id: string;
  order_number: string;
  receipt_token_hash: string;
  email_status: string;
  was_created: boolean;
} {
  return (
    isRecord(value) &&
    typeof value.order_id === "string" &&
    typeof value.order_number === "string" &&
    typeof value.receipt_token_hash === "string" &&
    typeof value.email_status === "string" &&
    typeof value.was_created === "boolean"
  );
}

function isEmailStatus(value: string): value is EmailStatus {
  return value === "sent" || value === "sending" || value === "failed" || value === "not_configured";
}

function orderEmailMessage(status: EmailStatus) {
  if (status === "sent") return undefined;
  if (status === "sending") return "The order is saved. The store email is still being sent.";
  if (status === "not_configured") return "The order is saved, but store email is not configured yet.";
  return "The order is saved, but the store email could not be sent.";
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = createStoreOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Checkout details are invalid.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: "Order storage is not configured." }, { status: 503 });
  }

  let catalog;
  try {
    catalog = await getPublishedCatalog();
  } catch (error) {
    console.error("Could not verify checkout items against the published catalog.", error);
    return NextResponse.json(
      { error: "The catalog is unavailable. Please try again before placing your order." },
      { status: 503 },
    );
  }

  const items: OrderItemSnapshot[] = [];
  let totalCents = 0;
  const requestedQuantityByProduct = new Map<string, number>();
  for (const requestedItem of parsed.data.items) {
    requestedQuantityByProduct.set(
      requestedItem.productId,
      (requestedQuantityByProduct.get(requestedItem.productId) ?? 0) + requestedItem.quantity,
    );
  }

  for (const requestedItem of parsed.data.items) {
    const product = catalog.find((candidate) => candidate.id === requestedItem.productId);
    if (
      !product ||
      !product.inStock ||
      product.stock < (requestedQuantityByProduct.get(requestedItem.productId) ?? requestedItem.quantity)
    ) {
      return NextResponse.json(
        { error: "One or more items are no longer available in the requested quantity." },
        { status: 409 },
      );
    }

    const availableSizes = productSizeOptions(product);
    const size = requestedItem.size ?? defaultProductSize(product) ?? null;
    if (
      (availableSizes.length > 0 && (!size || !availableSizes.includes(size))) ||
      (availableSizes.length === 0 && requestedItem.size)
    ) {
      return NextResponse.json(
        { error: `The selected size is not available for ${product.name}.` },
        { status: 409 },
      );
    }

    if (!Number.isFinite(product.price) || product.price < 0) {
      console.error("Published product has an invalid price.", { productId: product.id });
      return NextResponse.json({ error: "A product price could not be verified." }, { status: 503 });
    }

    const unitPriceCents = Math.round(product.price * 100);
    totalCents += unitPriceCents * requestedItem.quantity;
    items.push({
      product_id: product.id,
      product_name: product.name,
      image_url: product.image,
      size,
      quantity: requestedItem.quantity,
      unit_price: unitPriceCents / 100,
      position: items.length,
    });
  }

  if (Math.round(parsed.data.expectedTotalAmount * 100) !== totalCents) {
    return NextResponse.json(
      { error: "Product prices changed. Review your order summary before making the transfer." },
      { status: 409 },
    );
  }

  const customer = parsed.data.customer;
  const receiptTokenHash = createHash("sha256").update(parsed.data.receiptToken).digest("hex");
  const admin = createAdminSupabaseClient();
  const { data: rpcData, error: createError } = await admin.rpc("create_tlx_order", {
    p_idempotency_key: parsed.data.idempotencyKey,
    p_receipt_token_hash: receiptTokenHash,
    p_customer_name: customer.name,
    p_customer_email: customer.email?.trim() ?? "",
    p_customer_phone: customer.phone,
    p_street: customer.street,
    p_city: customer.city,
    p_region: customer.region,
    p_country: customer.country,
    p_total_amount: totalCents / 100,
    p_items: items,
  });

  if (createError) {
    console.error("Could not create checkout order.", createError);
    return NextResponse.json({ error: "Your order could not be saved. Please try again." }, { status: 500 });
  }

  const rawRpcData: unknown = rpcData;
  const rpcRow = Array.isArray(rawRpcData) ? rawRpcData[0] : null;
  if (!isOrderRpcRow(rpcRow) || rpcRow.receipt_token_hash !== receiptTokenHash) {
    console.error("Supabase returned an invalid result while creating a checkout order.");
    return NextResponse.json({ error: "Your order could not be confirmed. Please try again." }, { status: 500 });
  }

  const receiptUrl = new URL(
    `/order/${parsed.data.receiptToken}`,
    process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin,
  ).toString();
  let emailStatus: EmailStatus;

  if (rpcRow.email_status === "sent") {
    emailStatus = "sent";
  } else {
    const { data: emailClaim, error: claimError } = await admin
      .from("tlx_orders")
      .update({ email_status: "sending" })
      .eq("id", rpcRow.order_id)
      .in("email_status", ["pending", "failed", "not_configured"])
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error("Could not claim the store order email notification.", claimError);
      emailStatus = "failed";
    } else if (!emailClaim) {
      const { data: currentOrder, error: statusReadError } = await admin
        .from("tlx_orders")
        .select("email_status")
        .eq("id", rpcRow.order_id)
        .maybeSingle();
      if (statusReadError) {
        console.error("Could not read the current store order email status.", statusReadError);
        emailStatus = "failed";
      } else {
        emailStatus =
          currentOrder && isEmailStatus(currentOrder.email_status)
            ? currentOrder.email_status
            : "failed";
      }
    } else {
      try {
        emailStatus = await sendStoreOrderEmail({
          orderNumber: rpcRow.order_number,
          receiptUrl,
          customer,
          items: items.map((item) => ({
            productName: item.product_name,
            size: item.size,
            quantity: item.quantity,
            unitPrice: item.unit_price,
          })),
          totalAmount: totalCents / 100,
        });
      } catch (error) {
        console.error("Could not send the store order email.", error);
        emailStatus = "failed";
      }

      const { error: statusError } = await admin
        .from("tlx_orders")
        .update({ email_status: emailStatus })
        .eq("id", rpcRow.order_id);
      if (statusError) {
        console.error("Could not save the store order email status.", statusError);
      }
    }
  }

  const response: CreateStoreOrderResponse = {
    orderId: rpcRow.order_number,
    receiptUrl,
    emailStatus,
  };
  return NextResponse.json(
    {
      ...response,
      ...(orderEmailMessage(emailStatus) ? { message: orderEmailMessage(emailStatus) } : {}),
    },
    { status: rpcRow.was_created ? 201 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
