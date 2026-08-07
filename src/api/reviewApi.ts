import { apiClient } from '@/api/client';
import type { ReviewResponseDto } from '@/types/review';

const BASE = '/restful/v1/api/reviews';

export const reviewApi = {
  getById: (id: number) => apiClient.get<ReviewResponseDto>(`${BASE}/${id}`).then((r) => r.data),

  getAll: (page: number, size: number) =>
    apiClient.get<ReviewResponseDto[]>(BASE, { params: { page, size } }).then((r) => r.data),

  remove: (id: number) => apiClient.delete<void>(`${BASE}/${id}`).then((r) => r.data),

  getByProduct: (productId: number, page: number, size: number) =>
    apiClient
      .get<ReviewResponseDto[]>(`${BASE}/product/${productId}`, { params: { page, size } })
      .then((r) => r.data),
};
