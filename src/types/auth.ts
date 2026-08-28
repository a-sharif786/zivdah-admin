export type Role = 'USER' | 'ADMIN' | 'VENDOR';

export interface LoginRequest {
  mobile?: string;
  email?: string;
  // Required for email login; mobile login uses OTP instead (see VerifyOtpRequest).
  password?: string;
}

export interface VerifyOtpRequest {
  mobile: string;
  otp: string;
  deviceToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  mobile: string;
  role?: Role;
}

export interface LoginResponseDTO {
  id: number;
  mobile: string;
  name: string;
  email: string;
  role: Role;
  token: string;
}

export interface AuthUserResponseDTO {
  userId: number;
  name: string;
  email: string;
  mobile: string;
  role: Role;
  active: boolean;
}

export interface UpdateRoleRequest {
  role: Role;
}

export interface UpdateUserProfileRequest {
  name: string;
}

export interface UserStatsResponseDTO {
  totalUsers: number;
  totalAdmins: number;
  totalVendors: number;
  totalCustomers: number;
}

// Decoded JWT payload (userId + role claims, mobile as subject).
export interface DecodedToken {
  sub: string;
  userId: number;
  role: Role;
  iat: number;
  exp: number;
}
