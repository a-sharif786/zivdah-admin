import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  PictureOutlined,
  TagsOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  DatabaseOutlined,
  BellOutlined,
  StarOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

export interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: ReactNode;
}

export const ADMIN_NAV: NavItem[] = [
  { key: 'dashboard', path: '/admin', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: 'users', path: '/admin/users', label: 'Users', icon: <UserOutlined /> },
  { key: 'products', path: '/admin/products', label: 'Products', icon: <ShoppingOutlined /> },
  { key: 'banners', path: '/admin/banners', label: 'Banners', icon: <PictureOutlined /> },
  { key: 'coupons', path: '/admin/coupons', label: 'Coupons', icon: <TagsOutlined /> },
  { key: 'orders', path: '/admin/orders', label: 'Orders', icon: <ShoppingCartOutlined /> },
  { key: 'payments', path: '/admin/payments', label: 'Payments', icon: <CreditCardOutlined /> },
  { key: 'inventory', path: '/admin/inventory', label: 'Inventory', icon: <DatabaseOutlined /> },
  { key: 'notifications', path: '/admin/notifications', label: 'Notifications', icon: <BellOutlined /> },
  { key: 'reviews', path: '/admin/reviews', label: 'Reviews', icon: <StarOutlined /> },
];

export const VENDOR_NAV: NavItem[] = [
  { key: 'dashboard', path: '/vendor', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: 'products', path: '/vendor/products', label: 'My Products', icon: <ShoppingOutlined /> },
  { key: 'orders', path: '/vendor/orders', label: 'My Orders', icon: <ShoppingCartOutlined /> },
  { key: 'inventory', path: '/vendor/inventory', label: 'My Inventory', icon: <DatabaseOutlined /> },
  { key: 'reviews', path: '/vendor/reviews', label: 'My Reviews', icon: <StarOutlined /> },
];
