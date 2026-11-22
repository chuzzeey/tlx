import CategoryManager from '@dashboard/features/tlx-store/category-manager';
import { requireStoreAdminPage } from '@dashboard/lib/admin-auth';
import { catalogSetupMessage, getAdminCategories } from '@dashboard/lib/catalog-service';
import type { AdminCategory } from '@/data/catalog';

export const metadata = { title: 'Categories · TLX Originals Admin' };

export default async function CategoriesPage() {
  await requireStoreAdminPage();
  const setupMessage = catalogSetupMessage();
  let categories: AdminCategory[] = [];
  let loadError: string | null = null;

  if (!setupMessage) {
    try {
      categories = await getAdminCategories();
    } catch (cause) {
      loadError = cause instanceof Error ? cause.message : 'Categories could not be loaded.';
    }
  }

  return <CategoryManager initialCategories={categories} setupMessage={setupMessage} loadError={loadError} />;
}
