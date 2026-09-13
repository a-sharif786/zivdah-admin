import { Outlet } from 'react-router-dom';
import { SupportSocketProvider } from '@/context/SupportSocketContext';

/**
 * Wraps the /admin/support/* subtree (mounted inside AppLayout's <Outlet/>) with the one
 * shared support WebSocket connection — scoped here rather than globally in AppLayout since
 * Support is ADMIN-only and the connection is only ever needed while inside this subtree.
 */
export function SupportLayout() {
  return (
    <SupportSocketProvider>
      <Outlet />
    </SupportSocketProvider>
  );
}
