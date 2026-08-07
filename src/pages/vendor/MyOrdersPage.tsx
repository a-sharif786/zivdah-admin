import { useState } from 'react';
import { Table } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { useAuth } from '@/hooks/useAuth';
import { orderApi } from '@/api/orderApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { OrderItemDto, OrderResponseDto } from '@/types/order';

export function MyOrdersPage() {
  const { user } = useAuth();
  const vendorId = user!.id;
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const { items, total, isLoading } = usePagedQuery<OrderResponseDto>(
    ['vendor-orders', vendorId],
    (p, s) => orderApi.getByVendor(vendorId, p, s),
    page,
    size
  );

  return (
    <div>
      <PageHeader title="My Orders" />
      <Table<OrderResponseDto>
        rowKey="orderId"
        loading={isLoading}
        dataSource={items}
        pagination={{
          current: page + 1,
          pageSize: size,
          total,
          onChange: (p, s) => {
            setPage(p - 1);
            setSize(s);
          },
        }}
        expandable={{
          expandedRowRender: (record) => (
            <Table<OrderItemDto>
              rowKey="productId"
              dataSource={record.items}
              pagination={false}
              size="small"
              columns={[
                { title: 'Product ID', dataIndex: 'productId' },
                { title: 'Quantity', dataIndex: 'quantity' },
                { title: 'Price', dataIndex: 'price', render: (v: number) => formatCurrency(v, record.currency) },
                { title: 'Subtotal', dataIndex: 'subtotal', render: (v: number) => formatCurrency(v, record.currency) },
              ]}
            />
          ),
        }}
        columns={[
          { title: 'Order #', dataIndex: 'orderNumber' },
          { title: 'Status', dataIndex: 'status', render: (v: string) => <StatusTag value={v} /> },
          { title: 'My Items', render: (_, r) => r.items?.length ?? 0 },
          { title: 'Order Total', dataIndex: 'totalAmount', render: (v: number, r) => formatCurrency(v, r.currency) },
          { title: 'Created', dataIndex: 'createdAt', render: formatDateTime },
        ]}
      />
      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
        Each row's item list is filtered to only your products. Order-level totals reflect the full order, which
        may include other vendors' items.
      </p>
    </div>
  );
}
