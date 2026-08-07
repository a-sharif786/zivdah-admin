import { apiClient } from '@/api/client';
import type { InventoryResponseDto, StockMutationRequest } from '@/types/inventory';

const BASE = '/restful/v1/api/inventory';

export const inventoryApi = {
  getByProduct: (productId: number) =>
    apiClient.get<InventoryResponseDto>(`${BASE}/${productId}`).then((r) => r.data),

  addStock: (payload: StockMutationRequest) =>
    apiClient.post<InventoryResponseDto>(`${BASE}/add`, payload).then((r) => r.data),

  reserveStock: (payload: StockMutationRequest) =>
    apiClient.post<InventoryResponseDto>(`${BASE}/reserve`, payload).then((r) => r.data),

  releaseStock: (payload: StockMutationRequest) =>
    apiClient.post<InventoryResponseDto>(`${BASE}/release`, payload).then((r) => r.data),

  confirmStock: (payload: StockMutationRequest) =>
    apiClient.post<InventoryResponseDto>(`${BASE}/confirm`, payload).then((r) => r.data),

  getAll: (page: number, size: number) =>
    apiClient.get<InventoryResponseDto[]>(BASE, { params: { page, size } }).then((r) => r.data),
};
