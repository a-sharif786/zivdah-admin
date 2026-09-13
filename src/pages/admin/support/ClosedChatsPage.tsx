import { useState } from 'react';
import { Rating } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { conversationApi } from '@/api/conversationApi';
import { formatDateTime } from '@/utils/format';
import type { ConversationSummaryDto } from '@/types/conversation';

export function ClosedChatsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const navigate = useNavigate();

  const { items, total, isLoading } = usePagedQuery<ConversationSummaryDto>(
    ['support-conversations', 'closed'],
    (p, s) => conversationApi.getAll(p, s, 'CLOSED'),
    page,
    size
  );

  return (
    <div>
      <PageHeader title="Closed Chats" />
      <DataTable<ConversationSummaryDto>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        onRowClick={(r) => navigate(`/admin/support/conversations/${r.id}`)}
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
          {
            title: 'Agent',
            dataIndex: 'assignedAgentId',
            render: (v, r) => r.assignedAgentName ?? (v ? `#${v}` : '-'),
          },
          {
            title: 'Rating',
            dataIndex: 'rating',
            render: (v) => (v ? <Rating readOnly size="small" value={v as number} /> : '-'),
          },
          { title: 'Closed', dataIndex: 'closedAt', render: (v) => formatDateTime(v as string) },
        ]}
      />
    </div>
  );
}
