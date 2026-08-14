import { Card, Col, Row, Statistic } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { authApi } from '@/api/authApi';
import { productApi } from '@/api/productApi';
import { orderApi } from '@/api/orderApi';
import { couponApi } from '@/api/couponApi';

export function AdminDashboardPage() {
  const users = useQuery({ queryKey: ['dashboard', 'users'], queryFn: authApi.getAllUsers });
  const products = useQuery({
    queryKey: ['dashboard', 'products'],
    queryFn: () => productApi.getAll(0, 1),
  });
  const orders = useQuery({
    queryKey: ['dashboard', 'orders'],
    queryFn: () => orderApi.getAll(0, 1),
  });
   const coupons = useQuery({ queryKey: ['dashboard', 'coupons'], queryFn: couponApi.getAll });

  return (
    <div>
      <PageHeader title="Dashboard" />
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Users" value={users.data?.length ?? 0} loading={users.isLoading} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Vendors"
              value={users.data?.filter((u) => u.role === 'VENDOR').length ?? 0}
              loading={users.isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Products (page sample)"
              value={products.data?.length ?? 0}
              loading={products.isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Active Coupons" value={coupons.data?.filter((c) => c.active).length ?? 0} loading={coupons.isLoading} />
          </Card>
        </Col> 
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Orders (page sample)"
              value={orders.data?.length ?? 0}
              loading={orders.isLoading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
