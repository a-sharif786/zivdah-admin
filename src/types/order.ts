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

// Mirrors OrderServiceImpl.ALLOWED_TRANSITIONS (order-service) — used to populate the status
// dropdown with only legal next states. The backend re-validates regardless.
export const NEXT_ORDER_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['PAYMENT_PENDING', 'PAID', 'CANCELLED'],
  PAYMENT_PENDING: ['PAID', 'CANCELLED'],
  PAID: ['CONFIRMED', 'CANCELLED', 'REFUNDED'],
  CONFIRMED: ['PACKING', 'CANCELLED', 'REFUNDED'],
  PACKING: ['READY_FOR_DELIVERY', 'REFUNDED'],
  READY_FOR_DELIVERY: ['OUT_FOR_DELIVERY', 'REFUNDED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export interface OrderStatsResponseDto {
  // All-time count, unaffected by the range used to fetch this.
  totalOrders: number;
  // Everything below is scoped to the requested [from, to] range.
  ordersInRange: number;
  statusBreakdown: Partial<Record<OrderStatus, number>>;
  revenueInRange: number;
}

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
