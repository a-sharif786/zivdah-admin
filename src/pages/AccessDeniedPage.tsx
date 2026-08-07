import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function AccessDeniedPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return (
    <Result
      status="403"
      title="Access Denied"
      subTitle="Your account does not have permission to view this area."
      extra={
        <Button
          type="primary"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          Back to Login
        </Button>
      }
    />
  );
}
