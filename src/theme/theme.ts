import { alpha, createTheme, type Theme } from '@mui/material/styles';
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
  // Subtle top-to-bottom depth on the rail; ends on `sider` so anything sampling the flat color still matches.
  siderGradient: 'linear-gradient(180deg, #34495e 0%, #2c3e50 45%, #243342 100%)',
  siderActive: 'rgba(39, 174, 96, 0.30)', // was 0.22 — too washed out against #2c3e50, hard to tell active from hover
  radius: 10,
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

export function buildTheme(mode: ThemeMode): Theme {
  const isDark = mode === 'dark';

  const surface = {
    bg: isDark ? '#0b1120' : '#f4f6fa',
    paper: isDark ? '#111827' : '#ffffff',
    subtle: isDark ? '#151e31' : '#f8fafc',
    border: isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(15, 23, 42, 0.08)',
    borderStrong: isDark ? 'rgba(148, 163, 184, 0.26)' : 'rgba(15, 23, 42, 0.16)',
  };

  const shadow = {
    sm: isDark ? '0 1px 2px rgba(0,0,0,0.4)' : '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.04)',
    md: isDark ? '0 6px 20px rgba(0,0,0,0.45)' : '0 4px 6px -2px rgba(15, 23, 42, 0.04), 0 12px 24px -6px rgba(15, 23, 42, 0.08)',
    lg: isDark ? '0 20px 48px rgba(0,0,0,0.55)' : '0 24px 48px -12px rgba(15, 23, 42, 0.18)',
  };

  const focusRing = `0 0 0 3px ${alpha(BRAND.primary, isDark ? 0.3 : 0.18)}`;

  return createTheme({
    palette: {
      mode,
      primary: { main: BRAND.primary, dark: BRAND.primaryHover, light: '#58d68d', contrastText: '#fff' },
      secondary: { main: isDark ? '#94a3b8' : '#2c3e50' },
      success: { main: '#22c55e' },
      warning: { main: '#f59e0b' },
      error: { main: '#ef4444' },
      info: { main: '#3b82f6' },
      background: { default: surface.bg, paper: surface.paper },
      text: {
        primary: isDark ? '#e5e7eb' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: surface.border,
      action: {
        hover: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.04)',
        selected: alpha(BRAND.primary, isDark ? 0.18 : 0.1),
      },
    },
    shape: { borderRadius: BRAND.radius },
    typography: {
      fontFamily: BRAND.fontFamily,
      fontSize: 14,
      h4: { fontWeight: 800, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.015em' },
      h6: { fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      body2: { lineHeight: 1.55 },
      caption: { letterSpacing: '0.01em' },
      overline: { fontWeight: 700, letterSpacing: '0.08em' },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: surface.bg },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          rounded: { borderRadius: 14 },
          // Default "raised" surfaces (cards, DataTable, panels): hairline border + soft shadow
          // reads cleaner than MUI's stock drop shadow on the light-grey page background.
          elevation1: { border: `1px solid ${surface.border}`, boxShadow: shadow.sm },
          outlined: { borderColor: surface.border },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${surface.border}`,
            boxShadow: shadow.sm,
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
            '&:hover': { boxShadow: shadow.md },
          },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
          root: {
            padding: '16px 20px',
            borderBottom: `1px solid ${surface.border}`,
            backgroundImage: `linear-gradient(180deg, ${surface.subtle}, transparent)`,
          },
          title: {
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            // Small brand accent pill before every card title.
            '&::before': {
              content: '""',
              width: 4,
              height: 16,
              borderRadius: 4,
              flexShrink: 0,
              background: BRAND.gradient,
            },
          },
          subheader: { fontSize: 12.5 },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: { padding: 20, '&:last-child': { paddingBottom: 20 } },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 9,
            fontWeight: 600,
            paddingInline: 16,
            transition: 'background-color 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, transform 0.1s ease',
            '&:active': { transform: 'translateY(1px)' },
            '&.Mui-focusVisible': { boxShadow: focusRing },
            '&.MuiButton-contained.MuiButton-colorPrimary:not(.Mui-disabled)': {
              backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.08)}, ${alpha('#ffffff', 0)})`,
              boxShadow: `0 1px 2px ${alpha(BRAND.primaryHover, 0.3)}`,
              '&:hover': { boxShadow: `0 4px 12px ${alpha(BRAND.primary, 0.32)}` },
            },
          },
          sizeSmall: { paddingInline: 12, borderRadius: 8 },
          sizeLarge: { paddingBlock: 10, borderRadius: 10 },
          outlined: {
            borderColor: surface.borderStrong,
            '&:hover': { borderColor: 'currentColor' },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 9,
            transition: 'background-color 0.15s ease, color 0.15s ease',
            '&.Mui-focusVisible': { boxShadow: focusRing },
          },
        },
      },
      // Segmented-control look: a recessed track with the selected option raised on a "pill".
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            padding: 4,
            gap: 4,
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(148, 163, 184, 0.08)' : '#eef1f6',
            border: `1px solid ${surface.border}`,
          },
          grouped: {
            border: 0,
            borderRadius: '9px !important',
            margin: '0 !important',
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            paddingInline: 14,
            color: isDark ? '#94a3b8' : '#64748b',
            borderColor: surface.borderStrong,
            transition: 'background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease',
            '&:hover': { backgroundColor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.05)' },
            '&.Mui-selected, &.Mui-selected:hover': {
              color: isDark ? '#fff' : BRAND.primaryHover,
              backgroundColor: isDark ? alpha(BRAND.primary, 0.28) : '#ffffff',
              boxShadow: isDark
                ? `inset 0 0 0 1px ${alpha(BRAND.primary, 0.45)}`
                : `0 1px 3px rgba(15,23,42,0.12), 0 0 0 1px ${alpha(BRAND.primary, 0.25)}`,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 9,
            backgroundColor: isDark ? alpha('#ffffff', 0.02) : '#ffffff',
            transition: 'box-shadow 0.15s ease',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: surface.borderStrong,
              transition: 'border-color 0.15s ease',
            },
            '&:hover:not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(15, 23, 42, 0.32)',
            },
            '&.Mui-focused': { boxShadow: focusRing },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 1, borderColor: BRAND.primary },
            '&.Mui-disabled': { backgroundColor: surface.subtle },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { fontWeight: 500 },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: { marginLeft: 2, fontSize: 12 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            border: `1px solid ${surface.border}`,
            boxShadow: isDark
              ? '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)'
              : '0 32px 64px -16px rgba(15, 23, 42, 0.32), 0 0 0 1px rgba(15,23,42,0.02)',
            // Brand stripe across the top edge of every dialog.
            '&.MuiDialog-paper': {
              backgroundImage: 'linear-gradient(90deg, #1e8449, #27ae60 50%, #58d68d)',
              backgroundSize: '100% 4px',
              backgroundRepeat: 'no-repeat',
            },
            scrollbarWidth: 'thin',
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            '&:not(.MuiBackdrop-invisible)': {
              backgroundColor: isDark ? 'rgba(2, 6, 23, 0.72)' : 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(4px) saturate(120%)',
            },
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: '-0.02em',
            padding: '22px 24px 18px',
            borderBottom: `1px solid ${surface.border}`,
            backgroundImage: `radial-gradient(120% 140% at 0% 0%, ${alpha(BRAND.primary, isDark ? 0.18 : 0.1)} 0%, transparent 55%)`,
            // Gradient badge before the title.
            '&::before': {
              content: '""',
              width: 10,
              height: 10,
              flexShrink: 0,
              borderRadius: 3,
              background: BRAND.gradient,
              boxShadow: `0 0 0 4px ${alpha(BRAND.primary, 0.15)}, 0 4px 10px ${alpha(BRAND.primary, 0.4)}`,
            },
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: '20px 24px',
            // MUI zeroes the top padding when content follows a title; we want the gap
            // now that the title has its own bordered band.
            '.MuiDialogTitle-root + &': { paddingTop: 22 },
          },
          dividers: { borderColor: surface.border },
        },
      },
      MuiDialogContentText: {
        styleOverrides: {
          root: { fontSize: 14, lineHeight: 1.6 },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '14px 24px',
            gap: 10,
            borderTop: `1px solid ${surface.border}`,
            backgroundColor: surface.subtle,
            '& > :not(style) ~ :not(style)': { marginLeft: 0 },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${surface.border}`,
            boxShadow: shadow.md,
          },
          list: { padding: 6 },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontSize: 14,
            minHeight: 38,
            '&.Mui-selected': { backgroundColor: alpha(BRAND.primary, isDark ? 0.18 : 0.1) },
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: { borderRadius: 12, boxShadow: shadow.md },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: { borderRadius: 12, border: `1px solid ${surface.border}`, boxShadow: shadow.md },
          option: { borderRadius: 8, margin: '0 6px' },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#e5e7eb' : '#1e293b',
            color: isDark ? '#0f172a' : '#f8fafc',
            fontSize: 12,
            fontWeight: 500,
            padding: '6px 10px',
            borderRadius: 7,
            boxShadow: shadow.md,
          },
          arrow: { color: isDark ? '#e5e7eb' : '#1e293b' },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: { borderRadius: 0 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${surface.border}` },
          head: {
            fontWeight: 700,
            fontSize: 11.5,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: isDark ? '#94a3b8' : '#64748b',
            backgroundColor: surface.subtle,
            whiteSpace: 'nowrap',
          },
          sizeMedium: { paddingTop: 14, paddingBottom: 14 },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.12s ease',
            '&:last-child > td': { borderBottom: 0 },
            '&.MuiTableRow-hover:hover': {
              backgroundColor: isDark ? 'rgba(148, 163, 184, 0.06)' : 'rgba(15, 23, 42, 0.025)',
            },
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: { borderTop: `1px solid ${surface.border}` },
          toolbar: { minHeight: 52 },
          selectLabel: { fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' },
          displayedRows: { fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 7 },
          sizeSmall: { height: 24, fontSize: 12, '& .MuiChip-label': { paddingInline: 8 } },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 44 },
          indicator: { height: 3, borderRadius: '3px 3px 0 0' },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 14,
            minHeight: 44,
            color: isDark ? '#94a3b8' : '#64748b',
            '&.Mui-selected': { color: BRAND.primary },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            alignItems: 'center',
            '&.MuiAlert-standard.MuiAlert-colorSuccess': { border: `1px solid ${alpha('#22c55e', 0.3)}` },
            '&.MuiAlert-standard.MuiAlert-colorInfo': { border: `1px solid ${alpha('#3b82f6', 0.3)}` },
            '&.MuiAlert-standard.MuiAlert-colorWarning': { border: `1px solid ${alpha('#f59e0b', 0.3)}` },
            '&.MuiAlert-standard.MuiAlert-colorError': { border: `1px solid ${alpha('#ef4444', 0.3)}` },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { height: 3, backgroundColor: alpha(BRAND.primary, 0.12) },
          bar: { backgroundImage: BRAND.gradient },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: { borderRadius: 6 },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: surface.border },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: { fontWeight: 700 },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked + .MuiSwitch-track': { opacity: 0.9 },
          },
        },
      },
    },
  });
}
