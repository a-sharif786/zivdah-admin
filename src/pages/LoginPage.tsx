import { useState } from 'react';
import { Button, Card, Form, Input, Typography, Alert, Segmented } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import type { ApiError } from '@/types/common';

const { Title, Text } = Typography;

interface FormValues {
  identifier: string;
  password: string;
}

export function LoginPage() {
  const [mode, setMode] = useState<'mobile' | 'email'>('mobile');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const onFinish = async (values: FormValues) => {
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login({
        mobile: mode === 'mobile' ? values.identifier : undefined,
        email: mode === 'email' ? values.identifier : undefined,
        password: values.password,
      });

      if (response.role !== 'ADMIN' && response.role !== 'VENDOR') {
        setError('This account does not have Admin or Vendor access to Zivdah Admin.');
        return;
      }

      login(response);
      navigate(response.role === 'ADMIN' ? '/admin' : '/vendor', { replace: true });
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
          onChange={(v) => setMode(v as 'mobile' | 'email')}
          style={{ marginBottom: 16 }}
        />

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish} disabled={loading}>
          <Form.Item
            name="identifier"
            label={mode === 'mobile' ? 'Mobile Number' : 'Email'}
            rules={[{ required: true, message: 'This field is required' }]}
          >
            <Input placeholder={mode === 'mobile' ? '9876543210' : 'you@example.com'} />
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
      </Card>
    </div>
  );
}
