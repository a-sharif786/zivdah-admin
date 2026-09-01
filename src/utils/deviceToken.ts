import { getFcmToken } from '@/firebase';

// Backend's OTP-verification/login endpoints (and the new /device-token sync, see
// useFcmBootstrap.ts) accept a deviceToken meant for push notifications. Tries to get a
// real FCM registration token first; falls back to a stable per-browser random id if push
// isn't available (permission denied, unsupported browser, Firebase Web app not configured
// yet) so login/register never breaks on it.
const KEY = 'zivdah_admin_device_token';

function getFallbackToken(): string {
  let token = localStorage.getItem(KEY);
  if (!token) {
    token = 'admin-web-' + crypto.randomUUID();
    localStorage.setItem(KEY, token);
  }
  return token;
}

export async function getDeviceToken(): Promise<string> {
  const fcmToken = await getFcmToken();
  return fcmToken ?? getFallbackToken();
}
