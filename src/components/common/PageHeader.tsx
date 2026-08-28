import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

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
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        mb: 2.5,
      }}
    >
      <div>
        <Typography variant="h5" sx={{ fontWeight: 700, m: 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13.5 }}>
            {subtitle}
          </Typography>
        )}
      </div>
      {extra && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {extra}
        </Stack>
      )}
    </Box>
  );
}
