import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, TextField, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { notificationApi } from '@/api/notificationApi';
import { formatDateTime } from '@/utils/format';
import { notify } from '@/utils/notify';
import type { NotificationResponseDto } from '@/types/notification';
import type { ApiError } from '@/types/common';

export function NotificationsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const queryClient = useQueryClient();

  const { items, total, isLoading } = usePagedQuery<NotificationResponseDto>(
    ['admin-notifications'],
    (p, s) => notificationApi.getAll(p, s),
    page,
    size
  );

  const sendMutation = useMutation({
    mutationFn: () => notificationApi.send({ userId: Number(userId), title, message: messageText }),
    onSuccess: () => {
      notify.success('Notification sent');
      setModalOpen(false);
      setUserId('');
      setTitle('');
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        extra={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
            Send Notification
          </Button>
        }
      />
      <DataTable<NotificationResponseDto>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
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
          { title: 'User ID', dataIndex: 'userId' },
          { title: 'Title', dataIndex: 'title' },
          { title: 'Message', dataIndex: 'message' },
          { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
          { title: 'Created', dataIndex: 'createdAt', render: (v) => formatDateTime(v as string) },
        ]}
      />
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <Stack
            component="form"
            spacing={2.25}
            sx={{ pt: 1 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (userId && title && messageText) sendMutation.mutate();
            }}
          >
            <TextField label="User ID" type="number" value={userId} onChange={(e) => setUserId(e.target.value)} fullWidth required />
            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />
            <TextField
              label="Message"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              multiline
              rows={3}
              fullWidth
              required
            />
            <Button type="submit" variant="contained" loading={sendMutation.isPending} fullWidth>
              Send
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </div>
  );
}
