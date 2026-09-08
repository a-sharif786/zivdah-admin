import { useState } from 'react';
import { Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { useAuth } from '@/hooks/useAuth';
import { orderApi } from '@/api/orderApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { OrderResponseDto } from '@/types/order';

export function MyOrdersPage() {
  const { user } = useAuth();
  const vendorId = user!.id;
  const navigate = useNavigate();
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
      <DataTable<OrderResponseDto>
        rowKey="orderId"
        loading={isLoading}
        dataSource={items}
        onRowClick={(record) => navigate(`/vendor/orders/${record.orderId}`)}
        pagination={{
          page,
          pageSize: size,
          total,
          onPageChange: setPage,
          onRowsPerPageChange: (s) => {
            setSize(s);
            setPage(0);
          },
        }}
        expandedRowRender={(record) => (
          <DataTable
            rowKey="productId"
            dataSource={record.items}
            size="small"
            columns={[
              { title: 'Product ID', dataIndex: 'productId' },
              { title: 'Quantity', dataIndex: 'quantity' },
              { title: 'Price', dataIndex: 'price', render: (v) => formatCurrency(v as number, record.currency) },
              { title: 'Subtotal', dataIndex: 'subtotal', render: (v) => formatCurrency(v as number, record.currency) },
            ]}
          />
        )}
        columns={[
          { title: 'Order #', dataIndex: 'orderNumber' },
          { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
          { title: 'My Items', render: (_, r) => r.items?.length ?? 0 },
          { title: 'Order Total', dataIndex: 'totalAmount', render: (v, r) => formatCurrency(v as number, r.currency) },
          { title: 'Created', dataIndex: 'createdAt', render: (v) => formatDateTime(v as string) },
        ]}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Each row's item list is filtered to only your products. Order-level totals reflect the full order, which may
        include other vendors' items.
      </Typography>
    </div>
  );
}
