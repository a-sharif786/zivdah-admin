import { useMemo, useState } from 'react';
import { TextField, MenuItem, Typography, Alert, Stack } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { DeliveryStatusControl } from '@/components/delivery/DeliveryStatusControl';
import { useMyDeliveries } from '@/hooks/useMyDeliveries';
import { formatCurrency, formatDateTime, formatAddress } from '@/utils/format';
import { FAILURE_REASON_LABELS } from '@/types/delivery';
import type { DeliveryWithOrder } from '@/hooks/useMyDeliveries';
import type { DeliveryStatus } from '@/types/delivery';

const STATUSES: DeliveryStatus[] = [
  'PENDING',
  'PACKED',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
];

// GET /restful/v1/api/delivery/my has no status filter server-side (unlike the admin
// portal's GET /orders/all?status=...) — fetch a delivery boy's full caseload once and
// filter/paginate client-side, same "fetch everything, compute client-side" pattern
// VendorDashboardPage.tsx uses for endpoints without server-side aggregation.
const FETCH_SIZE = 100;

export function MyDeliveriesPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | ''>('');

  const { rows, isLoading, isError } = useMyDeliveries(0, FETCH_SIZE);

  const filteredRows = useMemo(
    () => (statusFilter ? rows.filter((r) => r.delivery.status === statusFilter) : rows),
    [rows, statusFilter]
  );
  const pagedRows = filteredRows.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div>
      <PageHeader
        title="My Deliveries"
        subtitle="Every order assigned to you for pickup and delivery"
        extra={
          <TextField
            select
            size="small"
            label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as DeliveryStatus | '');
              setPage(0);
            }}
            sx={{ width: 200 }}
          >
            <MenuItem value="">All</MenuItem>
            {STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </TextField>
        }
      />

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load your deliveries. Please check your connection and try again.
        </Alert>
      )}

      <DataTable<DeliveryWithOrder>
        rowKey={(r) => r.delivery.id}
        loading={isLoading}
        dataSource={pagedRows}
        emptyText={
          statusFilter
            ? `No deliveries with status ${statusFilter.replace(/_/g, ' ')}`
            : 'No deliveries assigned to you yet'
        }
        pagination={{
          page,
          pageSize,
          total: filteredRows.length,
          onPageChange: setPage,
          onRowsPerPageChange: (s) => {
            setPageSize(s);
            setPage(0);
          },
        }}
        expandedRowRender={(r) => (
          <Stack spacing={1.5}>
            <Typography variant="body2">
              <strong>Delivery address:</strong> {r.order ? formatAddress(r.order) : 'Unavailable'}
            </Typography>
            {r.delivery.status === 'FAILED' && (
              <Typography variant="body2" color="error.main">
                <strong>Failure reason:</strong>{' '}
                {r.delivery.failureReason ? FAILURE_REASON_LABELS[r.delivery.failureReason] : '-'}
                {r.delivery.failureNote ? ` — ${r.delivery.failureNote}` : ''}
              </Typography>
            )}
            {r.order ? (
              <DataTable
                rowKey="productId"
                dataSource={r.order.items}
                size="small"
                columns={[
                  { title: 'Product ID', dataIndex: 'productId' },
                  { title: 'Quantity', dataIndex: 'quantity' },
                  {
                    title: 'Price',
                    dataIndex: 'price',
                    render: (v) => formatCurrency(v as number, r.order!.currency),
                  },
                  {
                    title: 'Subtotal',
                    dataIndex: 'subtotal',
                    render: (v) => formatCurrency(v as number, r.order!.currency),
                  },
                ]}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                {r.orderError ? 'Order items could not be loaded.' : 'Loading order items…'}
              </Typography>
            )}
          </Stack>
        )}
        columns={[
          { title: 'Order #', render: (_, r) => r.order?.orderNumber ?? `Order #${r.delivery.orderId}` },
          { title: 'Customer', render: (_, r) => `Customer #${r.delivery.userId}` },
          {
            title: 'Amount',
            render: (_, r) => (r.order ? formatCurrency(r.order.totalAmount, r.order.currency) : '-'),
          },
          { title: 'Order Status', render: (_, r) => (r.order ? <StatusTag value={r.order.status} /> : '-') },
          { title: 'Delivery Status', render: (_, r) => <StatusTag value={r.delivery.status} /> },
          { title: 'Assigned', render: (_, r) => formatDateTime(r.delivery.assignedAt) },
          { title: 'Update Delivery Status', render: (_, r) => <DeliveryStatusControl delivery={r.delivery} /> },
        ]}
      />
    </div>
  );
}
