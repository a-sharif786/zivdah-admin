import { useState } from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { conversationApi } from '@/api/conversationApi';
import { formatDateTime } from '@/utils/format';
import { notify } from '@/utils/notify';
import type { ConversationSummaryDto } from '@/types/conversation';
import type { ApiError } from '@/types/common';

export function WaitingQueuePage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { items, total, isLoading } = usePagedQuery<ConversationSummaryDto>(
    ['support-conversations', 'waiting'],
    (p, s) => conversationApi.getWaiting(p, s),
    page,
    size
  );

  const acceptMutation = useMutation({
    mutationFn: (id: number) => conversationApi.accept(id),
    onSuccess: (_data, id) => {
      notify.success('Conversation accepted');
      queryClient.invalidateQueries({ queryKey: ['support-conversations'] });
      navigate(`/admin/support/live?conversationId=${id}`);
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  return (
    <div>
      <PageHeader title="Waiting Queue" subtitle="Customers who have asked for a human agent" />
      <DataTable<ConversationSummaryDto>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        emptyText="No one is waiting right now"
        pagination={{
          page,
          pageSize: size,
          total,
          onPageChange: setPage,
          onRowsPerPageChange: (s) => {
            setSize(s);
            setPage(0);
          },
        }}
        columns={[
          { title: 'Conversation #', dataIndex: 'id' },
          { title: 'Customer', dataIndex: 'customerId', render: (v, r) => r.customerName ?? `#${v}` },
          { title: 'Topic', dataIndex: 'topic', render: (v) => (v as string) ?? '-' },
          { title: 'Order', dataIndex: 'orderId', render: (v) => (v ? `#${v}` : '-') },
          {
            title: 'Waiting since',
            dataIndex: 'handedOffAt',
            render: (v, r) => formatDateTime((v as string) ?? r.createdAt),
          },
          {
            title: 'Actions',
            render: (_, record) => (
              <Button
                size="small"
                variant="contained"
                loading={acceptMutation.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  acceptMutation.mutate(record.id);
                }}
              >
                Accept
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
