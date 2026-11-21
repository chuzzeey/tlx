import ProductManager from '@dashboard/features/tlx-store/product-manager';
import { requireStoreAdminPage } from '@dashboard/lib/admin-auth';
import { catalogSetupMessage, getAdminCatalog, type CatalogProduct } from '@dashboard/lib/catalog-service';

export const metadata = { title: 'Products · TLX Originals Admin' };

export default async function ProductsPage() {
  await requireStoreAdminPage();
  const setupMessage = catalogSetupMessage();
  let products: CatalogProduct[] = [];
  let loadError: string | null = null;

  if (!setupMessage) {
    try {
      products = await getAdminCatalog();
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'The catalog could not be loaded.';
    }
  }

  return <ProductManager initialProducts={products} setupMessage={setupMessage} loadError={loadError} />;
}
