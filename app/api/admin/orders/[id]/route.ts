import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyStoreAdmin } from "@dashboard/lib/admin-auth";
import {
  createAdminSupabaseClient,
  isSupabaseAdminConfigured,
} from "@dashboard/lib/supabase-server";
import { updateStoreOrderStatusSchema } from "@/lib/store-order-schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const access = await verifyStoreAdmin();
  if (!access.authorized) {
    return NextResponse.json({ error: "Admin access required." }, { status: access.status });
  }
  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: "Supabase admin access is not configured." }, { status: 503 });
  }

  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Order ID is invalid." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = updateStoreOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose whether to mark the order paid or cancel it." },
      { status: 400 },
    );
  }

  const client = createAdminSupabaseClient();
  const { data: existingOrder, error: lookupError } = await client
    .from("tlx_orders")
    .select("id,payment_status")
    .eq("id", id)
    .maybeSingle();

  if (lookupError) {
    console.error("Could not load the order before changing its status.", lookupError);
    return NextResponse.json({ error: "The order status could not be checked." }, { status: 500 });
  }
  if (!existingOrder) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (existingOrder.payment_status !== "awaiting_verification") {
    return NextResponse.json(
      { error: "Only orders awaiting verification can be changed." },
      { status: 409 },
    );
  }

  const changedAt = new Date().toISOString();
  const { data: updatedOrder, error: updateError } = await client
    .from("tlx_orders")
    .update({
      payment_status: parsed.data.status,
      updated_at: changedAt,
      status_updated_by: access.userId,
      payment_verified_at: parsed.data.status === "paid" ? changedAt : null,
    })
    .eq("id", id)
    .eq("payment_status", "awaiting_verification")
    .select("id,order_number,payment_status,updated_at,payment_verified_at")
    .maybeSingle();

  if (updateError) {
    console.error("Could not update the order status.", updateError);
    return NextResponse.json({ error: "The order status could not be updated." }, { status: 500 });
  }
  if (!updatedOrder) {
    return NextResponse.json(
      { error: "The order was updated elsewhere. Refresh the order list and try again." },
      { status: 409 },
    );
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard/overview");
  return NextResponse.json({
    orderId: updatedOrder.id,
    orderNumber: updatedOrder.order_number,
    paymentStatus: updatedOrder.payment_status,
    updatedAt: updatedOrder.updated_at,
    paymentVerifiedAt: updatedOrder.payment_verified_at,
  });
}
