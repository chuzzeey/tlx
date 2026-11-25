"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronDown, ClipboardList, Search } from "lucide-react";
import type {
  AdminStoreOrder,
  AdminStoreOrderStatus,
} from "@/lib/store-order-admin-service";
import { formatPrice } from "@/lib/currency";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@dashboard/components/ui/alert-dialog";
import { updateStoreOrderStatusResponseSchema } from "@/lib/store-order-schema";

type StatusFilter = "all" | AdminStoreOrderStatus;
type PendingAction = {
  order: AdminStoreOrder;
  status: "paid" | "cancelled";
};

const pageSize = 10;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function statusLabel(status: AdminStoreOrderStatus) {
  if (status === "paid") return "Paid";
  if (status === "cancelled") return "Cancelled";
  return "Awaiting verification";
}

function emailStatusLabel(status: AdminStoreOrder["emailStatus"]) {
  if (status === "sent") return "Store email sent";
  if (status === "sending") return "Store email sending";
  if (status === "not_configured") return "Store email not configured";
  if (status === "failed") return "Store email failed";
  return "Store email pending";
}

export default function OrderManager({
  initialOrders,
}: {
  initialOrders: AdminStoreOrder[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    initialOrders.some((order) => order.paymentStatus === "awaiting_verification")
      ? "awaiting_verification"
      : "all",
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.paymentStatus === statusFilter;
      const matchesSearch =
        !query ||
        [order.orderNumber, order.customerName, order.customerPhone, order.customerEmail ?? ""]
          .some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const awaitingCount = orders.filter((order) => order.paymentStatus === "awaiting_verification").length;
  const paidOrders = orders.filter((order) => order.paymentStatus === "paid");
  const paidTotal = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  async function changeStatus(action: PendingAction) {
    if (savingOrderId) return;
    setSavingOrderId(action.order.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(action.order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action.status }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "The order status could not be updated.";
        throw new Error(message);
      }

      const parsedResult = updateStoreOrderStatusResponseSchema.safeParse(result);
      if (
        !parsedResult.success ||
        parsedResult.data.orderId !== action.order.id ||
        parsedResult.data.paymentStatus !== action.status
      ) {
        throw new Error("The server returned an invalid order status update.");
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === action.order.id
            ? {
                ...order,
                paymentStatus: action.status,
                updatedAt: parsedResult.data.updatedAt,
                paymentVerifiedAt: parsedResult.data.paymentVerifiedAt,
              }
            : order,
        ),
      );
      const hasOtherAwaitingOrders = orders.some(
        (order) =>
          order.id !== action.order.id && order.paymentStatus === "awaiting_verification",
      );
      if (action.status === "paid" || action.status === "cancelled") {
        setStatusFilter(hasOtherAwaitingOrders ? "awaiting_verification" : "all");
        setPage(1);
      }
      setPendingAction(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The order status could not be updated.");
    } finally {
      setSavingOrderId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Awaiting verification</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{awaitingCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Of the latest {orders.length} orders</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Paid orders</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{paidOrders.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Of the latest {orders.length} orders</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Paid total</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatPrice(paidTotal)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Paid orders in this view</p>
        </article>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold tracking-tight">Recent orders</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {filteredOrders.length} matching · latest {orders.length} loaded
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Search orders</span>
            <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search order or customer"
              className="min-h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm sm:w-64"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">Filter by payment status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
              className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="awaiting_verification">Awaiting verification</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
              <option value="all">All statuses</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {visibleOrders.length ? (
        <div className="space-y-3">
          {visibleOrders.map((order) => (
            <article key={order.id} className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-mono text-sm font-semibold">{order.orderNumber}</h3>
                    <span
                      className={
                        order.paymentStatus === "paid"
                          ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700"
                          : order.paymentStatus === "cancelled"
                            ? "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                            : "rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700"
                      }
                    >
                      {statusLabel(order.paymentStatus)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.customerName} · {order.customerPhone}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-semibold tabular-nums">{formatPrice(order.totalAmount)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{order.items.length} line items</p>
                </div>
              </header>

              <details className="group mt-4 border-t border-border pt-3">
                <summary className="grid min-h-8 cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-sm font-medium marker:hidden">
                  <ClipboardList aria-hidden className="size-4 text-muted-foreground" />
                  <span className="leading-5">Order and delivery details</span>
                  <ChevronDown aria-hidden className="size-4 justify-self-end text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.7fr)]">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</h4>
                    <ul className="mt-2 divide-y divide-border">
                      {order.items.map((item, index) => (
                        <li key={`${item.productName}-${item.size ?? ""}-${index}`} className="flex items-center gap-3 py-3">
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            width={56}
                            height={56}
                            sizes="56px"
                            className="size-14 shrink-0 rounded-lg bg-muted object-contain p-1"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{item.productName}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.size ? `Size ${item.size} · ` : ""}Qty {item.quantity}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm tabular-nums">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</h4>
                      <p className="mt-2">{order.customerName}</p>
                      <a
                        className="mt-1 block text-primary underline-offset-4 hover:underline"
                        href={`tel:${order.customerPhone.replace(/[^\d+]/g, "")}`}
                      >
                        {order.customerPhone}
                      </a>
                      {order.customerEmail && <p className="mt-1 break-all text-muted-foreground">{order.customerEmail}</p>}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery address</h4>
                      <address className="mt-2 leading-relaxed text-muted-foreground not-italic">
                        {order.street}, {order.city}, {order.region}, {order.country}
                      </address>
                      <p className="mt-2 text-xs text-muted-foreground">Estimated delivery: 1-3 days</p>
                    </div>
                    <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                      {emailStatusLabel(order.emailStatus)}
                    </p>
                    {order.paymentVerifiedAt && (
                      <p className="text-xs text-muted-foreground">
                        Verified {formatDate(order.paymentVerifiedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </details>

              {order.paymentStatus === "awaiting_verification" && (
                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setPendingAction({ order, status: "cancelled" })}
                    className="min-h-9 rounded-md border border-destructive/30 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
                  >
                    Cancel order
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction({ order, status: "paid" })}
                    className="min-h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Mark as paid
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">{orders.length ? "No orders match this filter." : "No orders yet."}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {orders.length
              ? "Try another status or search term."
              : "Orders placed through bank-transfer checkout will appear here."}
          </p>
        </div>
      )}

      {filteredOrders.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous order page"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="min-h-9 rounded-md border px-3 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              aria-label="Next order page"
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
              className="min-h-9 rounded-md border px-3 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open && !savingOrderId) setPendingAction(null);
        }}
      >
        {pendingAction && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pendingAction.status === "paid" ? "Mark this order as paid?" : "Cancel this order?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingAction.status === "paid"
                  ? `Only confirm ${pendingAction.order.orderNumber} after verifying the bank transfer in your account.`
                  : `This will cancel ${pendingAction.order.orderNumber}. It will not issue a refund or move money.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={savingOrderId !== null}>Keep order</AlertDialogCancel>
              <AlertDialogAction
                disabled={savingOrderId !== null}
                onClick={(event) => {
                  event.preventDefault();
                  void changeStatus(pendingAction);
                }}
                className={
                  pendingAction.status === "cancelled"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : ""
                }
              >
                {savingOrderId === pendingAction.order.id
                  ? "Saving…"
                  : pendingAction.status === "paid"
                    ? "Confirm payment"
                    : "Confirm cancellation"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </section>
  );
}
