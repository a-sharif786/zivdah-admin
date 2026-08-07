import { useState } from 'react';
import { Table, Button, Modal, Form, InputNumber, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { inventoryApi } from '@/api/inventoryApi';
import { formatDateTime } from '@/utils/format';
import type { InventoryResponseDto, StockMutationRequest } from '@/types/inventory';
import type { ApiError } from '@/types/common';

export function InventoryPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { items, total, isLoading } = usePagedQuery<InventoryResponseDto>(
    ['admin-inventory'],
    (p, s) => inventoryApi.getAll(p, s),
    page,
    size
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });

  const addStockMutation = useMutation({
    mutationFn: (payload: StockMutationRequest) => inventoryApi.addStock(payload),
    onSuccess: () => {
      message.success('Stock added');
      setAddModalOpen(false);
      form.resetFields();
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="Inventory"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            Add Stock
          </Button>
        }
      />
      <Table<InventoryResponseDto>
        rowKey="productId"
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
          { title: 'Product ID', dataIndex: 'productId' },
          { title: 'Available', dataIndex: 'availableQuantity' },
          { title: 'Reserved', dataIndex: 'reservedQuantity' },
          { title: 'Last Updated', dataIndex: 'lastUpdated', render: formatDateTime },
        ]}
      />
      <Modal
        title="Add Stock"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(v) => addStockMutation.mutate(v)}>
          <Form.Item name="productId" label="Product ID" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={addStockMutation.isPending}>
                Add Stock
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
