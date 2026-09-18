import { useEffect, useState } from 'react';
import { Paper, Grid, TextField, Button, Typography, Stack, Alert } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusTag } from '@/components/common/StatusTag';
import { authApi } from '@/api/authApi';
import { payoutApi } from '@/api/payoutApi';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { notify } from '@/utils/notify';
import type { ApiError } from '@/types/common';
import type { VendorPayoutResponseDto } from '@/types/payout';

export function MyPayoutsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const vendorId = user!.id;

  const { data: bankDetails } = useQuery({
    queryKey: ['vendor-bank-details', vendorId],
    queryFn: () => authApi.getBankDetails(vendorId),
  });

  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [upiVpa, setUpiVpa] = useState('');

  useEffect(() => {
    if (!bankDetails) return;
    setBankAccountNumber(bankDetails.bankAccountNumber ?? '');
    setBankIfscCode(bankDetails.bankIfscCode ?? '');
    setUpiVpa(bankDetails.upiVpa ?? '');
  }, [bankDetails]);

  const saveBankMutation = useMutation({
    mutationFn: () =>
      authApi.updateProfile(vendorId, {
        name: user!.name,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankIfscCode: bankIfscCode.trim() || undefined,
        upiVpa: upiVpa.trim() || undefined,
      }),
    onSuccess: () => {
      notify.success('Bank details saved');
      queryClient.invalidateQueries({ queryKey: ['vendor-bank-details', vendorId] });
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const hasPayoutDestination = !!(upiVpa.trim() || (bankAccountNumber.trim() && bankIfscCode.trim()));

  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ['vendor-payouts', vendorId],
    queryFn: () => payoutApi.mine(),
  });

  const [amount, setAmount] = useState('');
  const parsedAmount = Number(amount);
  const amountValid = amount.trim() !== '' && parsedAmount > 0;

  const requestMutation = useMutation({
    mutationFn: () => payoutApi.request(parsedAmount),
    onSuccess: () => {
      notify.success('Payout requested — awaiting admin approval');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['vendor-payouts', vendorId] });
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  return (
    <div>
      <PageHeader title="My Payouts" subtitle="Withdraw your earnings to your bank account or UPI ID" />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 2 }}>Bank / UPI Details</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Bank Account Number"
              fullWidth
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="IFSC Code"
              fullWidth
              value={bankIfscCode}
              onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="UPI VPA" fullWidth value={upiVpa} onChange={(e) => setUpiVpa(e.target.value)} />
          </Grid>
        </Grid>
        <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            loading={saveBankMutation.isPending}
            onClick={() => saveBankMutation.mutate()}
          >
            Save
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 2 }}>Request a Payout</Typography>
        {!hasPayoutDestination && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Add a bank account (with IFSC) or a UPI VPA above before requesting a payout.
          </Alert>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={amount.trim() !== '' && !amountValid}
            sx={{ width: { xs: '100%', sm: 220 } }}
            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
          />
          <Button
            variant="contained"
            disabled={!amountValid || !hasPayoutDestination}
            loading={requestMutation.isPending}
            onClick={() => requestMutation.mutate()}
          >
            Request Payout
          </Button>
        </Stack>
      </Paper>

      <DataTable<VendorPayoutResponseDto>
        title="Payout History"
        rowKey="payoutId"
        loading={payoutsLoading}
        dataSource={payouts ?? []}
        columns={[
          { title: 'Requested', dataIndex: 'requestedAt', render: (v) => formatDateTime(v as string) },
          { title: 'Amount', dataIndex: 'amount', render: (v) => formatCurrency(v as number) },
          { title: 'Mode', dataIndex: 'payoutMode' },
          { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
          { title: 'UTR', dataIndex: 'utrNumber', render: (v) => (v as string) ?? '-' },
          {
            title: 'Note',
            dataIndex: 'gatewayDescription',
            render: (v, r) => (r.rejectionReason ?? (v as string)) ?? '-',
          },
        ]}
      />
    </div>
  );
}
