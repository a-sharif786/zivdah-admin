import { Card, CardContent, Skeleton, Typography, Box } from '@mui/material';
import type { ReactNode } from 'react';

/**
 * Colorful KPI tile used across the admin/vendor dashboards — an icon chip
 * tinted with `color`, a big value, and an optional secondary hint line.
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
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75, '&:last-child': { pb: 2 } }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
            color,
            backgroundColor: `${color}1f`,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5 }}>
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={90} height={30} sx={{ mt: 0.25 }} />
          ) : (
            <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1.35, mt: 0.25 }}>{value}</Typography>
          )}
          {hint && !loading && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
              {hint}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
