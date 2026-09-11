import { apiClient } from '@/api/client';
import type { PaymentResponseDto, PaymentStatsResponseDto, PaymentStatus } from '@/types/payment';

const BASE = '/restful/v1/api/payments';

export const paymentApi = {
  getById: (paymentId: number) => apiClient.get<PaymentResponseDto>(`${BASE}/${paymentId}`).then((r) => r.data),

  getByOrder: (orderId: number) =>
    apiClient.get<PaymentResponseDto[]>(`${BASE}/order/${orderId}`).then((r) => r.data),

  markSuccess: (paymentId: number) =>
    apiClient.put<PaymentResponseDto>(`${BASE}/success/${paymentId}`).then((r) => r.data),

  markFailed: (paymentId: number) =>
    apiClient.put<PaymentResponseDto>(`${BASE}/failed/${paymentId}`).then((r) => r.data),

  refund: (paymentId: number, amount: number) =>
    apiClient.put<PaymentResponseDto>(`${BASE}/refund/${paymentId}`, { amount }).then((r) => r.data),

  getAll: (page: number, size: number, status?: PaymentStatus) =>
    apiClient
      .get<PaymentResponseDto[]>(`${BASE}/all`, { params: { page, size, status } })
      .then((r) => r.data),

  // from/to are ISO local datetimes, e.g. dayjs(...).format('YYYY-MM-DDTHH:mm:ss')
  getStats: (from: string, to: string) =>
    apiClient.get<PaymentStatsResponseDto>(`${BASE}/stats`, { params: { from, to } }).then((r) => r.data),
};
