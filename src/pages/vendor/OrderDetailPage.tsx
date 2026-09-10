import { useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Grid, Typography, Button, TextField, MenuItem, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { DeliveryAssignmentTable } from '@/components/delivery/DeliveryAssignmentTable';
import { useAuth } from '@/hooks/useAuth';
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

/**
 * Vendor's own order detail page — a scaled-down mirror of admin/OrderDetailPage.tsx: same
 * "Change status to..." control, same PATCH /orders/{id}/status call (the backend already
 * allows hasAnyRole('ADMIN','VENDOR') there — this page just exposes it), minus REFUNDED,
 * which OrderServiceImpl#updateStatus rejects outright for anyone but ADMIN. A Vendor's other
 * actions on an order are through the Delivery section below: assign a delivery boy for their
 * own portion of the order and drive PACKED/READY_FOR_PICKUP/CANCELLED (see
 * NEXT_VENDOR_DELIVERY_STATUSES). DeliveryAssignmentTable is shared with the Admin page — same
 * component, same API calls; the backend (not this page) scopes what a Vendor caller can
 * see/do (DeliveryController's visibility filtering, DeliveryServiceImpl's vendor-ownership
 * checks).
 */
export function OrderDetailPage() {
  const { user } = useAuth();
  const vendorId = user!.id;
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

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => orderApi.updateStatus(id, status),
    onSuccess: (updated) => {
      notify.success(`Order status updated to ${updated.status}`);
      setNextStatus('');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err: ApiError) => notify.error(err.message || 'Could not update order status'),
  });

  if (isLoading || !order) return <PageHeader title="Loading order..." />;

  // GET /orders/{orderId} returns every item on the order, not just this vendor's (no
  // vendor-scoping server-side on that endpoint) — filter to this vendor's own items for
  // display, same as MyOrdersPage.tsx's row-level item count.
  const myItems = order.items.filter((i) => i.vendorId === vendorId);

console.log("vendorId:", vendorId);
console.log("vendorId:", myItems);
order.items.forEach((item) => {
  console.log("item.vendorId:", item.vendorId);
  console.log("match:", item.vendorId === vendorId);
});
  // REFUNDED is a financial action gated to ADMIN server-side (OrderServiceImpl#updateStatus)
  // — dropped here rather than offering a button guaranteed to 403.
  const options = (NEXT_ORDER_STATUSES[order.status] ?? []).filter((s) => s !== 'REFUNDED');

  return (
    <div>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        extra={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="outlined" onClick={() => navigate('/vendor/orders')}>
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
          </Stack>
        }
      />
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2.5}>
          <DescriptionItem label="Status" value={<StatusTag value={order.status} />} />
          <DescriptionItem label="Total (full order)" value={formatCurrency(order.totalAmount, order.currency)} />
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
        title="My Items"
        rowKey={(r) => r.productId}
        dataSource={myItems}
        emptyText="None of your products are on this order"
        columns={[
          { title: 'Product ID', dataIndex: 'productId' },
          { title: 'Quantity', dataIndex: 'quantity' },
          { title: 'Price', dataIndex: 'price', render: (v) => formatCurrency(v as number, order.currency) },
          { title: 'Subtotal', dataIndex: 'subtotal', render: (v) => formatCurrency(v as number, order.currency) },
        ]}
      />

      <DeliveryAssignmentTable orderId={id} />
    </div>
  );
}
