import { useState } from 'react';
import { TextField, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { paymentApi } from '@/api/paymentApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { PaymentResponseDto, PaymentStatus } from '@/types/payment';

const STATUSES: PaymentStatus[] = ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'];

export function PaymentsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const navigate = useNavigate();

  const { items, total, isLoading } = usePagedQuery<PaymentResponseDto>(
    ['admin-payments', status || 'ALL'],
    (p, s) => paymentApi.getAll(p, s, status || undefined),
    page,
    size
  );

  return (
    <div>
      <PageHeader
        title="Payments"
        extra={
          <TextField
            select
            size="small"
            label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as PaymentStatus | '');
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
      <DataTable<PaymentResponseDto>
        rowKey="paymentId"
        loading={isLoading}
        dataSource={items}
        onRowClick={(record) => navigate(`/admin/payments/${record.paymentId}`)}
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
          { title: 'Payment ID', dataIndex: 'paymentId' },
          { title: 'Order ID', dataIndex: 'orderId' },
          { title: 'User ID', dataIndex: 'userId' },
          { title: 'Amount', dataIndex: 'amount', render: (v, r) => formatCurrency(v as number, r.currency) },
          { title: 'Method', dataIndex: 'method' },
          { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
          { title: 'Created', dataIndex: 'createdAt', render: (v) => formatDateTime(v as string) },
        ]}
      />
    </div>
  );
}
