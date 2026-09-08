import { apiClient } from '@/api/client';
import type {
  AuthUserResponseDTO,
  LoginRequest,
  LoginResponseDTO,
  RegisterRequest,
  UpdateRoleRequest,
  UpdateUserProfileRequest,
  UserStatsResponseDTO,
  VerifyOtpRequest,
} from '@/types/auth';

const BASE = '/restful/v1/api/auth';

export const authApi = {
  login: (payload: LoginRequest) => apiClient.post<LoginResponseDTO>(`${BASE}/login`, payload).then((r) => r.data),

  sendOtp: (mobile: string) => apiClient.post<void>(`${BASE}/send-otp`, { mobile }).then((r) => r.data),

  verifyOtp: (payload: VerifyOtpRequest) =>
    apiClient.post<LoginResponseDTO>(`${BASE}/verify-otp`, payload).then((r) => r.data),

  register: (payload: RegisterRequest) => apiClient.post<void>(`${BASE}/register`, payload).then((r) => r.data),

  getAllUsers: () => apiClient.get<AuthUserResponseDTO[]>(`${BASE}/all-users`).then((r) => r.data),

  // Narrower than getAllUsers (ADMIN-only) — the only user-listing endpoint a VENDOR is
  // allowed to call, for populating the assign-delivery-boy dropdown (see
  // OrderDetailPage.tsx / DeliveryAssignmentTable.tsx).
  getDeliveryBoys: () => apiClient.get<AuthUserResponseDTO[]>(`${BASE}/delivery-boys`).then((r) => r.data),

  getStats: () => apiClient.get<UserStatsResponseDTO>(`${BASE}/stats`).then((r) => r.data),

  getUserById: (userId: number) =>
    apiClient.get<LoginResponseDTO>(`${BASE}/byUserId/${userId}`).then((r) => r.data),

  updateProfile: (userId: number, payload: UpdateUserProfileRequest) =>
    apiClient.put(`${BASE}/update-profile/${userId}`, payload).then((r) => r.data),

  updateRole: (userId: number, payload: UpdateRoleRequest) =>
    apiClient.put(`${BASE}/update-role/${userId}`, payload).then((r) => r.data),

  activateUser: (userId: number) => apiClient.put<void>(`${BASE}/activate/${userId}`).then((r) => r.data),

  deactivateUser: (userId: number) => apiClient.put<void>(`${BASE}/deactivate/${userId}`).then((r) => r.data),

  // fcmToken is optional — when passed, only this device's push registration is
  // deactivated, other signed-in devices/browsers stay registered.
  logout: (fcmToken?: string) =>
    apiClient.post<void>(`${BASE}/logout`, fcmToken ? { fcmToken } : {}).then((r) => r.data),

  // Registers/refreshes one device's FCM token — a user may be signed in on several
  // devices/browsers at once, each becomes its own row server-side (see device_tokens).
  registerDeviceToken: (fcmToken: string, deviceType: 'WEB' | 'ANDROID' | 'IOS' = 'WEB') =>
    apiClient.post<void>(`${BASE}/device-tokens`, { fcmToken, deviceType }).then((r) => r.data),
};
