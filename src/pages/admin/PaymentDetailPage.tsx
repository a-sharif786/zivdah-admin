import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Grid, Typography, Button, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { ConfirmButton } from '@/components/common/ConfirmButton';
import { paymentApi } from '@/api/paymentApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { notify } from '@/utils/notify';
import type { ApiError } from '@/types/common';

function DescriptionItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" component="div">{value}</Typography>
    </Grid>
  );
}

export function PaymentDetailPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = Number(paymentId);

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentApi.getById(id),
    enabled: Number.isFinite(id),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['payment', id] });

  const successMutation = useMutation({
    mutationFn: () => paymentApi.markSuccess(id),
    onSuccess: () => {
      notify.success('Marked as successful');
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const failedMutation = useMutation({
    mutationFn: () => paymentApi.markFailed(id),
    onSuccess: () => {
      notify.success('Marked as failed');
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  if (isLoading || !payment) return <PageHeader title="Loading payment..." />;

  const isTerminal = ['SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(payment.status);

  return (
    <div>
      <PageHeader
        title={`Payment #${payment.paymentId}`}
        extra={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/admin/payments')}>
              Back
            </Button>
            {!isTerminal && (
              <>
                <ConfirmButton
                  title="Mark this payment as successful?"
                  loading={successMutation.isPending}
                  onConfirm={() => successMutation.mutate()}
                  variant="contained"
                >
                  Mark Success
                </ConfirmButton>
                <ConfirmButton
                  title="Mark this payment as failed?"
                  color="error"
                  loading={failedMutation.isPending}
                  onConfirm={() => failedMutation.mutate()}
                >
                  Mark Failed
                </ConfirmButton>
              </>
            )}
          </Stack>
        }
      />
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          <DescriptionItem label="Status" value={<StatusTag value={payment.status} />} />
          <DescriptionItem label="Order ID" value={payment.orderId} />
          <DescriptionItem label="User ID" value={payment.userId} />
          <DescriptionItem label="Amount" value={formatCurrency(payment.amount, payment.currency)} />
          <DescriptionItem label="Method" value={payment.method} />
          <DescriptionItem label="Transaction ID" value={payment.transactionId ?? '-'} />
          <DescriptionItem label="Gateway" value={payment.gatewayName ?? '-'} />
          <DescriptionItem label="Created" value={formatDateTime(payment.createdAt)} />
          <DescriptionItem label="Paid At" value={formatDateTime(payment.paidAt)} />
        </Grid>
      </Paper>
    </div>
  );
}
