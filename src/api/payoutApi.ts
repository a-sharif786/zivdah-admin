import { apiClient } from '@/api/client';
import type { AdminPayoutRequestDto, PayoutStatus, VendorPayoutResponseDto } from '@/types/payout';

const BASE = '/restful/v1/api/payments/payouts';

export const payoutApi = {
  request: (amount: number) =>
    apiClient.post<VendorPayoutResponseDto>(BASE, { amount }).then((r) => r.data),

  // Admin-initiated payout for a chosen vendor — lands as REQUESTED same as `request` above,
  // still has to go through `approve` below to actually reach the gateway.
  requestAsAdmin: (dto: AdminPayoutRequestDto) =>
    apiClient.post<VendorPayoutResponseDto>(`${BASE}/admin`, dto).then((r) => r.data),

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
