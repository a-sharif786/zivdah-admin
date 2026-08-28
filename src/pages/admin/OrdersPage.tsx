import { useState } from 'react';
import { TextField, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
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
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const navigate = useNavigate();

  const { items, total, isLoading } = usePagedQuery<OrderResponseDto>(
    ['admin-orders', status || 'ALL'],
    (p, s) => orderApi.getAll(p, s, status || undefined),
    page,
    size
  );

  return (
    <div>
      <PageHeader
        title="Orders"
        extra={
          <TextField
            select
            size="small"
            label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus | '');
              setPage(0);
            }}
            sx={{ width: 200 }}
          >
            <MenuItem value="">All</MenuItem>
            {STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        }
      />
      <DataTable<OrderResponseDto>
        rowKey="orderId"
        loading={isLoading}
        dataSource={items}
        onRowClick={(record) => navigate(`/admin/orders/${record.orderId}`)}
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
        columns={[
          { title: 'Order #', dataIndex: 'orderNumber' },
          { title: 'User', dataIndex: 'userId' },
          { title: 'Total', dataIndex: 'totalAmount', render: (v, r) => formatCurrency(v as number, r.currency) },
          { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
          { title: 'Items', render: (_, r) => r.items?.length ?? 0 },
          { title: 'Created', dataIndex: 'createdAt', render: (v) => formatDateTime(v as string) },
        ]}
      />
    </div>
  );
}
