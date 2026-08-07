import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const isTokenExpired = useAuthStore((s) => s.isTokenExpired);

  if (!token || isTokenExpired()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
