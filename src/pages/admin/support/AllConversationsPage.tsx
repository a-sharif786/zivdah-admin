import { useState } from 'react';
import { TextField, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { conversationApi } from '@/api/conversationApi';
import { formatDateTime } from '@/utils/format';
import type { ConversationStatus, ConversationSummaryDto } from '@/types/conversation';

const STATUSES: ConversationStatus[] = ['OPEN', 'WAITING', 'ACTIVE', 'CLOSED'];

export function AllConversationsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [status, setStatus] = useState<ConversationStatus | ''>('');
  const navigate = useNavigate();

  const { items, total, isLoading } = usePagedQuery<ConversationSummaryDto>(
    ['support-conversations', 'all', status || 'ALL'],
    (p, s) => conversationApi.getAll(p, s, status || undefined),
    page,
    size
  );

  return (
    <div>
      <PageHeader
        title="All Conversations"
        subtitle="Every conversation on the platform — admin-only oversight"
        extra={
          <TextField
            select
            size="small"
            label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ConversationStatus | '');
              setPage(0);
            }}
            sx={{ width: 200 }}
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
          { title: 'Type', dataIndex: 'type' },
          { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
          {
            title: 'Agent',
            dataIndex: 'assignedAgentId',
            render: (v, r) => r.assignedAgentName ?? (v ? `#${v}` : '-'),
          },
          { title: 'Updated', dataIndex: 'updatedAt', render: (v) => formatDateTime(v as string) },
        ]}
      />
    </div>
  );
}
