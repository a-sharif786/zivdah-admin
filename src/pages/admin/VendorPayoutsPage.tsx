import { useState } from 'react';
import { TextField, MenuItem, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmButton } from '@/components/common/ConfirmButton';
import { payoutApi } from '@/api/payoutApi';
import { authApi } from '@/api/authApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { notify } from '@/utils/notify';
import type { ApiError } from '@/types/common';
import type { PayoutStatus, VendorPayoutResponseDto } from '@/types/payout';

const STATUSES: PayoutStatus[] = ['REQUESTED', 'PROCESSING', 'SUCCESS', 'FAILED', 'REJECTED'];

export function VendorPayoutsPage() {
  const [status, setStatus] = useState<PayoutStatus | ''>('');
  const queryClient = useQueryClient();

  const { data: payouts, isLoading } = useQuery({
    queryKey: ['admin-vendor-payouts', status || 'ALL'],
    queryFn: () => payoutApi.getAll(status || undefined),
  });

  // Payouts only carry a vendorId — resolve it to a name client-side against the full user
  // list, since payment-service has no cross-service enrichment for this.
  const { data: users } = useQuery({ queryKey: ['all-users'], queryFn: () => authApi.getAllUsers() });
  const vendorName = (vendorId: number) => users?.find((u) => u.userId === vendorId)?.name ?? `Vendor #${vendorId}`;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-vendor-payouts'] });

  const approveMutation = useMutation({
    mutationFn: (payoutId: number) => payoutApi.approve(payoutId),
    onSuccess: (updated) => {
      notify.success(`Payout submitted to gateway (${updated.gatewayStatus ?? updated.status})`);
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const refreshMutation = useMutation({
    mutationFn: (payoutId: number) => payoutApi.refreshStatus(payoutId),
    onSuccess: (updated) => {
      notify.success(`Status: ${updated.status}`);
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const [rejectTarget, setRejectTarget] = useState<VendorPayoutResponseDto | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const rejectMutation = useMutation({
    mutationFn: () => payoutApi.reject(rejectTarget!.payoutId, rejectReason),
    onSuccess: () => {
      notify.success('Payout rejected');
      setRejectTarget(null);
      setRejectReason('');
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="Vendor Payouts"
        extra={
          <TextField
            select
            size="small"
            label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value as PayoutStatus | '')}
            sx={{ width: { xs: '100%', sm: 200 } }}
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
      <DataTable<VendorPayoutResponseDto>
        rowKey="payoutId"
        loading={isLoading}
        dataSource={payouts ?? []}
        columns={[
          { title: 'Vendor', dataIndex: 'vendorId', render: (v) => vendorName(v as number) },
          { title: 'Amount', dataIndex: 'amount', render: (v) => formatCurrency(v as number) },
          { title: 'Destination', dataIndex: 'payeeVpa', render: (_v, r) => r.payeeVpa || r.accountNo || '-' },
          { title: 'Mode', dataIndex: 'payoutMode' },
          { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
          { title: 'Requested', dataIndex: 'requestedAt', render: (v) => formatDateTime(v as string) },
          {
            title: 'Actions',
            render: (_v, r) => (
              <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                {r.status === 'REQUESTED' && (
                  <>
                    <ConfirmButton
                      title={`Approve payout of ${formatCurrency(r.amount)} to this vendor?`}
                      loading={approveMutation.isPending}
                      onConfirm={() => approveMutation.mutate(r.payoutId)}
                      variant="contained"
                    >
                      Approve
                    </ConfirmButton>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => setRejectTarget(r)}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {r.status === 'PROCESSING' && (
                  <Button
                    size="small"
                    variant="outlined"
                    loading={refreshMutation.isPending}
                    onClick={() => refreshMutation.mutate(r.payoutId)}
                  >
                    Refresh Status
                  </Button>
                )}
              </Stack>
            ),
          },
        ]}
      />

      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)}>
        <DialogTitle>Reject payout of {rejectTarget ? formatCurrency(rejectTarget.amount) : ''}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Reason"
            fullWidth
            multiline
            minRows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!rejectReason.trim()}
            loading={rejectMutation.isPending}
            onClick={() => rejectMutation.mutate()}
          >
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
