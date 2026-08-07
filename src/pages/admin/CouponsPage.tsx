import { useState } from 'react';
import { Table, Button, Modal, Switch, message, Card, InputNumber, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDeleteButton } from '@/components/common/ConfirmDeleteButton';
import { CouponForm } from '@/components/forms/CouponForm';
import { couponApi } from '@/api/couponApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { ApplyCouponResponseDto, CouponRequestDto, CouponResponseDto } from '@/types/coupon';
import type { ApiError } from '@/types/common';

const { Text } = Typography;

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
      message.success('Coupon created');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => couponApi.toggle(id),
    onSuccess: invalidate,
    onError: (err: ApiError) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => couponApi.remove(id),
    onSuccess: () => {
      message.success('Coupon deleted');
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  const applyPreviewMutation = useMutation({
    mutationFn: () => couponApi.apply({ code: previewCode, orderAmount: previewAmount }),
    onSuccess: setPreviewResult,
    onError: (err: ApiError) => message.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="Coupons"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            New Coupon
          </Button>
        }
      />
      <Table<CouponResponseDto>
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        pagination={false}
        columns={[
          { title: 'Code', dataIndex: 'code' },
          { title: 'Type', dataIndex: 'discountType' },
          {
            title: 'Value',
            dataIndex: 'discountValue',
            render: (v: number, r) => (r.discountType === 'PERCENTAGE' ? `${v}%` : formatCurrency(v)),
          },
          { title: 'Used / Limit', render: (_, r) => `${r.usedCount} / ${r.usageLimit}` },
          { title: 'Valid From', dataIndex: 'validFrom', render: formatDateTime },
          { title: 'Valid Until', dataIndex: 'validUntil', render: formatDateTime },
          {
            title: 'Active',
            dataIndex: 'active',
            render: (active: boolean, record) => (
              <Switch checked={active} onChange={() => toggleMutation.mutate(record.id)} />
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

      <Card title="Apply Coupon Preview" style={{ marginTop: 24, maxWidth: 480 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space.Compact style={{ width: '100%' }}>
            <input
              placeholder="Coupon code"
              value={previewCode}
              onChange={(e) => setPreviewCode(e.target.value.toUpperCase())}
              style={{ flex: 1, padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6 }}
            />
          </Space.Compact>
          <InputNumber
            addonBefore="Order Amount"
            value={previewAmount}
            onChange={(v) => setPreviewAmount(v ?? 0)}
            style={{ width: '100%' }}
          />
          <Button
            onClick={() => applyPreviewMutation.mutate()}
            loading={applyPreviewMutation.isPending}
            disabled={!previewCode}
          >
            Preview Discount
          </Button>
          {previewResult && (
            <div>
              <Text>Original: {formatCurrency(previewResult.originalAmount)}</Text>
              <br />
              <Text>Discount: {formatCurrency(previewResult.discountAmount)}</Text>
              <br />
              <Text strong>Final: {formatCurrency(previewResult.finalAmount)}</Text>
            </div>
          )}
        </Space>
      </Card>

      <Modal title="New Coupon" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnHidden>
        <CouponForm onSubmit={(dto) => createMutation.mutate(dto)} submitting={createMutation.isPending} />
      </Modal>
    </div>
  );
}
