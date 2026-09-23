import dayjs from 'dayjs';
import type { OrderResponseDto } from '@/types/order';
import type { VendorPayoutResponseDto } from '@/types/payout';
import type {
  DateWiseFinancialSummary,
  VendorFinancialSummary,
  VendorFinancialTransaction,
} from '@/types/vendorFinancials';
import { payinBucketForOrderStatus, payoutBucketForStatus } from '@/utils/financialBuckets';

// One order can carry line items from several vendors (see OrderItem.vendorId) — a "Payin
// transaction" for a given vendor is that vendor's own subtotal share of the order, not the
// order's totalAmount. Platform-owned items (vendorId === null) have no vendor to attribute to
// and are excluded.
export function buildPayinTransactions(
  orders: OrderResponseDto[],
  vendorNameById: Map<number, string>,
): VendorFinancialTransaction[] {
  const transactions: VendorFinancialTransaction[] = [];
  for (const order of orders) {
    const amountByVendor = new Map<number, number>();
    for (const item of order.items) {
      if (item.vendorId == null) continue;
      amountByVendor.set(item.vendorId, (amountByVendor.get(item.vendorId) ?? 0) + item.subtotal);
    }
    for (const [vendorId, amount] of amountByVendor) {
      transactions.push({
        id: `payin-${order.orderId}-${vendorId}`,
        type: 'PAYIN',
        vendorId,
        vendorName: vendorNameById.get(vendorId) ?? `Vendor #${vendorId}`,
        amount,
        bucket: payinBucketForOrderStatus(order.status),
        rawStatus: order.status,
        date: order.createdAt,
        reference: order.orderNumber,
        detail: `Order ${order.orderNumber}`,
        orderId: order.orderId,
      });
    }
  }
  return transactions;
}

export function buildPayoutTransactions(
  payouts: VendorPayoutResponseDto[],
  vendorNameById: Map<number, string>,
): VendorFinancialTransaction[] {
  return payouts.map((payout) => ({
    id: `payout-${payout.payoutId}`,
    type: 'PAYOUT',
    vendorId: payout.vendorId,
    vendorName: vendorNameById.get(payout.vendorId) ?? `Vendor #${payout.vendorId}`,
    amount: payout.amount,
    bucket: payoutBucketForStatus(payout.status),
    rawStatus: payout.status,
    date: payout.requestedAt,
    reference: `Payout #${payout.payoutId}`,
    detail: payout.payeeVpa || payout.accountNo || payout.payoutMode,
    payoutId: payout.payoutId,
  }));
}

function emptySummary(vendorId: number, vendorName: string): VendorFinancialSummary {
  return {
    vendorId,
    vendorName,
    payinCount: 0,
    payoutCount: 0,
    totalPayin: 0,
    totalPayout: 0,
    netBalance: 0,
    successfulPayin: 0,
    pendingPayin: 0,
    failedPayin: 0,
    successfulPayout: 0,
    pendingPayout: 0,
    failedPayout: 0,
    availableBalance: 0,
  };
}

// `vendors` seeds one row per known vendor (so a vendor with zero activity in the current
// filters still shows up as all-zero, rather than silently disappearing from "all vendors").
export function summarizeByVendor(
  transactions: VendorFinancialTransaction[],
  vendors: { userId: number; name: string }[],
): VendorFinancialSummary[] {
  const byVendor = new Map<number, VendorFinancialSummary>();
  for (const v of vendors) byVendor.set(v.userId, emptySummary(v.userId, v.name));

  for (const txn of transactions) {
    let summary = byVendor.get(txn.vendorId);
    if (!summary) {
      summary = emptySummary(txn.vendorId, txn.vendorName);
      byVendor.set(txn.vendorId, summary);
    }
    if (txn.type === 'PAYIN') {
      summary.payinCount += 1;
      summary.totalPayin += txn.amount;
      if (txn.bucket === 'SUCCESSFUL') summary.successfulPayin += txn.amount;
      else if (txn.bucket === 'PENDING') summary.pendingPayin += txn.amount;
      else summary.failedPayin += txn.amount;
    } else {
      summary.payoutCount += 1;
      summary.totalPayout += txn.amount;
      if (txn.bucket === 'SUCCESSFUL') summary.successfulPayout += txn.amount;
      else if (txn.bucket === 'PENDING') summary.pendingPayout += txn.amount;
      else summary.failedPayout += txn.amount;
    }
  }

  for (const summary of byVendor.values()) {
    summary.netBalance = summary.totalPayin - summary.totalPayout;
    summary.availableBalance = summary.successfulPayin - summary.successfulPayout;
  }

  return Array.from(byVendor.values()).sort((a, b) => b.totalPayin - a.totalPayin);
}

export function summarizeByDate(transactions: VendorFinancialTransaction[]): DateWiseFinancialSummary[] {
  const byDate = new Map<string, DateWiseFinancialSummary>();
  for (const txn of transactions) {
    const day = dayjs(txn.date).format('YYYY-MM-DD');
    let entry = byDate.get(day);
    if (!entry) {
      entry = { date: day, payin: 0, payout: 0, net: 0 };
      byDate.set(day, entry);
    }
    if (txn.type === 'PAYIN') entry.payin += txn.amount;
    else entry.payout += txn.amount;
    entry.net = entry.payin - entry.payout;
  }
  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}
