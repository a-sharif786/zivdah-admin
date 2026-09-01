import { useState } from 'react';
import type { FormEvent } from 'react';
import { Box, Card, Typography, Alert, ToggleButtonGroup, ToggleButton, TextField, Button, Stack } from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { getDeviceToken } from '@/utils/deviceToken';
import { BRAND } from '@/theme/theme';
import type { ApiError } from '@/types/common';
import type { LoginResponseDTO } from '@/types/auth';

const FEATURES = [
  { icon: <StorefrontOutlinedIcon fontSize="small" />, text: 'Catalog, inventory & vendor management' },
  { icon: <BoltOutlinedIcon fontSize="small" />, text: 'Real-time orders, payments & delivery status' },
  { icon: <VerifiedUserOutlinedIcon fontSize="small" />, text: 'Role-based access for admins and vendors' },
];

export function LoginPage() {
  const [mode, setMode] = useState<'mobile' | 'email'>('mobile');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMobile, setOtpMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const finishLogin = (response: LoginResponseDTO) => {
    if (response.role !== 'ADMIN' && response.role !== 'VENDOR') {
      setError('Only Admin and Vendor accounts are allowed to access the Zivdah Admin Panel..');
      return;
    }
    login(response);
    navigate(response.role === 'ADMIN' ? '/admin' : '/vendor', { replace: true });
  };

  const switchMode = (v: 'mobile' | 'email') => {
    setMode(v);
    setError(null);
    setOtpSent(false);
  };

  const onEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      finishLogin(response);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  const onSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.sendOtp(mobile);
      setOtpMobile(mobile);
      setOtpSent(true);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.verifyOtp({ mobile: otpMobile, otp, deviceToken: await getDeviceToken() });
      finishLogin(response);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--app-bg)' }}>
      <Box
        className="login-brand-panel"
        sx={{
          flex: '0 0 42%',
          maxWidth: 480,
          background: BRAND.gradient,
          color: '#fff',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 7,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            Z
          </Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
            Zivdah
          </Typography>
        </Box>

        <div>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 1.5 }}>
            Run your store, from one place.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>
            Manage products, orders, payments and vendors across the Zivdah grocery platform.
          </Typography>

          <Stack spacing={2} sx={{ mt: 4 }}>
            {FEATURES.map((f) => (
              <Box key={f.text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: '0 0 auto',
                  }}
                >
                  {f.icon}
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)' }}>{f.text}</Typography>
              </Box>
            ))}
          </Stack>
        </div>

        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5 }}>
          &copy; {new Date().getFullYear()} Zivdah. All rights reserved.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Card sx={{ width: 380, p: 4, boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>
          <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 700, mb: 0.5 }}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            Sign in to the Admin &amp; Vendor Portal
          </Typography>

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => v && switchMode(v)}
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="mobile">Mobile</ToggleButton>
            <ToggleButton value="email">Email</ToggleButton>
          </ToggleButtonGroup>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {mode === 'email' ? (
            <Stack component="form" spacing={2} onSubmit={onEmailLogin}>
              <TextField
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                fullWidth
                required
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                fullWidth
                required
              />
              <Button type="submit" variant="contained" size="large" loading={loading} fullWidth>
                Log In
              </Button>
            </Stack>
          ) : !otpSent ? (
            <Stack component="form" spacing={2} onSubmit={onSendOtp}>
              <TextField
                label="Mobile Number"
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                disabled={loading}
                fullWidth
                required
              />
              <Button type="submit" variant="contained" size="large" loading={loading} fullWidth>
                Send OTP
              </Button>
            </Stack>
          ) : (
            <Stack component="form" spacing={1.5} onSubmit={onVerifyOtp}>
              <TextField
                label={`OTP sent to ${otpMobile}`}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                slotProps={{ htmlInput: { maxLength: 6 } }}
                fullWidth
                required
              />
              <Typography variant="body2" color="text.secondary">
                Demo backend — OTP is always 123456.
              </Typography>
              <Button type="submit" variant="contained" size="large" loading={loading} fullWidth sx={{ mt: 1 }}>
                Verify &amp; Log In
              </Button>
              <Button variant="text" disabled={loading} onClick={() => setOtpSent(false)} fullWidth>
                Use a different number
              </Button>
            </Stack>
          )}
        </Card>
      </Box>
    </Box>
  );
}
