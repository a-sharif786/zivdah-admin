import { useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Grid, Typography, Button, TextField, MenuItem, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmButton } from '@/components/common/ConfirmButton';
import { orderApi } from '@/api/orderApi';
import { deliveryApi } from '@/api/deliveryApi';
import { authApi } from '@/api/authApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { notify } from '@/utils/notify';
import { NEXT_ORDER_STATUSES } from '@/types/order';
import type { OrderItemDto, OrderStatus } from '@/types/order';
import { NEXT_VENDOR_DELIVERY_STATUSES } from '@/types/delivery';
import type { DeliveryResponseDto, DeliveryStatus } from '@/types/delivery';
import type { ApiError } from '@/types/common';

function DescriptionItem({ label, value, span = 1 }: { label: string; value: ReactNode; span?: number }) {
  return (
    <Grid size={{ xs: 12, sm: span === 2 ? 12 : 6 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Grid>
  );
}

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = Number(orderId);
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');
  const [assignDeliveryId, setAssignDeliveryId] = useState<number | null>(null);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState<number | ''>('');
  const [deliveryNextStatus, setDeliveryNextStatus] = useState<Record<number, DeliveryStatus | ''>>({});

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getById(id),
    enabled: Number.isFinite(id),
  });

  // One row per vendor on the order (see zivdah-delivery-service — a multi-vendor order
  // gets one Delivery per vendor). Not yet created until the order reaches CONFIRMED.
  const { data: deliveries } = useQuery({
    queryKey: ['deliveries', id],
    queryFn: () => deliveryApi.getByOrder(id),
    enabled: Number.isFinite(id),
  });

  // Only active/verified delivery boys are assignable — an inactive account can't log in to
  // pick the order up anyway (see AuthServiceImpl's active check at login), so offering one
  // here would just assign a delivery nobody can ever act on.
  const { data: deliveryBoys } = useQuery({
    queryKey: ['delivery-boy-users'],
    queryFn: () => authApi.getAllUsers(),
    select: (users) => users.filter((u) => u.role === 'DELIVERY_BOY' && u.active),
  });

  const assignMutation = useMutation({
    mutationFn: ({ deliveryId, deliveryBoyId }: { deliveryId: number; deliveryBoyId: number }) =>
      deliveryApi.assign(deliveryId, deliveryBoyId),
    onSuccess: () => {
      notify.success('Delivery boy assigned');
      setAssignDeliveryId(null);
      setSelectedDeliveryBoy('');
      queryClient.invalidateQueries({ queryKey: ['deliveries', id] });
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const deliveryStatusMutation = useMutation({
    mutationFn: ({ deliveryId, status }: { deliveryId: number; status: DeliveryStatus }) =>
      deliveryApi.updateStatus(deliveryId, status),
    onSuccess: () => {
      notify.success('Delivery status updated');
      queryClient.invalidateQueries({ queryKey: ['deliveries', id] });
    },
    onError: (err: ApiError) => notify.error(err.message),
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

      <DataTable<DeliveryResponseDto>
        title="Delivery"
        rowKey="id"
        dataSource={deliveries ?? []}
        emptyText="No delivery record yet — created once the order is confirmed"
        columns={[
          {
            title: 'Vendor',
            dataIndex: 'vendorId',
            // null = platform-owned items on this order, no single vendor to attribute the
            // delivery to (see OrderServiceClient#getVendorIds) — same "Platform" fallback the
            // Order Items table above uses for the same null.
            render: (v) => (v ? `#${v}` : 'Platform'),
          },
          { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
          { title: 'Delivery Boy', dataIndex: 'deliveryBoyId', render: (v) => (v ? `#${v}` : 'Unassigned') },
          {
            title: 'Actions',
            render: (_v, row) => (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {!row.deliveryBoyId &&
                  (assignDeliveryId === row.id ? (
                    <>
                      <TextField
                        select
                        size="small"
                        label="Delivery boy"
                        value={selectedDeliveryBoy}
                        onChange={(e) => setSelectedDeliveryBoy(Number(e.target.value))}
                        sx={{ width: 160 }}
                      >
                        {(deliveryBoys ?? []).map((u) => (
                          <MenuItem key={u.userId} value={u.userId}>
                            {u.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!selectedDeliveryBoy}
                        loading={assignMutation.isPending}
                        onClick={() =>
                          selectedDeliveryBoy &&
                          assignMutation.mutate({ deliveryId: row.id, deliveryBoyId: selectedDeliveryBoy })
                        }
                      >
                        Save
                      </Button>
                      <Button size="small" onClick={() => setAssignDeliveryId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => setAssignDeliveryId(row.id)}>
                      Assign Delivery Boy
                    </Button>
                  ))}
                {NEXT_VENDOR_DELIVERY_STATUSES[row.status]?.length > 0 && (
                  <>
                    <TextField
                      select
                      size="small"
                      label="Set status"
                      value={deliveryNextStatus[row.id] ?? ''}
                      onChange={(e) =>
                        setDeliveryNextStatus((s) => ({ ...s, [row.id]: e.target.value as DeliveryStatus }))
                      }
                      sx={{ width: 160 }}
                    >
                      {NEXT_VENDOR_DELIVERY_STATUSES[row.status].map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!deliveryNextStatus[row.id]}
                      loading={deliveryStatusMutation.isPending}
                      onClick={() => {
                        const status = deliveryNextStatus[row.id];
                        if (status) deliveryStatusMutation.mutate({ deliveryId: row.id, status });
                      }}
                    >
                      Update
                    </Button>
                  </>
                )}
              </Stack>
            ),
          },
        ]}
      />
    </div>
  );
}
