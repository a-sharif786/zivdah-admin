import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types/auth';

export function RoleRoute({ allowed }: { allowed: Role[] }) {
  const role = useAuthStore((s) => s.user?.role);

  if (!role || !allowed.includes(role)) {
    return <Navigate to="/access-denied" replace />;
  }
  return <Outlet />;
}
