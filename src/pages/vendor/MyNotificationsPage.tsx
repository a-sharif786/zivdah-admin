import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { useAuth } from '@/hooks/useAuth';
import { notificationApi } from '@/api/notificationApi';
import { formatDateTime } from '@/utils/format';
import type { NotificationResponseDto } from '@/types/notification';

// GET /notifications/user/{userId} returns a bare, unpaginated array (no page/size params),
// so — same client-side pagination fallback as MyReviewsPage.tsx/MyInventoryPage.tsx — fetch
// once and slice locally rather than wiring this into usePagedQuery.
export function MyNotificationsPage() {
  const { user } = useAuth();
  const vendorId = user!.id;
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-notifications', vendorId],
    queryFn: () => notificationApi.getByUser(vendorId),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-notifications', vendorId] }),
  });

  const notifications = (data ?? []).slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const paged = notifications.slice(page * size, page * size + size);

  return (
    <div>
      <PageHeader title="My Notifications" />
      <DataTable<NotificationResponseDto>
        rowKey="id"
        loading={isLoading}
        dataSource={paged}
        emptyText="No notifications yet"
        onRowClick={(row) => {
          if (!row.isRead) markReadMutation.mutate(row.id);
        }}
        pagination={{
          page,
          pageSize: size,
          total: notifications.length,
          onPageChange: setPage,
          onRowsPerPageChange: (s) => {
            setSize(s);
            setPage(0);
          },
        }}
        columns={[
          {
            title: 'Title',
            dataIndex: 'title',
            render: (v, row) => (
              <Box sx={{ fontWeight: row.isRead ? 400 : 700 }}>
                {!row.isRead && (
                  <Box
                    component="span"
                    sx={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mr: 1 }}
                  />
                )}
                {v as string}
              </Box>
            ),
          },
          { title: 'Message', dataIndex: 'message' },
          { title: 'Type', dataIndex: 'notificationType', render: (v) => (v ? <StatusTag value={v as string} /> : '-') },
          { title: 'Status', dataIndex: 'status', render: (v) => <StatusTag value={v as string} /> },
          { title: 'Received', dataIndex: 'createdAt', render: (v) => formatDateTime(v as string) },
        ]}
      />
    </div>
  );
}
