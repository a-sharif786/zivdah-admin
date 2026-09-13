import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { conversationApi } from '@/api/conversationApi';
import { formatDateTime } from '@/utils/format';
import type { ConversationSummaryDto } from '@/types/conversation';

export function MyChatsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const navigate = useNavigate();

  const { items, total, isLoading } = usePagedQuery<ConversationSummaryDto>(
    ['support-conversations', 'mine'],
    (p, s) => conversationApi.getMine(p, s),
    page,
    size
  );

  return (
    <div>
      <PageHeader title="My Chats" subtitle="Conversations assigned to you, across all statuses" />
      <DataTable<ConversationSummaryDto>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        onRowClick={(r) =>
          navigate(
            r.status === 'ACTIVE'
              ? `/admin/support/live?conversationId=${r.id}`
              : `/admin/support/conversations/${r.id}`
          )
        }
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
          { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
          { title: 'Topic', dataIndex: 'topic', render: (v) => (v as string) ?? '-' },
          { title: 'Last message', dataIndex: 'lastMessage', render: (v) => (v as string) ?? '-' },
          { title: 'Updated', dataIndex: 'updatedAt', render: (v) => formatDateTime(v as string) },
        ]}
      />
    </div>
  );
}
