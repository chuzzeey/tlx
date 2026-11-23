import { NavGroup } from '@dashboard/types';

/** Navigation configuration shared by the dashboard sidebar and command palette. */
export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Products',
        url: '/dashboard/product',
        icon: 'product',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Category',
        url: '/dashboard/categories',
        icon: 'categories',
        isActive: false,
        items: []
      },
      {
        title: 'Reviews',
        url: '/dashboard/reviews',
        icon: 'badgeCheck',
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Account',
    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'profile',
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Storefront',
    items: [
      {
        title: 'My Number',
        url: '/dashboard/my-number',
        icon: 'phone',
        isActive: false,
        items: []
      },
      {
        title: 'Preview storefront',
        url: '/dashboard/storefront-preview',
        icon: 'laptop',
        isActive: false,
        items: []
      }
    ]
  }
];
