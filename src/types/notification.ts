export interface NotificationResponseDto {
  id: number;
  userId: number;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  recipientRole?: string;
  notificationType?: string;
  entityType?: string;
  entityId?: number;
  isRead: boolean;
  readAt?: string;
}

export interface SendNotificationRequest {
  userId: number;
  title: string;
  message: string;
  fcmToken?: string;
}
