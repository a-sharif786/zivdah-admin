export interface NotificationResponseDto {
  id: number;
  userId: number;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendNotificationRequest {
  userId: number;
  title: string;
  message: string;
  fcmToken?: string;
}
