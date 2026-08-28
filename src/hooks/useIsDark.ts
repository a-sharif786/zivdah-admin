import { useThemeStore } from '@/store/themeStore';

/** Convenience for components (e.g. chart colors) that only need to know light vs dark. */
export const useIsDark = () => useThemeStore((s) => s.mode === 'dark');
