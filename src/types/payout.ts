export type PayoutStatus = 'REQUESTED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REJECTED';

export interface VendorPayoutResponseDto {
  payoutId: number;
  vendorId: number;
  amount: number;
  payoutMode: string;
  accountNo?: string | null;
  ifscBankCode?: string | null;
  payeeVpa?: string | null;
  status: PayoutStatus;
  gatewayStatus?: string | null;
  gatewayDescription?: string | null;
  utrNumber?: string | null;
  rejectionReason?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  settledAt?: string | null;
}
