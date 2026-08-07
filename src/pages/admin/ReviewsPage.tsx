import { useState } from 'react';
import { Table, Rate, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDeleteButton } from '@/components/common/ConfirmDeleteButton';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { reviewApi } from '@/api/reviewApi';
import { formatDateTime } from '@/utils/format';
import type { ReviewResponseDto } from '@/types/review';
import type { ApiError } from '@/types/common';

export function ReviewsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const queryClient = useQueryClient();

  const { items, total, isLoading } = usePagedQuery<ReviewResponseDto>(
    ['admin-reviews'],
    (p, s) => reviewApi.getAll(p, s),
    page,
    size
  );

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reviewApi.remove(id),
    onSuccess: () => {
      message.success('Review deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  return (
    <div>
      <PageHeader title="Reviews" />
      <Table<ReviewResponseDto>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        pagination={{
          current: page + 1,
          pageSize: size,
          total,
          onChange: (p, s) => {
            setPage(p - 1);
            setSize(s);
          },
        }}
        columns={[
          { title: 'Product ID', dataIndex: 'productId' },
          { title: 'User ID', dataIndex: 'userId' },
          { title: 'Rating', dataIndex: 'rating', render: (v: number) => <Rate disabled value={v} /> },
          { title: 'Comment', dataIndex: 'comment' },
          { title: 'Created', dataIndex: 'createdAt', render: formatDateTime },
          {
            title: 'Actions',
            render: (_, record) => (
              <ConfirmDeleteButton onConfirm={() => deleteMutation.mutate(record.id)} loading={deleteMutation.isPending} />
            ),
          },
        ]}
      />
    </div>
  );
}
