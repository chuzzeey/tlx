import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { SidebarToggle } from './sidebar-toggle';
import { Icons } from '@dashboard/components/icons';
import Link from 'next/link';

export default function Header() {
  return (
    <header className='dashboard-topbar flex h-14 shrink-0 items-center gap-3 border-b px-3 md:px-6'>
      <div className='flex min-w-0 flex-1 items-center'>
        <SidebarToggle />
        <Separator
          orientation='vertical'
          className='mr-3 ml-1.5 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center'
        />
        <Breadcrumbs />
      </div>

      <div className='flex shrink-0 items-center gap-1'>
        <SearchInput />
        <Link
          href='/dashboard/storefront-preview'
          title='Preview storefront'
          aria-label='Preview storefront'
          className='dashboard-preview-link inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:w-auto lg:gap-2 lg:px-3'
        >
          <Icons.laptop className='size-4 shrink-0' />
          <span className='hidden whitespace-nowrap text-sm lg:inline'>Preview storefront</span>
        </Link>
      </div>
    </header>
  );
}
