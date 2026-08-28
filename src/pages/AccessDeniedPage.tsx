import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function AccessDeniedPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, p: 3 }}>
      <Typography sx={{ fontSize: 72, fontWeight: 800, color: 'error.light', lineHeight: 1 }}>403</Typography>
      <Typography sx={{ fontWeight: 700 }}>Access Denied</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Your account does not have permission to view this area.
      </Typography>
      <Button
        variant="contained"
        onClick={() => {
          logout();
          navigate('/login', { replace: true });
        }}
      >
        Back to Login
      </Button>
    </Box>
  );
}
