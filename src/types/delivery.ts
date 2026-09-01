export type DeliveryStatus =
  | 'PENDING'
  | 'PACKED'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type FailureReason =
  | 'CUSTOMER_NOT_AVAILABLE'
  | 'WRONG_ADDRESS'
  | 'CUSTOMER_REFUSED'
  | 'PAYMENT_ISSUE'
  | 'DAMAGED_ORDER'
  | 'OTHER';

// Mirrors DeliveryServiceImpl.ALLOWED_TRANSITIONS/VENDOR_ADMIN_TARGETS — used to populate
// the status dropdown with only legal next states for an Admin/Vendor caller. The backend
// re-validates regardless. (DELIVERY_BOY-only targets — PICKED_UP/ON_THE_WAY/DELIVERED/
// FAILED — aren't reachable from this admin/vendor UI.)
export const NEXT_VENDOR_DELIVERY_STATUSES: Record<DeliveryStatus, DeliveryStatus[]> = {
  PENDING: ['PACKED', 'CANCELLED'],
  PACKED: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['CANCELLED'],
  PICKED_UP: [],
  ON_THE_WAY: [],
  DELIVERED: [],
  FAILED: [],
  CANCELLED: [],
};

export interface DeliveryResponseDto {
  id: number;
  orderId: number;
  vendorId: number;
  userId: number;
  deliveryBoyId: number | null;
  status: DeliveryStatus;
  failureReason: FailureReason | null;
  failureNote: string | null;
  assignedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
