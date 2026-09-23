import type { OrderStatus } from '@/types/order';

// Orders in these statuses represent money that has actually moved from a customer's payment
// into a vendor's revenue (or will, once shipped) — excludes not-yet-paid
// (CREATED/PAYMENT_PENDING) and reversed (CANCELLED/REFUNDED) orders. Single source of truth for
// "what counts as paid revenue", shared by VendorDashboardPage and VendorFinancialsPage so the
// definition can't drift between the two.
export const REVENUE_ORDER_STATUSES = new Set<OrderStatus>([
  'PAID',
  'CONFIRMED',
  'PACKING',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]);

export function sumSubtotal(items: { subtotal: number }[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}
