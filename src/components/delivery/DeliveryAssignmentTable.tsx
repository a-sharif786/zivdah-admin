import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/common/DataTable';
import { StatusTag } from '@/components/common/StatusTag';
import { deliveryApi } from '@/api/deliveryApi';
import { authApi } from '@/api/authApi';
import { useAuth } from '@/hooks/useAuth';
import { notify } from '@/utils/notify';
import { NEXT_VENDOR_DELIVERY_STATUSES } from '@/types/delivery';
import type { DeliveryResponseDto, DeliveryStatus } from '@/types/delivery';
import type { ApiError } from '@/types/common';

/**
 * The order-assignment section shared by Admin's and Vendor's order detail pages — one row
 * per vendor on the order (see zivdah-delivery-service — a multi-vendor order gets one
 * Delivery per vendor). Server-side visibility already scopes what each caller sees
 * (DeliveryController#getByOrder / #isVisibleTo): Admin sees every vendor's row, a Vendor
 * only their own. Same for assignment (DeliveryServiceImpl#assignDeliveryBoy) — a Vendor may
 * only assign against a delivery they own, and only ADMIN may reassign one that already has a
 * delivery boy (409 otherwise, mirrored here client-side by only offering "Reassign" to Admin,
 * so a Vendor is never shown a button that's guaranteed to fail server-side).
 */
export function DeliveryAssignmentTable({ orderId }: { orderId: number }) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [assignDeliveryId, setAssignDeliveryId] = useState<number | null>(null);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState<number | ''>('');
  const [deliveryNextStatus, setDeliveryNextStatus] = useState<Record<number, DeliveryStatus | ''>>({});

  const deliveriesKey = ['deliveries', orderId];

  const { data: deliveries, isLoading } = useQuery({
    queryKey: deliveriesKey,
    queryFn: () => deliveryApi.getByOrder(orderId),
    enabled: Number.isFinite(orderId),
  });

  // Narrower than authApi.getAllUsers (ADMIN-only) — the only user-listing endpoint a
  // VENDOR is allowed to call. Kept unfiltered by `active` here so an already-assigned
  // delivery boy's name still resolves even if they've since been deactivated; the assign
  // dropdown below filters to active ones itself.
  const { data: deliveryBoys } = useQuery({
    queryKey: ['delivery-boy-users'],
    queryFn: () => authApi.getDeliveryBoys(),
  });

  const deliveryBoyNames = useMemo(
    () => new Map((deliveryBoys ?? []).map((u) => [u.userId, u.name])),
    [deliveryBoys]
  );
  const activeDeliveryBoys = useMemo(() => (deliveryBoys ?? []).filter((u) => u.active), [deliveryBoys]);

  const assignMutation = useMutation({
    mutationFn: ({ deliveryId, deliveryBoyId }: { deliveryId: number; deliveryBoyId: number }) =>
      deliveryApi.assign(deliveryId, deliveryBoyId),
    onSuccess: () => {
      notify.success('Delivery boy assigned');
      setAssignDeliveryId(null);
      setSelectedDeliveryBoy('');
      queryClient.invalidateQueries({ queryKey: deliveriesKey });
    },
    onError: (err: ApiError) => notify.error(err.message || 'Could not assign delivery boy'),
  });

  const deliveryStatusMutation = useMutation({
    mutationFn: ({ deliveryId, status }: { deliveryId: number; status: DeliveryStatus }) =>
      deliveryApi.updateStatus(deliveryId, status),
    onSuccess: () => {
      notify.success('Delivery status updated');
      queryClient.invalidateQueries({ queryKey: deliveriesKey });
    },
    onError: (err: ApiError) => notify.error(err.message || 'Could not update delivery status'),
  });

  return (
    <DataTable<DeliveryResponseDto>
      title="Delivery"
      rowKey="id"
      loading={isLoading}
      dataSource={deliveries ?? []}
      emptyText="No delivery record yet — created once the order is confirmed"
      columns={[
        { title: 'Vendor', dataIndex: 'vendorId', render: (v) => (v ? `#${v}` : 'Platform') },
        { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
        {
          title: 'Delivery Boy',
          dataIndex: 'deliveryBoyId',
          render: (v) => {
            const id = v as number | null;
            if (!id) return 'Unassigned';
            return deliveryBoyNames.get(id) ?? `#${id}`;
          },
        },
        {
          title: 'Actions',
          render: (_v, row) => {
            // Once assigned, only Admin may reassign (server-side: 409 for anyone else —
            // see DeliveryServiceImpl#assignDeliveryBoy). A Vendor viewing an already-assigned
            // delivery simply doesn't get the button, rather than a guaranteed-fail click.
            const canAssign = !row.deliveryBoyId || isAdmin;
            return (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {canAssign &&
                  (assignDeliveryId === row.id ? (
                    <>
                      <TextField
                        select
                        size="small"
                        label="Delivery boy"
                        value={selectedDeliveryBoy}
                        onChange={(e) => setSelectedDeliveryBoy(Number(e.target.value))}
                        disabled={assignMutation.isPending}
                        sx={{ width: 160 }}
                      >
                        {activeDeliveryBoys.map((u) => (
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
                      <Button size="small" disabled={assignMutation.isPending} onClick={() => setAssignDeliveryId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => setAssignDeliveryId(row.id)}>
                      {row.deliveryBoyId ? 'Reassign Delivery Boy' : 'Assign Delivery Boy'}
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
                      disabled={deliveryStatusMutation.isPending}
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
            );
          },
        },
      ]}
    />
  );
}
