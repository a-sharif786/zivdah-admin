import { useState } from 'react';
import { Table, Select, message, Popconfirm, Button, Space } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { BooleanTag } from '@/components/common/StatusTag';
import { authApi } from '@/api/authApi';
import type { AuthUserResponseDTO, Role } from '@/types/auth';
import type { ApiError } from '@/types/common';

const ROLES: Role[] = ['USER', 'ADMIN', 'VENDOR'];

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: authApi.getAllUsers });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: Role }) => authApi.updateRole(userId, { role }),
    onSuccess: () => {
      message.success('Role updated');
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: (userId: number) => authApi.activateUser(userId),
    onSuccess: () => {
      message.success('User activated');
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: number) => authApi.deactivateUser(userId),
    onSuccess: () => {
      message.success('User deactivated');
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  return (
    <div>
      <PageHeader title="Users" />
      <Table<AuthUserResponseDTO>
        rowKey="userId"
        loading={isLoading}
        dataSource={data ?? []}
        pagination={{
          current: page,
          pageSize,
          onChange: (p, s) => {
            setPage(p);
            setPageSize(s);
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
            render: (role: Role, record) => (
              <Select
                size="small"
                value={role}
                style={{ width: 110 }}
                options={ROLES.map((r) => ({ label: r, value: r }))}
                onChange={(newRole) => roleMutation.mutate({ userId: record.userId, role: newRole })}
              />
            ),
          },
          {
            title: 'Status',
            dataIndex: 'active',
            render: (active: boolean) => <BooleanTag value={active} />,
          },
          {
            title: 'Actions',
            render: (_, record) => (
              <Space>
                {record.active ? (
                  <Popconfirm title="Deactivate this user?" onConfirm={() => deactivateMutation.mutate(record.userId)}>
                    <Button size="small" danger>
                      Deactivate
                    </Button>
                  </Popconfirm>
                ) : (
                  <Popconfirm title="Activate this user?" onConfirm={() => activateMutation.mutate(record.userId)}>
                    <Button size="small">Activate</Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
