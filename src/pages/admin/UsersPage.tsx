import { useState } from 'react';
import { TextField, MenuItem, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { BooleanTag } from '@/components/common/StatusTag';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmButton } from '@/components/common/ConfirmButton';
import { authApi } from '@/api/authApi';
import { notify } from '@/utils/notify';
import type { AuthUserResponseDTO, Role } from '@/types/auth';
import type { ApiError } from '@/types/common';

const ROLES: Role[] = ['USER', 'ADMIN', 'VENDOR'];

export function UsersPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: authApi.getAllUsers });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: Role }) => authApi.updateRole(userId, { role }),
    onSuccess: () => {
      notify.success('Role updated');
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: (userId: number) => authApi.activateUser(userId),
    onSuccess: () => {
      notify.success('User activated');
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: number) => authApi.deactivateUser(userId),
    onSuccess: () => {
      notify.success('User deactivated');
      invalidate();
    },
    onError: (err: ApiError) => notify.error(err.message),
  });

  const rows = data ?? [];
  const paged = rows.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div>
      <PageHeader title="Users" />
      <DataTable<AuthUserResponseDTO>
        rowKey="userId"
        loading={isLoading}
        dataSource={paged}
        pagination={{
          page,
          pageSize,
          total: rows.length,
          onPageChange: setPage,
          onRowsPerPageChange: (s) => {
            setPageSize(s);
            setPage(0);
          },
        }}
        columns={[
          { title: 'ID', dataIndex: 'userId', width: 70 },
          { title: 'Name', dataIndex: 'name' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Mobile', dataIndex: 'mobile' },
          {
            title: 'Role',
            dataIndex: 'role',
            render: (role, record) => (
              <TextField
                select
                size="small"
                value={role as Role}
                sx={{ width: 120 }}
                onChange={(e) => roleMutation.mutate({ userId: record.userId, role: e.target.value as Role })}
                onClick={(e) => e.stopPropagation()}
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
            ),
          },
          {
            title: 'Status',
            dataIndex: 'active',
            render: (active) => <BooleanTag value={active as boolean} />,
          },
          {
            title: 'Actions',
            render: (_, record) => (
              <Stack direction="row" spacing={1}>
                {record.active ? (
                  <ConfirmButton
                    title="Deactivate this user?"
                    color="error"
                    onConfirm={() => deactivateMutation.mutate(record.userId)}
                  >
                    Deactivate
                  </ConfirmButton>
                ) : (
                  <ConfirmButton title="Activate this user?" onConfirm={() => activateMutation.mutate(record.userId)}>
                    Activate
                  </ConfirmButton>
                )}
              </Stack>
            ),
          },
        ]}
      />
    </div>
  );
}
