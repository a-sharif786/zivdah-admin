import { apiClient } from '@/api/client';
import type { DeliveryResponseDto, DeliveryStatus, FailureReason } from '@/types/delivery';

const BASE = '/restful/v1/api/delivery';

export const deliveryApi = {
  // Visibility-filtered server-side — Admin sees every vendor-portion of the order, Vendor
  // only their own (see DeliveryController#getByOrder).
  getByOrder: (orderId: number) =>
    apiClient.get<DeliveryResponseDto[]>(`${BASE}/order/${orderId}`).then((r) => r.data),

  assign: (deliveryId: number, deliveryBoyId: number) =>
    apiClient.post<DeliveryResponseDto>(`${BASE}/${deliveryId}/assign`, { deliveryBoyId }).then((r) => r.data),

  updateStatus: (deliveryId: number, status: DeliveryStatus, failureReason?: FailureReason, failureNote?: string) =>
    apiClient
      .patch<DeliveryResponseDto>(`${BASE}/${deliveryId}/status`, { status, failureReason, failureNote })
      .then((r) => r.data),

  getByVendor: (vendorId: number, page: number, size: number) =>
    apiClient
      .get<DeliveryResponseDto[]>(`${BASE}/vendor/${vendorId}`, { params: { page, size } })
      .then((r) => r.data),

  // A delivery boy's own assigned deliveries — no path id needed, scoped to the caller
  // server-side (DeliveryController#getMyDeliveries, hasRole('DELIVERY_BOY')).
  getMy: (page: number, size: number) =>
    apiClient.get<DeliveryResponseDto[]>(`${BASE}/my`, { params: { page, size } }).then((r) => r.data),
};
