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
  refreshToken: string | null;
  user: AuthUser | null;
  login: (response: LoginResponseDTO) => void;
  // Called by api/client.ts after a silent /refresh-token rotation.
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      login: (response) => {
        set({
          token: response.accessToken ?? response.token,
          refreshToken: response.refreshToken ?? null,
          user: {
            id: response.id,
            name: response.name,
            email: response.email,
            mobile: response.mobile,
            role: response.role,
          },
        });
      },
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
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
