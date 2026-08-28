import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, p: 3 }}>
      <Typography sx={{ fontSize: 72, fontWeight: 800, color: 'text.disabled', lineHeight: 1 }}>404</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Sorry, the page you visited does not exist.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Back Home
      </Button>
    </Box>
  );
}
