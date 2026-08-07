import { apiClient } from '@/api/client';
import type { AddressResponseDTO } from '@/types/user';

const BASE = '/restful/v1/api/user';

export const userApi = {
  getAddressesByUser: (userId: number, page: number, size: number) =>
    apiClient
      .get<AddressResponseDTO[]>(`${BASE}/address/user/${userId}`, { params: { page, size } })
      .then((r) => r.data),
};
