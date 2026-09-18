export type Role = 'USER' | 'ADMIN' | 'VENDOR' | 'DELIVERY_BOY';

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
  // Vendor payout destination fields — optional and independent of `name`. Omitted (not sent)
  // leaves whatever is already on file unchanged; see AuthServiceImpl#updateProfile.
  bankAccountNumber?: string;
  bankIfscCode?: string;
  upiVpa?: string;
}

export interface BankDetailsResponseDTO {
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  upiVpa?: string | null;
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
