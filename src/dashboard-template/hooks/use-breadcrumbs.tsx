'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard/overview' }],
  '/dashboard/overview': [{ title: 'Dashboard', link: '/dashboard/overview' }],
  '/dashboard/product': [{ title: 'Products', link: '/dashboard/product' }],
  '/dashboard/orders': [{ title: 'Orders', link: '/dashboard/orders' }],
  '/dashboard/categories': [{ title: 'Category', link: '/dashboard/categories' }],
  '/dashboard/reviews': [{ title: 'Reviews', link: '/dashboard/reviews' }],
  '/dashboard/profile': [{ title: 'Profile', link: '/dashboard/profile' }],
  '/dashboard/storefront-preview': [
    { title: 'Storefront preview', link: '/dashboard/storefront-preview' }
  ]
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
