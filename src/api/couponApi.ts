import { apiClient } from '@/api/client';
import type {
  ApplyCouponRequest,
  ApplyCouponResponseDto,
  CouponRequestDto,
  CouponResponseDto,
} from '@/types/coupon';

const BASE = '/restful/v1/api/coupons';

export const couponApi = {
  create: (payload: CouponRequestDto) =>
    apiClient.post<CouponResponseDto>(`${BASE}/create`, payload).then((r) => r.data),

  getByCode: (code: string) => apiClient.get<CouponResponseDto>(`${BASE}/${code}`).then((r) => r.data),

  getAll: () => apiClient.get<CouponResponseDto[]>(`${BASE}/all`).then((r) => r.data),

  toggle: (couponId: number) =>
    apiClient.put<CouponResponseDto>(`${BASE}/${couponId}/toggle`).then((r) => r.data),

  remove: (couponId: number) => apiClient.delete<void>(`${BASE}/${couponId}`).then((r) => r.data),

  apply: (payload: ApplyCouponRequest) =>
    apiClient.post<ApplyCouponResponseDto>(`${BASE}/apply`, payload).then((r) => r.data),
};
