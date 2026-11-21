import { redirect } from 'next/navigation';
import { requireStoreAdminPage } from '@dashboard/lib/admin-auth';

export default async function LegacyProductRoute() {
  await requireStoreAdminPage();
  redirect('/dashboard/product');
}
