import type { Metadata } from "next";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/currency";
import { getStoreOrderReceipt } from "@/lib/store-order-service";

export const dynamic = "force-dynamic";
// Next.js route metadata is required here but is not a React component export.
// eslint-disable-next-line react-refresh/only-export-components -- App Router metadata export.
export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

function paymentStatusLabel(status: "awaiting_verification" | "paid" | "cancelled") {
  if (status === "paid") return "Payment confirmed";
  if (status === "cancelled") return "Order cancelled";
  return "Awaiting payment verification";
}

export default async function OrderReceiptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let order;
  try {
    order = await getStoreOrderReceipt(token);
  } catch (error) {
    console.error("Could not display the shared order receipt.", error);
    throw error;
  }
  if (!order) notFound();

  return (
    <main className="container-x mx-auto max-w-3xl py-10 sm:py-16">
      <section className="overflow-hidden rounded-2xl border border-border bg-background">
        <header className="border-b border-border px-5 py-6 sm:px-8">
          <p className="label-mono">TLX Originals · Order receipt</p>
          <h1 className="mt-3 font-display text-3xl font-light">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("en-NG", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Africa/Lagos",
            })}
          </p>
          <p className="mt-4 inline-flex rounded-full border border-border px-3 py-1 text-xs">
            {paymentStatusLabel(order.paymentStatus)}
          </p>
          {order.paymentStatus === "awaiting_verification" && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The bank transfer will be marked as paid after TLX Originals verifies the payment.
            </p>
          )}
        </header>

        <ul className="divide-y divide-border px-5 sm:px-8">
          {order.items.map((item, index) => (
            <li key={`${item.productName}-${item.size ?? ""}-${index}`} className="flex items-center gap-4 py-4">
              <Image
                src={item.imageUrl}
                alt={item.productName}
                width={80}
                height={80}
                quality={100}
                sizes="80px"
                className="size-20 shrink-0 rounded-xl bg-muted object-contain p-1"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.productName}</p>
                {item.size && <p className="mt-1 text-xs text-muted-foreground">Size {item.size}</p>}
                <p className="mt-1 text-xs text-muted-foreground">Quantity: {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm">{formatPrice(item.unitPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <dl className="space-y-3 border-t border-border px-5 py-5 text-sm sm:px-8">
          <div className="flex justify-between text-muted-foreground">
            <dt>Deliveries</dt>
            <dd>1-3 days</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
            <dt>Total</dt>
            <dd>{formatPrice(order.totalAmount)}</dd>
          </div>
        </dl>

        <details className="group border-t border-border px-5 sm:px-8">
          <summary className="flex cursor-pointer list-none items-center py-4 text-sm font-medium marker:hidden">
            Delivery details
            <ChevronDown
              aria-hidden="true"
              className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <address className="pb-4 text-sm not-italic leading-relaxed text-muted-foreground">
            {order.customerName}
            <br />
            {order.customerPhone}
            {order.customerEmail && (
              <>
                <br />
                {order.customerEmail}
              </>
            )}
            <br />
            {order.street}, {order.city}, {order.region}, {order.country}
          </address>
        </details>
      </section>
    </main>
  );
}
