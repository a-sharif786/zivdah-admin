import { Box, Typography } from '@mui/material';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { BRAND } from '@/theme/theme';

/** Friendly placeholder shown in place of a chart that has no data. */
export function ChartEmptyState({ description, height }: { description: string; height: number }) {
  return (
    <Box
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        borderRadius: '14px',
        border: '1px dashed',
        borderColor: 'divider',
        backgroundImage: (t) =>
          `radial-gradient(circle at 50% 40%, ${t.palette.mode === 'dark' ? 'rgba(39,174,96,0.10)' : 'rgba(39,174,96,0.06)'}, transparent 60%)`,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: BRAND.primary,
          backgroundColor: `${BRAND.primary}14`,
          boxShadow: `0 0 0 8px ${BRAND.primary}0a`,
          '& svg': { fontSize: 28 },
        }}
      >
        <InsightsOutlinedIcon />
      </Box>
      <Typography color="text.secondary" sx={{ fontSize: 13.5, fontWeight: 500, textAlign: 'center', px: 2 }}>
        {description}
      </Typography>
    </Box>
  );
}
