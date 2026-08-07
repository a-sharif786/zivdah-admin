import { useState } from 'react';
import { Table, Select, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { orderApi } from '@/api/orderApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { OrderResponseDto, OrderStatus } from '@/types/order';

const STATUSES: OrderStatus[] = [
  'CREATED',
  'PAYMENT_PENDING',
  'PAID',
  'CONFIRMED',
  'PACKING',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

export function OrdersPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const navigate = useNavigate();

  const { items, total, isLoading } = usePagedQuery<OrderResponseDto>(
    ['admin-orders', status ?? 'ALL'],
    (p, s) => orderApi.getAll(p, s, status),
    page,
    size
  );

  return (
    <div>
      <PageHeader
        title="Orders"
        extra={
          <Space>
            <Select
              allowClear
              placeholder="Filter by status"
              style={{ width: 200 }}
              options={STATUSES.map((s) => ({ label: s, value: s }))}
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(0);
              }}
            />
          </Space>
        }
      />
      <Table<OrderResponseDto>
        rowKey="orderId"
        loading={isLoading}
        dataSource={items}
        onRow={(record) => ({ onClick: () => navigate(`/admin/orders/${record.orderId}`) })}
        rowClassName={() => 'clickable-row'}
        pagination={{
          current: page + 1,
          pageSize: size,
          total,
          onChange: (p, s) => {
            setPage(p - 1);
            setSize(s);
          },
        }}
        columns={[
          { title: 'Order #', dataIndex: 'orderNumber' },
          { title: 'User', dataIndex: 'userId' },
          { title: 'Total', dataIndex: 'totalAmount', render: (v: number, r) => formatCurrency(v, r.currency) },
          { title: 'Status', dataIndex: 'status', render: (v: string) => <StatusTag value={v} /> },
          { title: 'Items', render: (_, r) => r.items?.length ?? 0 },
          { title: 'Created', dataIndex: 'createdAt', render: formatDateTime },
        ]}
      />
    </div>
  );
}
