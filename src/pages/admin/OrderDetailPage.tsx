import { useParams, useNavigate } from 'react-router-dom';
import { Descriptions, Table, Button, Popconfirm, message, Space } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { orderApi } from '@/api/orderApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { OrderItemDto } from '@/types/order';
import type { ApiError } from '@/types/common';

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = Number(orderId);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getById(id),
    enabled: Number.isFinite(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderApi.cancel(id),
    onSuccess: () => {
      message.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  if (isLoading || !order) return <PageHeader title="Loading order..." />;

  const cancellable = !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status);

  return (
    <div>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        extra={
          <Space>
            <Button onClick={() => navigate('/admin/orders')}>Back</Button>
            {cancellable && (
              <Popconfirm title="Cancel this order?" onConfirm={() => cancelMutation.mutate()}>
                <Button danger loading={cancelMutation.isPending}>
                  Cancel Order
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
      />
      <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Status">
          <StatusTag value={order.status} />
        </Descriptions.Item>
        <Descriptions.Item label="User ID">{order.userId}</Descriptions.Item>
        <Descriptions.Item label="Total">{formatCurrency(order.totalAmount, order.currency)}</Descriptions.Item>
        <Descriptions.Item label="Sub Total">{formatCurrency(order.subTotal, order.currency)}</Descriptions.Item>
        <Descriptions.Item label="Tax">{formatCurrency(order.totalTaxAmount, order.currency)}</Descriptions.Item>
        <Descriptions.Item label="Discount">{formatCurrency(order.discountAmount, order.currency)}</Descriptions.Item>
        <Descriptions.Item label="Coupon">{order.couponCode ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="Created">{formatDateTime(order.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="Delivery Address" span={2}>
          {[order.deliveryAddressLine1, order.deliveryAddressLine2, order.deliveryCity, order.deliveryState, order.deliveryPinCode, order.deliveryCountry]
            .filter(Boolean)
            .join(', ')}
        </Descriptions.Item>
      </Descriptions>

      <Table<OrderItemDto>
        rowKey="productId"
        dataSource={order.items}
        pagination={false}
        columns={[
          { title: 'Product ID', dataIndex: 'productId' },
          { title: 'Vendor', dataIndex: 'vendorId', render: (v: number | null) => (v ? `#${v}` : 'Platform') },
          { title: 'Quantity', dataIndex: 'quantity' },
          { title: 'Price', dataIndex: 'price', render: (v: number) => formatCurrency(v, order.currency) },
          { title: 'Subtotal', dataIndex: 'subtotal', render: (v: number) => formatCurrency(v, order.currency) },
        ]}
      />
    </div>
  );
}
