import type { OrderStatus } from '@/types/order';
import type { PayoutStatus } from '@/types/payout';
import { REVENUE_ORDER_STATUSES } from '@/utils/orderRevenue';

export type FinancialBucket = 'SUCCESSFUL' | 'PENDING' | 'FAILED';

export const FINANCIAL_BUCKETS: FinancialBucket[] = ['SUCCESSFUL', 'PENDING', 'FAILED'];

const FAILED_ORDER_STATUSES = new Set<OrderStatus>(['CANCELLED', 'REFUNDED']);

// Payment-service's own Payment record carries no vendorId (see PaymentServiceImpl) — the only
// place a Payin can be attributed to a vendor is order-service's per-item vendorId. So a Payin's
// "transaction status" here is read off the order's lifecycle status instead of a live Payment
// row: PAID/CONFIRMED/... (REVENUE_ORDER_STATUSES) means the money has landed, CREATED/
// PAYMENT_PENDING means it hasn't yet, CANCELLED/REFUNDED means it was reversed. This mirrors the
// classification VendorDashboardPage already uses for a single vendor's own revenue figures.
export function payinBucketForOrderStatus(status: OrderStatus): FinancialBucket {
  if (REVENUE_ORDER_STATUSES.has(status)) return 'SUCCESSFUL';
  if (FAILED_ORDER_STATUSES.has(status)) return 'FAILED';
  return 'PENDING';
}

const FAILED_PAYOUT_STATUSES = new Set<PayoutStatus>(['FAILED', 'REJECTED']);

export function payoutBucketForStatus(status: PayoutStatus): FinancialBucket {
  if (status === 'SUCCESS') return 'SUCCESSFUL';
  if (FAILED_PAYOUT_STATUSES.has(status)) return 'FAILED';
  return 'PENDING'; // REQUESTED, PROCESSING
}
