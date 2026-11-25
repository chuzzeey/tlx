import { requireStoreAdminPage } from "@dashboard/lib/admin-auth";
import { isSupabaseAdminConfigured } from "@dashboard/lib/supabase-server";
import {
  getAdminStoreOrders,
  type AdminStoreOrder,
} from "@/lib/store-order-admin-service";
import OrderManager from "@dashboard/features/tlx-store/order-manager";

// Next.js page metadata is required here but is not a React component export.
// eslint-disable-next-line react-refresh/only-export-components -- App Router metadata export.
export const metadata = { title: "Orders · TLX Originals Admin" };

export default async function OrdersPage() {
  await requireStoreAdminPage();

  let orders: AdminStoreOrder[] = [];
  let loadError: string | null = null;
  if (!isSupabaseAdminConfigured) {
    loadError = "Supabase admin access is not configured.";
  } else {
    try {
      orders = await getAdminStoreOrders();
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Orders could not be loaded.";
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          TLX Originals · Store admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review customer details and verify incoming bank transfers.
        </p>
      </header>
      {loadError ? (
        <div
          role="alert"
          className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-muted-foreground"
        >
          <p>{loadError}</p>
          <p>
            Apply the TLX orders migration in <code>supabase/migrations</code> to enable order management.
          </p>
        </div>
      ) : (
        <OrderManager initialOrders={orders} />
      )}
    </main>
  );
}
