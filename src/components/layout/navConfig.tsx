import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import StarOutlineOutlinedIcon from '@mui/icons-material/StarOutlineOutlined';
import type { ReactNode } from 'react';

export interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: ReactNode;
}

export const ADMIN_NAV: NavItem[] = [
  { key: 'dashboard', path: '/admin', label: 'Dashboard', icon: <DashboardOutlinedIcon /> },
  { key: 'users', path: '/admin/users', label: 'Users', icon: <PeopleAltOutlinedIcon /> },
  { key: 'products', path: '/admin/products', label: 'Products', icon: <Inventory2OutlinedIcon /> },
  { key: 'banners', path: '/admin/banners', label: 'Banners', icon: <ImageOutlinedIcon /> },
  { key: 'coupons', path: '/admin/coupons', label: 'Coupons', icon: <LocalOfferOutlinedIcon /> },
  { key: 'orders', path: '/admin/orders', label: 'Orders', icon: <ShoppingCartOutlinedIcon /> },
  { key: 'payments', path: '/admin/payments', label: 'Payments', icon: <CreditCardOutlinedIcon /> },
  { key: 'inventory', path: '/admin/inventory', label: 'Inventory', icon: <StorageOutlinedIcon /> },
  { key: 'notifications', path: '/admin/notifications', label: 'Notifications', icon: <NotificationsOutlinedIcon /> },
  { key: 'reviews', path: '/admin/reviews', label: 'Reviews', icon: <StarOutlineOutlinedIcon /> },
];

export const VENDOR_NAV: NavItem[] = [
  { key: 'dashboard', path: '/vendor', label: 'Dashboard', icon: <DashboardOutlinedIcon /> },
  { key: 'products', path: '/vendor/products', label: 'My Products', icon: <Inventory2OutlinedIcon /> },
  { key: 'orders', path: '/vendor/orders', label: 'My Orders', icon: <ShoppingCartOutlinedIcon /> },
  { key: 'inventory', path: '/vendor/inventory', label: 'My Inventory', icon: <StorageOutlinedIcon /> },
  { key: 'notifications', path: '/vendor/notifications', label: 'Notifications', icon: <NotificationsOutlinedIcon /> },
  { key: 'reviews', path: '/vendor/reviews', label: 'My Reviews', icon: <StarOutlineOutlinedIcon /> },
];
