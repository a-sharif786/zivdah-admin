import { useState } from 'react';
import { Button, Card, Form, Input, Typography, Alert, Segmented } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { getDeviceToken } from '@/utils/deviceToken';
import type { ApiError } from '@/types/common';
import type { LoginResponseDTO } from '@/types/auth';

const { Title, Text } = Typography;

interface EmailFormValues {
  email: string;
  password: string;
}

interface MobileFormValues {
  mobile: string;
}

interface OtpFormValues {
  otp: string;
}

export function LoginPage() {
  const [mode, setMode] = useState<'mobile' | 'email'>('mobile');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMobile, setOtpMobile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const finishLogin = (response: LoginResponseDTO) => {
    if (response.role !== 'ADMIN' && response.role !== 'VENDOR') {
      setError('This account does not have Admin or Vendor access to Zivdah Admin.');
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

  const onEmailLogin = async (values: EmailFormValues) => {
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login({ email: values.email, password: values.password });
      finishLogin(response);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  const onSendOtp = async (values: MobileFormValues) => {
    setError(null);
    setLoading(true);
    try {
      await authApi.sendOtp(values.mobile);
      setOtpMobile(values.mobile);
      setOtpSent(true);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (values: OtpFormValues) => {
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.verifyOtp({
        mobile: otpMobile,
        otp: values.otp,
        deviceToken: getDeviceToken(),
      });
      finishLogin(response);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 380 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 4 }}>
          Zivdah Admin
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Admin &amp; Vendor Portal
        </Text>

        <Segmented
          block
          options={[
            { label: 'Mobile', value: 'mobile' },
            { label: 'Email', value: 'email' },
          ]}
          value={mode}
          onChange={(v) => switchMode(v as 'mobile' | 'email')}
          style={{ marginBottom: 16 }}
        />

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        {mode === 'email' ? (
          <Form layout="vertical" onFinish={onEmailLogin} disabled={loading}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Enter a valid email' },
              ]}
            >
              <Input placeholder="you@example.com" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Log In
              </Button>
            </Form.Item>
          </Form>
        ) : !otpSent ? (
          <Form layout="vertical" onFinish={onSendOtp} disabled={loading}>
            <Form.Item
              name="mobile"
              label="Mobile Number"
              rules={[{ required: true, message: 'Mobile number is required' }]}
            >
              <Input placeholder="9876543210" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Send OTP
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={onVerifyOtp} disabled={loading}>
            <Form.Item label={`OTP sent to ${otpMobile}`} name="otp" rules={[{ required: true, message: 'OTP is required' }]}>
              <Input placeholder="123456" maxLength={6} />
            </Form.Item>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              Demo backend — OTP is always 123456.
            </Text>
            <Form.Item style={{ marginBottom: 8 }}>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Verify &amp; Log In
              </Button>
            </Form.Item>
            <Button
              type="link"
              block
              disabled={loading}
              onClick={() => setOtpSent(false)}
              style={{ padding: 0 }}
            >
              Use a different number
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
}
