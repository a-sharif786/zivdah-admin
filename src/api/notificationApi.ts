import { apiClient } from '@/api/client';
import type { NotificationResponseDto, SendNotificationRequest } from '@/types/notification';

const BASE = '/restful/v1/api/notifications';

export const notificationApi = {
  send: (payload: SendNotificationRequest) =>
    apiClient.post<NotificationResponseDto>(`${BASE}/send`, payload).then((r) => r.data),

  getByUser: (userId: number) =>
    apiClient.get<NotificationResponseDto[]>(`${BASE}/user/${userId}`).then((r) => r.data),

  getAll: (page: number, size: number) =>
    apiClient.get<NotificationResponseDto[]>(BASE, { params: { page, size } }).then((r) => r.data),
};
