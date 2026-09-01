import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/authApi';
import { getFcmToken, onForegroundMessage } from '@/firebase';
import { notify } from '@/utils/notify';

/**
 * Registers this browser for push once per authenticated session, and refreshes the
 * relevant notifications list the moment a foreground push arrives instead of waiting for
 * the next 60s poll or page visit. Call once from AppLayout, which both the ADMIN and
 * VENDOR route branches render (see router.tsx) — so this covers both roles.
 */
export function useFcmBootstrap() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let cancelled = false;
    getFcmToken().then((token) => {
      if (!cancelled && token) {
        // Best-effort — a failed sync just means the previously stored token (if any)
        // stays in place until the next successful one.
        authApi.registerDeviceToken(token).catch(() => {});
      }
    });

    const notificationsQueryKey =
      user.role === 'ADMIN' ? ['admin-notifications'] : ['vendor-notifications', user.id];

    const unsubscribe = onForegroundMessage((payload) => {
      const title = payload.notification?.title ?? 'New notification';
      const body = payload.notification?.body;
      notify.info(body ? `${title}: ${body}` : title);
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isAuthenticated, user, queryClient]);
}
