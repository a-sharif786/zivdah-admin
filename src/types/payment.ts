export type PaymentMethod =
  | 'CARD'
  | 'UPI'
  | 'NET_BANKING'
  | 'WALLET'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY'
  | 'BANK_TRANSFER'
  | 'COD';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface PaymentResponseDto {
  paymentId: number;
  orderId: number;
  userId: number;
  amount: number;
  currency?: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paymentReference?: string;
  gatewayName?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
}
