import { Card, Col, Row, Statistic } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { productApi } from '@/api/productApi';
import { orderApi } from '@/api/orderApi';

export function VendorDashboardPage() {
  const { user } = useAuth();
  const vendorId = user!.id;

  const products = useQuery({
    queryKey: ['vendor-dashboard', 'products', vendorId],
    queryFn: () => productApi.getByVendor(vendorId, 0, 1),
  });
  const orders = useQuery({
    queryKey: ['vendor-dashboard', 'orders', vendorId],
    queryFn: () => orderApi.getByVendor(vendorId, 0, 1),
  });

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name}`} />
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="My Products (page sample)" value={products.data?.length ?? 0} loading={products.isLoading} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="My Orders (page sample)" value={orders.data?.length ?? 0} loading={orders.isLoading} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
