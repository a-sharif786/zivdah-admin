import { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { notificationApi } from '@/api/notificationApi';
import { formatDateTime } from '@/utils/format';
import type { NotificationResponseDto, SendNotificationRequest } from '@/types/notification';
import type { ApiError } from '@/types/common';

export function NotificationsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { items, total, isLoading } = usePagedQuery<NotificationResponseDto>(
    ['admin-notifications'],
    (p, s) => notificationApi.getAll(p, s),
    page,
    size
  );

  const sendMutation = useMutation({
    mutationFn: (payload: SendNotificationRequest) => notificationApi.send(payload),
    onSuccess: () => {
      message.success('Notification sent');
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Send Notification
          </Button>
        }
      />
      <Table<NotificationResponseDto>
        rowKey="id"
        loading={isLoading}
        dataSource={items}
        pagination={{
          current: page + 1,
          pageSize: size,
          total,
          onChange: (p, s) => {
            setPage(p - 1);
            setSize(s);
          },
        }}
        columns={[
          { title: 'User ID', dataIndex: 'userId' },
          { title: 'Title', dataIndex: 'title' },
          { title: 'Message', dataIndex: 'message' },
          { title: 'Status', dataIndex: 'status', render: (v: string) => <StatusTag value={v} /> },
          { title: 'Created', dataIndex: 'createdAt', render: formatDateTime },
        ]}
      />
      <Modal title="Send Notification" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={(v) => sendMutation.mutate(v)}>
          <Form.Item name="userId" label="User ID" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="message" label="Message" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={sendMutation.isPending} block>
              Send
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
