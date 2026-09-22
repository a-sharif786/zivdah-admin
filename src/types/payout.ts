export type PayoutStatus = 'REQUESTED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REJECTED';

// Admin-only creation path lets the mode be chosen explicitly (NEFT/RTGS included); the
// vendor's own request keeps auto-detecting UPI/IMPS from what's on file, so this type is
// only used by AdminPayoutRequestDto below.
export type PayoutMode = 'UPI' | 'IMPS' | 'NEFT' | 'RTGS';

export type PayoutInitiator = 'VENDOR' | 'ADMIN';

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
  initiatedByRole: PayoutInitiator;
  initiatedByUserId: number;
}

export interface AdminPayoutRequestDto {
  vendorId: number;
  amount: number;
  payoutMode: PayoutMode;
}
