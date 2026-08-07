import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import type { DecodedToken, LoginResponseDTO, Role } from '@/types/auth';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (response: LoginResponseDTO) => void;
  logout: () => void;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (response) => {
        set({
          token: response.token,
          user: {
            id: response.id,
            name: response.name,
            email: response.email,
            mobile: response.mobile,
            role: response.role,
          },
        });
      },
      logout: () => set({ token: null, user: null }),
      isTokenExpired: () => {
        const token = get().token;
        if (!token) return true;
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          if (!decoded.exp) return false;
          return decoded.exp * 1000 < Date.now();
        } catch {
          return true;
        }
      },
    }),
    { name: 'zivdah-admin-auth' }
  )
);
