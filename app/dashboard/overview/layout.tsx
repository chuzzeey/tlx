import type { ReactNode } from 'react';
import { requireStoreAdminPage } from '@dashboard/lib/admin-auth';

export default async function OverviewLayout({ children }: { children: ReactNode }) {
  await requireStoreAdminPage();
  return children;
}
