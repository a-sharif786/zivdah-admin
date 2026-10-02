import { Box, Stack, Typography, alpha } from '@mui/material';
import type { ReactNode } from 'react';
import { BRAND } from '@/theme/theme';

/**
 * Page-level hero banner: title + subtitle on a softly tinted card with a faint grid
 * pattern and brand glow, actions (`extra`) aligned to the right.
 */
export function PageHeader({
  title,
  subtitle,
  extra,
}: {
  title: string;
  subtitle?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <Box
      sx={(t) => {
        const isDark = t.palette.mode === 'dark';
        const grid = isDark ? 'rgba(148,163,184,0.06)' : 'rgba(15,23,42,0.035)';
        return {
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
          px: { xs: 2.25, sm: 3 },
          py: { xs: 2.25, sm: 2.75 },
          borderRadius: '18px',
          border: `1px solid ${t.palette.divider}`,
          backgroundColor: 'background.paper',
          backgroundImage: [
            `radial-gradient(60% 140% at 100% 0%, ${alpha(BRAND.primary, isDark ? 0.22 : 0.14)} 0%, transparent 60%)`,
            `radial-gradient(40% 120% at 0% 100%, ${alpha('#3b82f6', isDark ? 0.12 : 0.06)} 0%, transparent 60%)`,
            `linear-gradient(${grid} 1px, transparent 1px)`,
            `linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
          ].join(', '),
          backgroundSize: 'auto, auto, 22px 22px, 22px 22px',
          boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4)' : '0 1px 2px rgba(15,23,42,0.04)',
          // Brand accent along the left edge.
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 18,
            bottom: 18,
            width: 4,
            borderRadius: '0 4px 4px 0',
            background: BRAND.gradient,
          },
        };
      }}
    >
      <Box sx={{ position: 'relative', minWidth: 0 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.025em',
            m: 0,
            lineHeight: 1.2,
            fontSize: { xs: 21, sm: 26 },
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13.5, mt: 0.6, maxWidth: 720 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {extra && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ position: 'relative', flexWrap: 'wrap' }}>
          {extra}
        </Stack>
      )}
    </Box>
  );
}
