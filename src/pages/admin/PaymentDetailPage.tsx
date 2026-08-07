import { useParams, useNavigate } from 'react-router-dom';
import { Descriptions, Button, Popconfirm, message, Space } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { paymentApi } from '@/api/paymentApi';
import { formatCurrency, formatDateTime } from '@/utils/format';
import type { ApiError } from '@/types/common';

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
      message.success('Marked as successful');
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  const failedMutation = useMutation({
    mutationFn: () => paymentApi.markFailed(id),
    onSuccess: () => {
      message.success('Marked as failed');
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  if (isLoading || !payment) return <PageHeader title="Loading payment..." />;

  const isTerminal = ['SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(payment.status);

  return (
    <div>
      <PageHeader
        title={`Payment #${payment.paymentId}`}
        extra={
          <Space>
            <Button onClick={() => navigate('/admin/payments')}>Back</Button>
            {!isTerminal && (
              <>
                <Popconfirm title="Mark this payment as successful?" onConfirm={() => successMutation.mutate()}>
                  <Button type="primary" loading={successMutation.isPending}>
                    Mark Success
                  </Button>
                </Popconfirm>
                <Popconfirm title="Mark this payment as failed?" onConfirm={() => failedMutation.mutate()}>
                  <Button danger loading={failedMutation.isPending}>
                    Mark Failed
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        }
      />
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Status">
          <StatusTag value={payment.status} />
        </Descriptions.Item>
        <Descriptions.Item label="Order ID">{payment.orderId}</Descriptions.Item>
        <Descriptions.Item label="User ID">{payment.userId}</Descriptions.Item>
        <Descriptions.Item label="Amount">{formatCurrency(payment.amount, payment.currency)}</Descriptions.Item>
        <Descriptions.Item label="Method">{payment.method}</Descriptions.Item>
        <Descriptions.Item label="Transaction ID">{payment.transactionId ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="Gateway">{payment.gatewayName ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="Created">{formatDateTime(payment.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="Paid At">{formatDateTime(payment.paidAt)}</Descriptions.Item>
      </Descriptions>
    </div>
  );
}
