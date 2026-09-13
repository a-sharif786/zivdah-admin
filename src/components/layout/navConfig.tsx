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
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import type { ReactNode } from 'react';

export interface NavItem {
  key: string;
  // Optional when `children` is present — a group header navigates nowhere itself.
  path?: string;
  label: string;
  icon: ReactNode;
  children?: NavItem[];
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
  {
    key: 'support',
    label: 'Support',
    icon: <SupportAgentOutlinedIcon />,
    children: [
      { key: 'support-live', path: '/admin/support/live', label: 'Live Chats', icon: <ChatOutlinedIcon /> },
      { key: 'support-queue', path: '/admin/support/queue', label: 'Waiting Queue', icon: <HourglassEmptyOutlinedIcon /> },
      { key: 'support-mine', path: '/admin/support/mine', label: 'My Chats', icon: <ForumOutlinedIcon /> },
      { key: 'support-all', path: '/admin/support/all', label: 'All Conversations', icon: <ForumOutlinedIcon /> },
      { key: 'support-closed', path: '/admin/support/closed', label: 'Closed Chats', icon: <DoneAllOutlinedIcon /> },
      { key: 'support-history', path: '/admin/support/history', label: 'Chat History', icon: <HistoryOutlinedIcon /> },
      { key: 'support-agents', path: '/admin/support/agents', label: 'Support Agents', icon: <GroupsOutlinedIcon /> },
      { key: 'support-analytics', path: '/admin/support/analytics', label: 'Analytics', icon: <QueryStatsOutlinedIcon /> },
    ],
  },
];

export const VENDOR_NAV: NavItem[] = [
  { key: 'dashboard', path: '/vendor', label: 'Dashboard', icon: <DashboardOutlinedIcon /> },
  { key: 'products', path: '/vendor/products', label: 'My Products', icon: <Inventory2OutlinedIcon /> },
  { key: 'orders', path: '/vendor/orders', label: 'My Orders', icon: <ShoppingCartOutlinedIcon /> },
  { key: 'inventory', path: '/vendor/inventory', label: 'My Inventory', icon: <StorageOutlinedIcon /> },
  { key: 'notifications', path: '/vendor/notifications', label: 'Notifications', icon: <NotificationsOutlinedIcon /> },
  { key: 'reviews', path: '/vendor/reviews', label: 'My Reviews', icon: <StarOutlineOutlinedIcon /> },
];

export const DELIVERY_NAV: NavItem[] = [
  { key: 'dashboard', path: '/delivery', label: 'Dashboard', icon: <DashboardOutlinedIcon /> },
  { key: 'deliveries', path: '/delivery/orders', label: 'My Deliveries', icon: <LocalShippingOutlinedIcon /> },
];
