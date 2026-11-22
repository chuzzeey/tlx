import ProductManager from '@dashboard/features/tlx-store/product-manager';
import { requireStoreAdminPage } from '@dashboard/lib/admin-auth';
import { catalogSetupMessage, getAdminCatalog, getAdminCategories, type CatalogProduct } from '@dashboard/lib/catalog-service';
import type { AdminCategory } from '@/data/catalog';

export const metadata = { title: 'Products · TLX Originals Admin' };

export default async function ProductsPage() {
  await requireStoreAdminPage();
  const setupMessage = catalogSetupMessage();
  let products: CatalogProduct[] = [];
  let categories: AdminCategory[] = [];
  let loadError: string | null = null;

  if (!setupMessage) {
    try {
      [products, categories] = await Promise.all([getAdminCatalog(), getAdminCategories()]);
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'The catalog could not be loaded.';
    }
  }

  return <ProductManager initialProducts={products} categories={categories} setupMessage={setupMessage} loadError={loadError} />;
}
