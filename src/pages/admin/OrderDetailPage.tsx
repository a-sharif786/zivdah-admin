import { useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Grid, Typography, Button, TextField, MenuItem, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmButton } from '@/components/common/ConfirmButton';
import { DeliveryAssignmentTable } from '@/components/delivery/DeliveryAssignmentTable';
import { InvoiceSection } from '@/components/invoice/InvoiceSection';
import { orderApi } from '@/api/orderApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { notify } from '@/utils/notify';
import { NEXT_ORDER_STATUSES } from '@/types/order';
import type { OrderItemDto, OrderStatus } from '@/types/order';
import type { ApiError } from '@/types/common';

function DescriptionItem({ label, value, span = 1 }: { label: string; value: ReactNode; span?: number }) {
  return (
    <Grid size={{ xs: 12, sm: span === 2 ? 12 : 6 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div">{value}</Typography>
    </Grid>
  );
}

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = Number(orderId);
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getById(id),
    enabled: Number.isFinite(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderApi.cancel(id),
    onSuccess: () => {
      notify.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => orderApi.updateStatus(id, status),
    onSuccess: (updated) => {
      notify.success(`Order status updated to ${updated.status}`);
      setNextStatus('');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  if (isLoading || !order) return <PageHeader title="Loading order..." />;

  const cancellable = !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status);
  const options = NEXT_ORDER_STATUSES[order.status] ?? [];

  return (
    <div>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        extra={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="outlined" onClick={() => navigate('/admin/orders')}>
              Back
            </Button>
            {options.length > 0 && (
              <>
                <TextField
                  select
                  size="small"
                  label="Change status to..."
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                  sx={{ width: 200 }}
                >
                  {options.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  disabled={!nextStatus}
                  loading={statusMutation.isPending}
                  onClick={() => nextStatus && statusMutation.mutate(nextStatus)}
                >
                  Update
                </Button>
              </>
            )}
            {cancellable && (
              <ConfirmButton title="Cancel this order?" color="error" loading={cancelMutation.isPending} onConfirm={() => cancelMutation.mutate()}>
                Cancel Order
              </ConfirmButton>
            )}
          </Stack>
        }
      />
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2.5}>
          <DescriptionItem label="Status" value={<StatusTag value={order.status} />} />
          <DescriptionItem label="User ID" value={order.userId} />
          <DescriptionItem label="Total" value={formatCurrency(order.totalAmount, order.currency)} />
          <DescriptionItem label="Sub Total" value={formatCurrency(order.subTotal, order.currency)} />
          <DescriptionItem label="Tax" value={formatCurrency(order.totalTaxAmount, order.currency)} />
          <DescriptionItem label="Discount" value={formatCurrency(order.discountAmount, order.currency)} />
          <DescriptionItem label="Coupon" value={order.couponCode ?? '-'} />
          <DescriptionItem label="Created" value={formatDateTime(order.createdAt)} />
          <DescriptionItem
            label="Delivery Address"
            span={2}
            value={[
              order.deliveryAddressLine1,
              order.deliveryAddressLine2,
              order.deliveryCity,
              order.deliveryState,
              order.deliveryPinCode,
              order.deliveryCountry,
            ]
              .filter(Boolean)
              .join(', ')}
          />
        </Grid>
      </Paper>

      <DataTable<OrderItemDto>
        title="Order Items"
        rowKey={(r) => r.productId}
        dataSource={order.items}
        columns={[
          { title: 'Product ID', dataIndex: 'productId' },
          { title: 'Vendor', dataIndex: 'vendorId', render: (v) => (v ? `#${v}` : 'Platform') },
          { title: 'Quantity', dataIndex: 'quantity' },
          { title: 'Price', dataIndex: 'price', render: (v) => formatCurrency(v as number, order.currency) },
          { title: 'Subtotal', dataIndex: 'subtotal', render: (v) => formatCurrency(v as number, order.currency) },
        ]}
      />

      <InvoiceSection orderId={id} canGenerate />

      <DeliveryAssignmentTable orderId={id} />
    </div>
  );
}
