import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const isTokenExpired = useAuthStore((s) => s.isTokenExpired);

  // An expired access token alone isn't a reason to leave — while a refresh token is held,
  // the first API call's 401 is silently refreshed by api/client.ts.
  if (!token || (isTokenExpired() && !refreshToken)) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
