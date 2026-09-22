import { useState } from 'react';
import {
  TextField,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Grid,
  Typography,
} from '@mui/material';
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
import type { PayoutMode, PayoutStatus, VendorPayoutResponseDto } from '@/types/payout';

const STATUSES: PayoutStatus[] = ['REQUESTED', 'PROCESSING', 'SUCCESS', 'FAILED', 'REJECTED'];
const PAYOUT_MODES: PayoutMode[] = ['UPI', 'IMPS', 'NEFT', 'RTGS'];

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
  const vendors = users?.filter((u) => u.role === 'VENDOR') ?? [];

  const initiatorLabel = (r: VendorPayoutResponseDto) =>
    r.initiatedByRole === 'ADMIN'
      ? `Admin (${users?.find((u) => u.userId === r.initiatedByUserId)?.name ?? `#${r.initiatedByUserId}`})`
      : 'Vendor (self)';

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-vendor-payouts'] });

  const [initiateVendorId, setInitiateVendorId] = useState<number | ''>('');
  const [initiateAmount, setInitiateAmount] = useState('');
  const [initiateMode, setInitiateMode] = useState<PayoutMode | ''>('');
  const parsedInitiateAmount = Number(initiateAmount);
  const initiateAmountValid = initiateAmount.trim() !== '' && parsedInitiateAmount > 0;

  const initiateMutation = useMutation({
    mutationFn: () =>
      payoutApi.requestAsAdmin({
        vendorId: initiateVendorId as number,
        amount: parsedInitiateAmount,
        payoutMode: initiateMode as PayoutMode,
      }),
    onSuccess: () => {
      notify.success('Payout requested for vendor — awaiting approval');
      setInitiateVendorId('');
      setInitiateAmount('');
      setInitiateMode('');
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const approveMutation = useMutation({
    mutationFn: (payoutId: number) => payoutApi.approve(payoutId),
    onSuccess: (updated) => {
      // The gateway can reject a request synchronously at submission time (e.g. "Payee VPA is
      // mandatory for UPI Payments") — that comes back as HTTP 200 with status FAILED, not a
      // thrown error, so it needs its own branch rather than falling into the success toast.
      if (updated.status === 'FAILED') {
        notify.error(updated.gatewayDescription || `Payout failed at gateway (${updated.gatewayStatus ?? 'Invalid Request'})`);
      } else {
        notify.success(`Payout submitted to gateway (${updated.gatewayStatus ?? updated.status})`);
      }
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const refreshMutation = useMutation({
    mutationFn: (payoutId: number) => payoutApi.refreshStatus(payoutId),
    onSuccess: (updated) => {
      if (updated.status === 'FAILED') {
        notify.error(updated.gatewayDescription || `Status: ${updated.status}`);
      } else {
        notify.success(`Status: ${updated.status}`);
      }
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

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 2 }}>Initiate Payout for a Vendor</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              select
              label="Vendor"
              fullWidth
              value={initiateVendorId}
              onChange={(e) => setInitiateVendorId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              {vendors.map((v) => (
                <MenuItem key={v.userId} value={v.userId}>
                  {v.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Amount"
              type="number"
              fullWidth
              value={initiateAmount}
              onChange={(e) => setInitiateAmount(e.target.value)}
              error={initiateAmount.trim() !== '' && !initiateAmountValid}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              select
              label="Mode"
              fullWidth
              value={initiateMode}
              onChange={(e) => setInitiateMode(e.target.value as PayoutMode)}
            >
              {PAYOUT_MODES.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            disabled={!initiateVendorId || !initiateAmountValid || !initiateMode}
            loading={initiateMutation.isPending}
            onClick={() => initiateMutation.mutate()}
          >
            Initiate Payout
          </Button>
        </Stack>
      </Paper>

      <DataTable<VendorPayoutResponseDto>
        rowKey="payoutId"
        loading={isLoading}
        dataSource={payouts ?? []}
        columns={[
          { title: 'Vendor', dataIndex: 'vendorId', render: (v) => vendorName(v as number) },
          { title: 'Amount', dataIndex: 'amount', render: (v) => formatCurrency(v as number) },
          {
            title: 'Destination',
            dataIndex: 'payeeVpa',
            render: (_v, r) =>
              r.payeeVpa || (r.accountNo ? `${r.accountNo}${r.ifscBankCode ? ` (${r.ifscBankCode})` : ''}` : '-'),
          },
          { title: 'Mode', dataIndex: 'payoutMode' },
          { title: 'Initiated By', render: (_v, r) => initiatorLabel(r) },
          { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
          { title: 'Requested', dataIndex: 'requestedAt', render: (v) => formatDateTime(v as string) },
          { title: 'UTR', dataIndex: 'utrNumber', render: (v) => (v as string) ?? '-' },
          {
            title: 'Note',
            dataIndex: 'gatewayDescription',
            render: (v, r) => (r.rejectionReason ?? (v as string)) ?? '-',
          },
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
