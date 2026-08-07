import { useState } from 'react';
import { Table, Select, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { paymentApi } from '@/api/paymentApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { PaymentResponseDto, PaymentStatus } from '@/types/payment';

const STATUSES: PaymentStatus[] = ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'];

export function PaymentsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [status, setStatus] = useState<PaymentStatus | undefined>(undefined);
  const navigate = useNavigate();

  const { items, total, isLoading } = usePagedQuery<PaymentResponseDto>(
    ['admin-payments', status ?? 'ALL'],
    (p, s) => paymentApi.getAll(p, s, status),
    page,
    size
  );

  return (
    <div>
      <PageHeader
        title="Payments"
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
      <Table<PaymentResponseDto>
        rowKey="paymentId"
        loading={isLoading}
        dataSource={items}
        onRow={(record) => ({ onClick: () => navigate(`/admin/payments/${record.paymentId}`) })}
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
          { title: 'Payment ID', dataIndex: 'paymentId' },
          { title: 'Order ID', dataIndex: 'orderId' },
          { title: 'User ID', dataIndex: 'userId' },
          { title: 'Amount', dataIndex: 'amount', render: (v: number, r) => formatCurrency(v, r.currency) },
          { title: 'Method', dataIndex: 'method' },
          { title: 'Status', dataIndex: 'status', render: (v: string) => <StatusTag value={v} /> },
          { title: 'Created', dataIndex: 'createdAt', render: formatDateTime },
        ]}
      />
    </div>
  );
}
