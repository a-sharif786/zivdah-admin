import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute';
import { RoleRoute } from '@/components/guards/RoleRoute';
import { RootRedirect } from '@/components/guards/RootRedirect';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { AccessDeniedPage } from '@/pages/AccessDeniedPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { ProductsPage } from '@/pages/admin/ProductsPage';
import { BannersPage } from '@/pages/admin/BannersPage';
import { CouponsPage } from '@/pages/admin/CouponsPage';
import { OrdersPage } from '@/pages/admin/OrdersPage';
import { OrderDetailPage } from '@/pages/admin/OrderDetailPage';
import { PaymentsPage } from '@/pages/admin/PaymentsPage';
import { PaymentDetailPage } from '@/pages/admin/PaymentDetailPage';
import { InventoryPage } from '@/pages/admin/InventoryPage';
import { NotificationsPage } from '@/pages/admin/NotificationsPage';
import { ReviewsPage } from '@/pages/admin/ReviewsPage';

import { VendorDashboardPage } from '@/pages/vendor/VendorDashboardPage';
import { MyProductsPage } from '@/pages/vendor/MyProductsPage';
import { MyOrdersPage } from '@/pages/vendor/MyOrdersPage';
import { OrderDetailPage as VendorOrderDetailPage } from '@/pages/vendor/OrderDetailPage';
import { MyInventoryPage } from '@/pages/vendor/MyInventoryPage';
import { MyNotificationsPage } from '@/pages/vendor/MyNotificationsPage';
import { MyReviewsPage } from '@/pages/vendor/MyReviewsPage';

import { DeliveryDashboardPage } from '@/pages/delivery/DeliveryDashboardPage';
import { MyDeliveriesPage } from '@/pages/delivery/MyDeliveriesPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/access-denied', element: <AccessDeniedPage /> },
      {
        element: <RoleRoute allowed={['ADMIN']} />,
        children: [
          {
            path: '/admin',
            element: <AppLayout />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: 'users', element: <UsersPage /> },
              { path: 'products', element: <ProductsPage /> },
              { path: 'banners', element: <BannersPage /> },
              { path: 'coupons', element: <CouponsPage /> },
              { path: 'orders', element: <OrdersPage /> },
              { path: 'orders/:orderId', element: <OrderDetailPage /> },
              { path: 'payments', element: <PaymentsPage /> },
              { path: 'payments/:paymentId', element: <PaymentDetailPage /> },
              { path: 'inventory', element: <InventoryPage /> },
              { path: 'notifications', element: <NotificationsPage /> },
              { path: 'reviews', element: <ReviewsPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute allowed={['VENDOR']} />,
        children: [
          {
            path: '/vendor',
            element: <AppLayout />,
            children: [
              { index: true, element: <VendorDashboardPage /> },
              { path: 'products', element: <MyProductsPage /> },
              { path: 'orders', element: <MyOrdersPage /> },
              { path: 'orders/:orderId', element: <VendorOrderDetailPage /> },
              { path: 'inventory', element: <MyInventoryPage /> },
              { path: 'notifications', element: <MyNotificationsPage /> },
              { path: 'reviews', element: <MyReviewsPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute allowed={['DELIVERY_BOY']} />,
        children: [
          {
            path: '/delivery',
            element: <AppLayout />,
            children: [
              { index: true, element: <DeliveryDashboardPage /> },
              { path: 'orders', element: <MyDeliveriesPage /> },
            ],
          },
        ],
      },
      { path: '/', element: <RootRedirect /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
