import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Authenticated root: send the user to the portal matching their role.
export function RootRedirect() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (role === 'VENDOR') return <Navigate to="/vendor" replace />;
  if (role === 'DELIVERY_BOY') return <Navigate to="/delivery" replace />;
  return <Navigate to="/access-denied" replace />;
}
