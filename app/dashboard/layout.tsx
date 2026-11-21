import KBar from '@dashboard/components/kbar';
import AppSidebar from '@dashboard/components/layout/app-sidebar';
import Header from '@dashboard/components/layout/header';
import { SidebarInset, SidebarProvider } from '@dashboard/components/ui/sidebar';
import Providers from '@dashboard/components/layout/providers';
import { requireStoreAdminPage } from '@dashboard/lib/admin-auth';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { cookies } from 'next/headers';
import './dashboard.css';

export const metadata: Metadata = {
  title: 'Admin dashboard — TLX Originals',
  description: 'Manage TLX Originals store operations.',
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireStoreAdminPage();
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <Providers>
      <KBar>
        {/* The sidebar and page share a fixed-height shell with one content scroller. */}
        <SidebarProvider
          defaultOpen={defaultOpen}
          className='dashboard-shell h-dvh'
          style={{ '--sidebar-width-icon': '2.375rem' } as CSSProperties}
        >
          <a
            href='#main-content'
            className='bg-background ring-ring sr-only rounded-md px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:ring-2'
          >
            Skip to content
          </a>
          <AppSidebar />
          <SidebarInset
            id='main-content'
            tabIndex={-1}
            className='md:ring-foreground/10 min-h-0 min-w-0 overflow-hidden outline-none md:ring-1'
          >
            <Header />
            <div
              data-slot='page-scroller'
              className='flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto'
            >
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </KBar>
    </Providers>
  );
}
