export type OrderStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'PACKING'
  | 'READY_FOR_DELIVERY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItemDto {
  productId: number;
  // Denormalized from the product's vendorId at checkout time. Null = platform-owned product.
  vendorId: number | null;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderResponseDto {
  orderId: number;
  orderNumber: string;
  userId: number;
  subTotal: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  deliveryCharge: number;
  packagingCharge: number;
  handlingCharge: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPinCode?: string;
  deliveryCountry?: string;
  items: OrderItemDto[];
  createdAt: string;
  updatedAt: string;
}
