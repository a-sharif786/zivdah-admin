import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, Switch, Rating, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { SupportAgentForm } from '@/components/forms/SupportAgentForm';
import { conversationApi } from '@/api/conversationApi';
import { notify } from '@/utils/notify';
import type { CreateSupportAgentRequest, SupportAgentDto } from '@/types/conversation';
import type { ApiError } from '@/types/common';

export function SupportAgentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['support-agents'], queryFn: conversationApi.getAgents });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['support-agents'] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSupportAgentRequest) => conversationApi.createAgent(payload),
    onSuccess: () => {
      notify.success('Agent added');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (userId: number) => conversationApi.toggleAgent(userId),
    onSuccess: invalidate,
    onError: (err: ApiError) => notify.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="Support Agents"
        subtitle="Roster of ADMIN users flagged to handle live chats"
        extra={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
            Add Agent
          </Button>
        }
      />
      <DataTable<SupportAgentDto>
        rowKey="userId"
        loading={isLoading}
        dataSource={data ?? []}
        columns={[
          { title: 'Name', dataIndex: 'displayName' },
          { title: 'Email', dataIndex: 'email', render: (v) => (v as string) ?? '-' },
          {
            title: 'Active',
            dataIndex: 'active',
            render: (active, record) => (
              <Switch
                checked={active as boolean}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleMutation.mutate(record.userId)}
              />
            ),
          },
          { title: 'Active Chats', dataIndex: 'currentActiveChats', render: (v, r) => `${v} / ${r.maxConcurrentChats}` },
          { title: 'Total Handled', dataIndex: 'totalHandled' },
          {
            title: 'Avg Rating',
            dataIndex: 'avgRating',
            render: (v) => (v ? <Rating readOnly size="small" precision={0.1} value={v as number} /> : '-'),
          },
        ]}
      />
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Agent</DialogTitle>
        <DialogContent>
          <Box sx={{ pb: 1 }}>
            <SupportAgentForm
              onSubmit={(payload) => createMutation.mutate(payload)}
              submitting={createMutation.isPending}
              existingUserIds={(data ?? []).map((a) => a.userId)}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
}
