import StorefrontWhatsAppSettings from "@dashboard/features/tlx-store/storefront-whatsapp-settings";
import { requireStoreAdminPage } from "@dashboard/lib/admin-auth";

// eslint-disable-next-line react-refresh/only-export-components
export const metadata = { title: "My Number · TLX Originals Admin" };

export default async function MyNumberPage() {
  await requireStoreAdminPage();
  return <StorefrontWhatsAppSettings />;
}
