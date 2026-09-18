import { apiClient } from '@/api/client';
import type { PayoutStatus, VendorPayoutResponseDto } from '@/types/payout';

const BASE = '/restful/v1/api/payments/payouts';

export const payoutApi = {
  request: (amount: number) =>
    apiClient.post<VendorPayoutResponseDto>(BASE, { amount }).then((r) => r.data),

  mine: () => apiClient.get<VendorPayoutResponseDto[]>(`${BASE}/mine`).then((r) => r.data),

  getAll: (status?: PayoutStatus) =>
    apiClient.get<VendorPayoutResponseDto[]>(BASE, { params: { status } }).then((r) => r.data),

  approve: (payoutId: number) =>
    apiClient.put<VendorPayoutResponseDto>(`${BASE}/${payoutId}/approve`).then((r) => r.data),

  reject: (payoutId: number, reason: string) =>
    apiClient.put<VendorPayoutResponseDto>(`${BASE}/${payoutId}/reject`, { reason }).then((r) => r.data),

  refreshStatus: (payoutId: number) =>
    apiClient.get<VendorPayoutResponseDto>(`${BASE}/${payoutId}/refresh-status`).then((r) => r.data),
};
