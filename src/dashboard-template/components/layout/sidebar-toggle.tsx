'use client';
import { Icons } from '@dashboard/components/icons';
import { Button } from '@dashboard/components/ui/button';
import { useSidebar } from '@dashboard/components/ui/sidebar';

// The icon shows what the click will do: close an open sidebar, open a closed one
export function SidebarToggle() {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar();
  const sidebarOpen = isMobile ? openMobile : open;

  return (
    <Button
      variant='ghost'
      size='icon'
      className='text-muted-foreground hover:text-foreground -ml-1'
      aria-label='Toggle sidebar'
      aria-expanded={sidebarOpen}
      onClick={toggleSidebar}
    >
      {sidebarOpen ? <Icons.panelLeftClose /> : <Icons.panelLeftOpen />}
    </Button>
  );
}
