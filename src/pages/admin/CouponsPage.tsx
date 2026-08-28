import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Switch,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDeleteButton } from '@/components/common/ConfirmButton';
import { DataTable } from '@/components/common/DataTable';
import { CouponForm } from '@/components/forms/CouponForm';
import { couponApi } from '@/api/couponApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { notify } from '@/utils/notify';
import type { ApplyCouponResponseDto, CouponRequestDto, CouponResponseDto } from '@/types/coupon';
import type { ApiError } from '@/types/common';

export function CouponsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [previewAmount, setPreviewAmount] = useState<number>(500);
  const [previewResult, setPreviewResult] = useState<ApplyCouponResponseDto | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['coupons'], queryFn: couponApi.getAll });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['coupons'] });

  const createMutation = useMutation({
    mutationFn: (dto: CouponRequestDto) => couponApi.create(dto),
    onSuccess: () => {
      notify.success('Coupon created');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => couponApi.toggle(id),
    onSuccess: invalidate,
    onError: (err: ApiError) => notify.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => couponApi.remove(id),
    onSuccess: () => {
      notify.success('Coupon deleted');
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const applyPreviewMutation = useMutation({
    mutationFn: () => couponApi.apply({ code: previewCode, orderAmount: previewAmount }),
    onSuccess: setPreviewResult,
    onError: (err: ApiError) => notify.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="Coupons"
        extra={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
            New Coupon
          </Button>
        }
      />
      <DataTable<CouponResponseDto>
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        columns={[
          { title: 'Code', dataIndex: 'code' },
          { title: 'Type', dataIndex: 'discountType' },
          {
            title: 'Value',
            dataIndex: 'discountValue',
            render: (v, r) => (r.discountType === 'PERCENTAGE' ? `${v}%` : formatCurrency(v as number)),
          },
          { title: 'Used / Limit', render: (_, r) => `${r.usedCount} / ${r.usageLimit}` },
          { title: 'Valid From', dataIndex: 'validFrom', render: (v) => formatDateTime(v as string) },
          { title: 'Valid Until', dataIndex: 'validUntil', render: (v) => formatDateTime(v as string) },
          {
            title: 'Active',
            dataIndex: 'active',
            render: (active, record) => (
              <Switch
                checked={active as boolean}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleMutation.mutate(record.id)}
              />
            ),
          },
          {
            title: 'Actions',
            render: (_, record) => (
              <ConfirmDeleteButton onConfirm={() => deleteMutation.mutate(record.id)} loading={deleteMutation.isPending} />
            ),
          },
        ]}
      />

      <Card sx={{ mt: 3, maxWidth: 480 }}>
        <CardHeader title="Apply Coupon Preview" titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }} />
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Coupon code"
              value={previewCode}
              onChange={(e) => setPreviewCode(e.target.value.toUpperCase())}
              fullWidth
            />
            <TextField
              label="Order Amount"
              type="number"
              value={previewAmount}
              onChange={(e) => setPreviewAmount(Number(e.target.value) || 0)}
              fullWidth
            />
            <Button
              variant="outlined"
              onClick={() => applyPreviewMutation.mutate()}
              loading={applyPreviewMutation.isPending}
              disabled={!previewCode}
            >
              Preview Discount
            </Button>
            {previewResult && (
              <div>
                <Typography variant="body2">Original: {formatCurrency(previewResult.originalAmount)}</Typography>
                <Typography variant="body2">Discount: {formatCurrency(previewResult.discountAmount)}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Final: {formatCurrency(previewResult.finalAmount)}
                </Typography>
              </div>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Coupon</DialogTitle>
        <DialogContent>
          <CouponForm onSubmit={(dto) => createMutation.mutate(dto)} submitting={createMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
