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

export const FAILURE_REASON_LABELS: Record<FailureReason, string> = {
  CUSTOMER_NOT_AVAILABLE: 'Customer not available',
  WRONG_ADDRESS: 'Wrong address',
  CUSTOMER_REFUSED: 'Customer refused',
  PAYMENT_ISSUE: 'Payment issue',
  DAMAGED_ORDER: 'Damaged order',
  OTHER: 'Other',
};

// Mirrors DeliveryServiceImpl.ALLOWED_TRANSITIONS/VENDOR_ADMIN_TARGETS — used to populate
// the status dropdown with only legal next states for an Admin/Vendor caller. The backend
// re-validates regardless. (DELIVERY_BOY-only targets — PICKED_UP/ON_THE_WAY/DELIVERED/
// FAILED — aren't reachable from this dropdown; see NEXT_DELIVERY_BOY_STATUSES below, used
// by the Delivery portal's own status control instead.)
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

// Mirrors DeliveryServiceImpl's ALLOWED_TRANSITIONS intersected with its
// DELIVERY_BOY_TARGETS set — exactly the next statuses a DELIVERY_BOY caller is authorized
// to set from each current status. PENDING/PACKED have no entry: those transitions belong to
// the vendor/admin (packing the order), see NEXT_VENDOR_DELIVERY_STATUSES above. The backend
// re-validates (and re-checks the caller is the delivery's assigned deliveryBoyId) regardless.
export const NEXT_DELIVERY_BOY_STATUSES: Record<DeliveryStatus, DeliveryStatus[]> = {
  PENDING: [],
  PACKED: [],
  READY_FOR_PICKUP: ['PICKED_UP'],
  PICKED_UP: ['ON_THE_WAY'],
  ON_THE_WAY: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: [],
  CANCELLED: [],
};

export interface DeliveryResponseDto {
  id: number;
  orderId: number;
  // null = no single vendor on this order (platform-owned items only — see
  // OrderServiceClient#getVendorIds on the backend).
  vendorId: number | null;
  userId: number;
  deliveryBoyId: number | null;
  status: DeliveryStatus;
  failureReason: FailureReason | null;
  failureNote: string | null;
  assignedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
