import { useEffect, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from 'notistack';
import App from '@/App';
import { useThemeStore } from '@/store/themeStore';
import { buildTheme } from '@/theme/theme';

/**
 * Owns the light/dark mode decision: rebuilds the MUI theme whenever the
 * persisted mode changes, and mirrors it onto <html data-theme="..."> so
 * plain CSS (index.css, the login page background) can react to it too.
 */
export function ThemeRoot() {
  const mode = useThemeStore((s) => s.mode);
  const theme = useMemo(() => buildTheme(mode), [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <App />
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
