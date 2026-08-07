import { apiClient } from '@/api/client';
import type { OrderResponseDto, OrderStatus } from '@/types/order';

const BASE = '/restful/v1/api/orders';

export const orderApi = {
  getById: (orderId: number) => apiClient.get<OrderResponseDto>(`${BASE}/${orderId}`).then((r) => r.data),

  getByUser: (userId: number) =>
    apiClient.get<OrderResponseDto[]>(`${BASE}/user/${userId}`).then((r) => r.data),

  cancel: (orderId: number) => apiClient.put<void>(`${BASE}/cancel/${orderId}`).then((r) => r.data),

  getAll: (page: number, size: number, status?: OrderStatus) =>
    apiClient
      .get<OrderResponseDto[]>(`${BASE}/all`, { params: { page, size, status } })
      .then((r) => r.data),

  getByVendor: (vendorId: number, page: number, size: number) =>
    apiClient
      .get<OrderResponseDto[]>(`${BASE}/vendor/${vendorId}`, { params: { page, size } })
      .then((r) => r.data),
};
