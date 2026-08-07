import { Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

export function ConfirmDeleteButton({
  onConfirm,
  title = 'Are you sure you want to delete this?',
  loading,
  children,
}: {
  onConfirm: () => void;
  title?: string;
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <Popconfirm title={title} onConfirm={onConfirm} okText="Delete" okButtonProps={{ danger: true }}>
      <Button danger icon={<DeleteOutlined />} size="small" loading={loading}>
        {children ?? 'Delete'}
      </Button>
    </Popconfirm>
  );
}
