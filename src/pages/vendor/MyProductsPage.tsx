import { useState } from 'react';
import { Table, Button, Modal, Image, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDeleteButton } from '@/components/common/ConfirmDeleteButton';
import { ProductForm } from '@/components/forms/ProductForm';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { useAuth } from '@/hooks/useAuth';
import { productApi } from '@/api/productApi';
import { formatCurrency } from '@/utils/format';
import type { ProductRequestDto, ProductResponseDto } from '@/types/product';
import type { ApiError } from '@/types/common';

export function MyProductsPage() {
  const { user } = useAuth();
  const vendorId = user!.id;
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductResponseDto | null>(null);
  const queryClient = useQueryClient();

  const { items, total, isLoading } = usePagedQuery<ProductResponseDto>(
    ['vendor-products', vendorId],
    (p, s) => productApi.getByVendor(vendorId, p, s),
    page,
    size
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vendor-products', vendorId] });

  const createMutation = useMutation({
    mutationFn: ({ dto, image }: { dto: ProductRequestDto; image: File }) => productApi.create(dto, image),
    onSuccess: () => {
      message.success('Product created');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto, image }: { id: number; dto: ProductRequestDto; image: File | null }) =>
      productApi.update(id, dto, image),
    onSuccess: () => {
      message.success('Product updated');
      setModalOpen(false);
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.remove(id),
    onSuccess: () => {
      message.success('Product deleted');
      invalidate();
    },
    onError: (err: ApiError) => message.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="My Products"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            New Product
          </Button>
        }
      />
      <Table<ProductResponseDto>
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
          {
            title: 'Image',
            dataIndex: 'imageUrl',
            width: 70,
            render: (url: string) => <Image src={url} width={48} height={48} style={{ objectFit: 'cover' }} />,
          },
          { title: 'Name', dataIndex: 'name' },
          { title: 'Category', dataIndex: 'category' },
          { title: 'Price', dataIndex: 'price', render: (v: number) => formatCurrency(v) },
          { title: 'Stock', dataIndex: 'stockQuantity' },
          {
            title: 'In Stock',
            dataIndex: 'inStock',
            render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Yes' : 'No'}</Tag>,
          },
          {
            title: 'Actions',
            render: (_, record) => (
              <>
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(record);
                    setModalOpen(true);
                  }}
                  style={{ marginRight: 8 }}
                >
                  Edit
                </Button>
                <ConfirmDeleteButton onConfirm={() => deleteMutation.mutate(record.id)} loading={deleteMutation.isPending} />
              </>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? 'Edit Product' : 'New Product'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <ProductForm
          initial={editing}
          onSubmit={(dto, image) =>
            editing
              ? updateMutation.mutate({ id: editing.id, dto, image })
              : image && createMutation.mutate({ dto, image })
          }
          submitting={createMutation.isPending || updateMutation.isPending}
          requireImage={!editing}
        />
      </Modal>
    </div>
  );
}
