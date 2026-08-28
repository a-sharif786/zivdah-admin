import { createTheme, type Theme } from '@mui/material/styles';
import type { ThemeMode } from '@/store/themeStore';

/**
 * Brand constants shared outside of the MUI theme (e.g. the always-dark
 * sidebar rail, the login page's brand panel) so they stay in sync with
 * the palette handed to createTheme below.
 *
 * Matched to the zivdah-web customer site (src/index.css `:root` there):
 * --primary: #27ae60, --primary-dark: #1e8449, --dark: #2c3e50, plus the
 * #58d68d light stop used in its hero/page-header gradients.
 */
export const BRAND = {
  primary: '#27ae60',
  primaryHover: '#1e8449',
  gradient: 'linear-gradient(135deg, #1e8449 0%, #27ae60 50%, #58d68d 100%)',
  sider: '#2c3e50', // same dark navy as zivdah-web's secondary nav bar
  siderActive: 'rgba(39, 174, 96, 0.30)', // was 0.22 — too washed out against #2c3e50, hard to tell active from hover
  radius: 10,
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

export function buildTheme(mode: ThemeMode): Theme {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: BRAND.primary, dark: BRAND.primaryHover, contrastText: '#fff' },
      background: {
        default: isDark ? '#0b1120' : '#f4f5fb',
        paper: isDark ? '#0f1526' : '#ffffff',
      },
    },
    shape: { borderRadius: BRAND.radius },
    typography: {
      fontFamily: BRAND.fontFamily,
      fontSize: 14,
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: isDark ? '#0b1120' : '#f4f5fb' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            boxShadow: isDark
              ? '0 1px 2px rgba(0,0,0,0.35)'
              : '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.04)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 600 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            color: isDark ? '#e2e8f0' : '#334155',
            backgroundColor: isDark ? '#131a2c' : '#f8f9fc',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
    },
  });
}
