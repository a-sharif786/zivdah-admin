import type { FinancialBucket } from '@/utils/financialBuckets';

export type FinancialTxnType = 'PAYIN' | 'PAYOUT';

export interface VendorFinancialTransaction {
  id: string;
  type: FinancialTxnType;
  vendorId: number;
  vendorName: string;
  amount: number;
  bucket: FinancialBucket;
  rawStatus: string;
  date: string; // ISO datetime
  reference: string;
  detail: string;
  orderId?: number;
  payoutId?: number;
}

export interface VendorFinancialSummary {
  vendorId: number;
  vendorName: string;
  payinCount: number;
  payoutCount: number;
  totalPayin: number;
  totalPayout: number;
  netBalance: number;
  successfulPayin: number;
  pendingPayin: number;
  failedPayin: number;
  successfulPayout: number;
  pendingPayout: number;
  failedPayout: number;
  // Computed, not a stored ledger figure — the backend has no wallet/balance entity (confirmed
  // against payment-service and auth-service). Defined as money actually settled: successful
  // Payin received minus successful Payout already paid out.
  availableBalance: number;
}

export interface DateWiseFinancialSummary {
  date: string; // YYYY-MM-DD
  payin: number;
  payout: number;
  net: number;
}
