import { Card, CardContent, Skeleton, Typography, Box } from '@mui/material';
import type { ReactNode } from 'react';

/**
 * Colorful KPI tile used across the admin/vendor dashboards — a gradient icon badge
 * in `color`, a big value, an optional secondary hint line, and a faded oversized copy
 * of the icon as a corner watermark.
 */
export function StatTile({
  title,
  value,
  icon,
  color,
  loading,
  hint,
}: {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  color: string;
  loading?: boolean;
  hint?: ReactNode;
}) {
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `radial-gradient(120% 90% at 100% 0%, ${color}14 0%, transparent 55%)`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 3,
          background: `linear-gradient(90deg, ${color}, ${color}40)`,
        },
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: `${color}59`,
          boxShadow: `0 14px 30px -14px ${color}80`,
          '& .stat-watermark': { opacity: 0.13, transform: 'rotate(-8deg) scale(1.06)' },
          '& .stat-badge': { transform: 'scale(1.05)' },
        },
      }}
    >
      {/* Oversized faded icon in the corner. */}
      <Box
        className="stat-watermark"
        aria-hidden
        sx={{
          position: 'absolute',
          right: -14,
          bottom: -18,
          color,
          opacity: 0.08,
          transform: 'rotate(-8deg)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
          pointerEvents: 'none',
          '& svg': { fontSize: 104 },
        }}
      >
        {icon}
      </Box>

      <CardContent
        sx={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 1.75, p: 2.5, '&:last-child': { pb: 2.5 } }}
      >
        <Box
          className="stat-badge"
          sx={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#fff',
            background: `linear-gradient(135deg, ${color} 0%, ${color}b3 100%)`,
            boxShadow: `0 8px 18px -6px ${color}99, inset 0 1px 0 rgba(255,255,255,0.3)`,
            transition: 'transform 0.2s ease',
            '& svg': { fontSize: 24 },
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1.4 }}
          >
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={100} height={40} sx={{ mt: 0.25 }} />
          ) : (
            <Typography
              sx={{
                fontSize: 27,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.25,
                mt: 0.5,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {value}
            </Typography>
          )}
          {hint && !loading && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                mt: 0.75,
                px: 1,
                py: 0.25,
                borderRadius: '6px',
                fontSize: 11.5,
                fontWeight: 600,
                color,
                backgroundColor: `${color}14`,
              }}
            >
              {hint}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
